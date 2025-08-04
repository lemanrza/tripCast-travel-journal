const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TravelList",
        required: true,
    },
}, { timestamps: true });

module.exports = messageSchema;