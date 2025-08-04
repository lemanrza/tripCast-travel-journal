const mongoose = require("mongoose");
const travelListSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        tags: {
            type: [String],
            default: [],
        },
        isPublic: { type: Boolean, default: true },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        collaborators: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            default: [],
        },
        coverImage: {
            type: String,
            default:
                "https://img.freepik.com/free-vector/default-cover-image_23-2148511230.jpg",
        },
        destinations: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Destination",
        },
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            default: null,
        },
    }, { timestamps: true });
    
module.exports = travelListSchema;
