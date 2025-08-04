const mongoose = require("mongoose");
const journalEntry = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    photos: {
        type: [String],
        default: [],
    },
    destinations: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination",
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    public: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = journalEntry;