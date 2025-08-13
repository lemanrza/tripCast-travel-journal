const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema({
    content: { type: String, required: true, trim: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: "JournalEntry", required: true },
}, { timestamps: true });
module.exports = commentSchema;