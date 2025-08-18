// realtime/groups.js
const mongoose = require("mongoose");
const Group = require("../../models/groupModel");
const Message = require("../../models/messageModel");

const onlineByGroup = new Map(); // { groupId -> Set<userId> }

module.exports = function registerGroupHandlers(io, socket) {
    const userId = socket.userId;

    socket.on("group:join", async ({ groupId }, ack) => {
         console.log("[ws] group:join", { sid: socket.id, userId, groupId });

        if (!mongoose.isValidObjectId(groupId)) return ack && ack({ ok: false, error: "Bad groupId" });

        const group = await Group.findById(groupId).select("_id members");
        if (!group) {
            console.warn("message:send group not found", { groupId });
            return ack && ack({ ok: false, error: "Group not found" });
        }
        const isMember = group.members.some((m) => String(m) === String(userId));
        if (!isMember) {
            console.warn("message:send forbidden", { groupId, userId });
            return ack && ack({ ok: false, error: "Forbidden" });
        }

        socket.join(`group:${groupId}`);

        let set = onlineByGroup.get(groupId);
        if (!set) {
            set = new Set();
            onlineByGroup.set(groupId, set);
        }
        set.add(String(userId));

        io.to(`group:${groupId}`).emit("presence:update", {
            groupId,
            onlineUserIds: Array.from(set)
        });

        ack && ack({ ok: true });
    });

    socket.on("group:leave", ({ groupId }) => {
        socket.leave(`group:${groupId}`);
    });

    socket.on("message:send", async ({ groupId, text, clientId }, ack) => {
        try {
            console.log("[ws] message:send", { sid: socket.id, userId, groupId, textLen: text?.length, clientId });

            if (!socket.userId) {
                console.error("message:send missing userId on socket");
                return ack && ack({ ok: false, error: "Unauthorized" });
            }
            if (!text || !text.trim()) return ack && ack({ ok: false, error: "Empty" });

            const group = await Group.findById(groupId).select("_id members");
            if (!group) return ack && ack({ ok: false, error: "Group not found" });
            if (!group.members.some((m) => String(m) === String(userId)))
                return ack && ack({ ok: false, error: "Forbidden" });
            if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(userId)) {
                console.error("[ws] bad ids", { groupId, userId });
                return ack && ack({ ok: false, error: "Bad identifiers" });
            }

            const isValidGroup = mongoose.isValidObjectId(groupId);
            const isValidUser = mongoose.isValidObjectId(userId);
            if (!isValidGroup || !isValidUser) {
                console.error("Invalid ObjectId(s) for message", { groupId, userId });
                return ack && ack({ ok: false, error: "Bad identifiers" });
            }
            let msg = clientId ? await Message.findOne({ clientId }) : null;

            if (!msg) {
                msg = await Message.create({
                    group: new mongoose.Types.ObjectId(groupId),
                    author: new mongoose.Types.ObjectId(userId),
                    body: { text: String(text).slice(0, 5000) },
                    clientId,
                    deliveredTo: [],
                    readBy: [userId]
                });
                await Group.findByIdAndUpdate(groupId, { lastMessage: msg._id });
            }

            const payload = await msg.populate([{ path: "author", select: "fullName profileImage _id" }]);

            io.to(`group:${groupId}`).emit("message:new", payload);
            ack && ack({ ok: true, message: payload });
        } catch (e) {
            console.error("[ws] message:send error", e);
            ack && ack({ ok: false, error: e?.message || "Server error" });
        }
    });

    socket.on("typing:start", ({ groupId }) => {
        socket.to(`group:${groupId}`).emit("typing:update", { groupId, userId, typing: true });
    });

    socket.on("typing:stop", ({ groupId }) => {
        socket.to(`group:${groupId}`).emit("typing:update", { groupId, userId, typing: false });
    });

    socket.on("message:read", async ({ groupId, messageIds }) => {
        try {
            await Message.updateMany(
                { _id: { $in: messageIds || [] }, group: groupId, readBy: { $ne: userId } },
                { $addToSet: { readBy: userId } }
            );
            socket.to(`group:${groupId}`).emit("message:read:update", { groupId, userId, messageIds });
        } catch (_) { }
    });

    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (!room.startsWith("group:")) continue;
            const groupId = room.split(":")[1];
            const set = onlineByGroup.get(groupId);
            if (set) {
                set.delete(String(userId));
                if (set.size) {
                    io.to(room).emit("presence:update", { groupId, onlineUserIds: Array.from(set) });
                } else {
                    onlineByGroup.delete(groupId);
                }
            }
        }
    });
};
