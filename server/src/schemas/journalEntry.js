const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    photos: {
        type: [{
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        }],
        default: [],
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination",
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    comments: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Comment",
        default: [],
    },
    likes: {
        type: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        default: [], 
    },
    public: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = journalEntrySchema;