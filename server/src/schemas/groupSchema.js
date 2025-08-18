const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        listId: { type: String, ref: "TravelList" },
        profileImage: {
            url: {
                type: String,
                default: "https://i.pinimg.com/originals/c0/62/d1/c062d17d2ef63bc5fee25dc1c9c0c104.jpg"
            },
            public_id: {
                type: String,
                default: ""
            }
        },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
        admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
    },
    { timestamps: true }
);

module.exports = groupSchema;
