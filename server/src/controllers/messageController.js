const { listGroupMessages, sendMessage, toggleReaction } = require("../services/messageServices");

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
    const { text, audioUrl, imageUrl, videoUrl, fileUrl, fileName, clientId, replyTo } = req.body || {};
    const authorId = req.user && req.user._id;

    const hasContent = (text && text.trim()) || audioUrl || imageUrl || videoUrl || fileUrl;
    if (!hasContent) return res.status(400).json({ ok: false, message: "Empty" });

    const msg = await sendMessage({
      groupId, authorId, text, audioUrl, imageUrl, videoUrl, fileUrl, fileName, clientId, replyTo
    });

    const io = req.app.get("io");
    if (io) io.to(`group:${groupId}`).emit("message:new", msg);

    res.json({ ok: true, message: msg });
  } catch (e) {
    console.error("httpSendMessage error", e);
    res.status(500).json({ ok: false, message: e?.message || "Server error" });
  }
}



module.exports = { httpList, httpSendMessage };
