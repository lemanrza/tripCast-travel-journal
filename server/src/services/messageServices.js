const Message = require("../models/messageModel");
const Group = require("../models/groupModel");

async function listGroupMessages(groupId, cursor, limit = 30) {
  const filter = { group: groupId };
  if (cursor) filter._id = { $lt: cursor };

  const items = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(Math.min(100, Number(limit)))
    .populate("author");

  return { items: items.reverse(), nextCursor: items.length ? items[0]._id : null };
}

// services/messageService.js
async function sendMessage({ groupId, authorId, text, audioUrl, imageUrl, fileUrl, fileName, clientId }) {
  const hasContent = (text && text.trim()) || audioUrl || imageUrl || fileUrl;
  if (!hasContent) throw new Error("Empty");

  const body = {};
  if (text && text.trim()) body.text = String(text).slice(0, 5000);
  if (audioUrl) body.audioUrl = audioUrl;
  if (imageUrl) body.imageUrl = imageUrl;
  if (fileUrl) { body.fileUrl = fileUrl; if (fileName) body.fileName = fileName; }

  let msg = clientId ? await Message.findOne({ clientId, group: groupId }) : null;
  if (!msg) {
    msg = await Message.create({
      group: groupId,
      author: authorId,
      clientId,
      body,
      readBy: [authorId],
    });
    await Group.findByIdAndUpdate(groupId, { lastMessage: msg._id });
  }
  return msg.populate("author");
}


module.exports = { listGroupMessages, sendMessage };
