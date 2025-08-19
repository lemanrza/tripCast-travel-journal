// models/messageModel.js (reference)
const mongoose = require("mongoose");
const msgSchema = new mongoose.Schema(
    {
        group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", index: true, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        body: {
            text: { type: String },
            imageUrl: { type: String },
            fileUrl: { type: String },
            fileName: { type: String },
            audioUrl: { type: String },
        },
         deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        clientId: { type: String, index: true },
    },
    { timestamps: true }
);
module.exports = msgSchema;
