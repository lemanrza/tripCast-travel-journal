const mongoose = require("mongoose");
const Message = require("../models/messageModel");
const Group = require("../models/groupModel");

async function listGroupMessages(groupId, cursor, limit = 30) {
  const filter = { group: groupId };
  if (cursor) filter._id = { $lt: cursor };

  const items = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(Math.min(100, Number(limit)))
    .populate("author", "fullName profileImage")
    .populate({
      path: "replyTo",
      populate: { path: "author", select: "fullName profileImage" },
    });

  return { items: items.reverse(), nextCursor: items.length ? items[0]._id : null };
}

async function sendMessage({
  groupId, authorId, text, audioUrl, imageUrl, videoUrl, fileUrl, fileName, clientId, replyTo
}) {
  const hasContent = (text && text.trim()) || audioUrl || imageUrl || videoUrl || fileUrl;
  if (!hasContent) throw new Error("Empty");

  const body = {};
  if (text && text.trim()) body.text = String(text).slice(0, 5000);
  if (audioUrl) body.audioUrl = audioUrl;
  if (imageUrl) body.imageUrl = imageUrl;
  if (videoUrl) body.videoUrl = videoUrl;
  if (fileUrl) { body.fileUrl = fileUrl; if (fileName) body.fileName = fileName; }

  let msg = clientId ? await Message.findOne({ clientId, group: groupId }) : null;

  if (!msg) {
    const doc = {
      group: new mongoose.Types.ObjectId(groupId),
      author: new mongoose.Types.ObjectId(authorId),
      clientId,
      body,
      readBy: [authorId],
    };
    if (replyTo && mongoose.isValidObjectId(replyTo)) doc.replyTo = replyTo;

    msg = await Message.create(doc);
    await Group.findByIdAndUpdate(groupId, { lastMessage: msg._id });
  }

  // ✅ IMPORTANT: use a single awaited populate on the document
  await msg.populate([
    { path: "author", select: "fullName profileImage" },
    { path: "replyTo", populate: { path: "author", select: "fullName profileImage" } },
  ]);

  return msg;
}


module.exports = { listGroupMessages, sendMessage };
