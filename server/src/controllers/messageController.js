const { listGroupMessages, sendMessage } = require("../services/messageServices");

async function httpList(req, res) {
    try {
        const { groupId } = req.params;
        const { cursor, limit } = req.query;
        const data = await listGroupMessages(groupId, cursor, Number(limit || 30));
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

async function httpSendMessage(req, res) {
    try {
        const { groupId } = req.params;
        const { text, clientId } = req.body || {};
        const authorId = req.user && req.user._id;
        if (!text?.trim()) return res.status(400).json({ message: "Empty" });

        const msg = await sendMessage({ groupId, authorId, text, clientId });

        const io = req.app.get("io");
        if (io) io.to(`group:${groupId}`).emit("message:new", msg);

        res.json({ ok: true, message: msg });
    } catch (e) {
        console.error("httpSendMessage error", e);
        res.status(500).json({ ok: false, message: e?.message || "Server error" });
    }
};

module.exports = { httpList, httpSendMessage };
