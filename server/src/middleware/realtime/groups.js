const mongoose = require("mongoose");
const Group = require("../../models/groupModel");
const Message = require("../../models/messageModel");

const onlineByGroup = new Map(); 

module.exports = function registerGroupHandlers(io, socket) {
  const userId = socket.userId;

  socket.on("group:join", async ({ groupId }, ack) => {
    try {
      if (!mongoose.isValidObjectId(groupId)) return ack && ack({ ok: false, error: "Bad groupId" });

      const group = await Group.findById(groupId).select("_id members");
      if (!group) return ack && ack({ ok: false, error: "Group not found" });
      if (!group.members.some((m) => String(m) === String(userId)))
        return ack && ack({ ok: false, error: "Forbidden" });

      socket.join(`group:${groupId}`);

      let set = onlineByGroup.get(groupId);
      if (!set) { set = new Set(); onlineByGroup.set(groupId, set); }
      set.add(String(userId));

      io.to(`group:${groupId}`).emit("presence:update", {
        groupId,
        onlineUserIds: Array.from(set)
      });

      ack && ack({ ok: true });
    } catch (e) {
      ack && ack({ ok: false, error: e?.message || "Server error" });
    }
  });

  socket.on("group:leave", ({ groupId }) => {
    socket.leave(`group:${groupId}`);
  });

  // SEND with reply + media
  socket.on("message:send", async (payload, ack) => {
    try {
      const { groupId, text, audioUrl, imageUrl, videoUrl, fileUrl, fileName, replyTo, clientId } = payload || {};

      if (!socket.userId) return ack && ack({ ok: false, error: "Unauthorized" });
      if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(userId))
        return ack && ack({ ok: false, error: "Bad identifiers" });

      const group = await Group.findById(groupId).select("_id members");
      if (!group) return ack && ack({ ok: false, error: "Group not found" });
      if (!group.members.some((m) => String(m) === String(userId)))
        return ack && ack({ ok: false, error: "Forbidden" });

      const hasContent = (text && text.trim()) || audioUrl || imageUrl || videoUrl || fileUrl;
      if (!hasContent) return ack && ack({ ok: false, error: "Empty" });

      // dedupe by clientId
      let msg = clientId ? await Message.findOne({ clientId, group: groupId }) : null;

      // validate replyTo
      let replyRef = null;
      if (replyTo && mongoose.isValidObjectId(replyTo)) {
        const ref = await Message.findById(replyTo).select("_id group");
        if (ref && String(ref.group) === String(groupId)) replyRef = ref._id;
      }

      if (!msg) {
        const body = {};
        if (text && text.trim()) body.text = String(text).slice(0, 5000);
        if (audioUrl) body.audioUrl = audioUrl;
        if (imageUrl) body.imageUrl = imageUrl;
        if (videoUrl) body.videoUrl = videoUrl;
        if (fileUrl) { body.fileUrl = fileUrl; if (fileName) body.fileName = fileName; }

        msg = await Message.create({
          group: new mongoose.Types.ObjectId(groupId),
          author: new mongoose.Types.ObjectId(userId),
          clientId,
          body,
          replyTo: replyRef || null,
          readBy: [userId],
        });

        await Group.findByIdAndUpdate(groupId, { lastMessage: msg._id });
      }

      const payloadOut = await Message.findById(msg._id)
        .populate({ path: "author", select: "fullName profileImage _id" })
        .populate({ path: "replyTo", select: "author body createdAt", populate: { path: "author", select: "fullName profileImage" } })
        .populate({ path: "reactions.by", select: "fullName profileImage" });

      io.to(`group:${groupId}`).emit("message:new", payloadOut);
      ack && ack({ ok: true, message: payloadOut });
    } catch (e) {
      console.error("[ws] message:send error", e);
      ack && ack({ ok: false, error: e?.message || "Server error" });
    }
  });

  // REACTIONS: toggle add/remove
  socket.on("message:react", async ({ groupId, messageId, emoji }, ack) => {
    try {
      if (!mongoose.isValidObjectId(groupId) || !mongoose.isValidObjectId(messageId))
        return ack && ack({ ok: false, error: "Bad identifiers" });

      const group = await Group.findById(groupId).select("_id members");
      if (!group) return ack && ack({ ok: false, error: "Group not found" });
      if (!group.members.some((m) => String(m) === String(userId)))
        return ack && ack({ ok: false, error: "Forbidden" });

      emoji = String(emoji || "").trim().slice(0, 32);
      if (!emoji) return ack && ack({ ok: false, error: "Bad emoji" });

      const base = { _id: messageId, group: groupId };
      const exists = await Message.exists({ ...base, reactions: { $elemMatch: { emoji, by: userId } } });

      let action = "added";
      if (exists) {
        await Message.updateOne(base, { $pull: { reactions: { emoji, by: userId } } });
        action = "removed";
      } else {
        await Message.updateOne(base, { $addToSet: { reactions: { emoji, by: userId, createdAt: new Date() } } });
      }

      const doc = await Message.findById(messageId)
        .populate({ path: "author", select: "fullName profileImage _id" })
        .populate({ path: "replyTo", select: "author body createdAt", populate: { path: "author", select: "fullName profileImage" } })
        .populate({ path: "reactions.by", select: "fullName profileImage" });

      io.to(`group:${groupId}`).emit("message:reaction", {
        groupId,
        messageId,
        emoji,
        by: userId,
        action,
        message: doc,
      });

      ack && ack({ ok: true, action, message: doc });
    } catch (e) {
      console.error("[ws] message:react error", e);
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
    } catch (_) {}
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
