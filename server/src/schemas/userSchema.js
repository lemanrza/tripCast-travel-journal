const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        fullName: { type: String, required: true, trim: true },
        password: { type: String, required: true },
        profileImage: {
            url: {
                type: String,
                default:
                    'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541',
            },
            public_id: {
                type: String,
            },
        },
        premium: { type: Boolean, default: false },
        lists: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "TravelList",
                },
            ],
            default: [],
        },
        journals: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "JournalEntry",
                },
            ],
            default: [],
        },
        loginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
        isVerified: { type: Boolean, default: false },
        provider: {
            type: String,
            enum: ["local", "google", "instagram"],
            default: "local",
        },
        providerId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);
module.exports = userSchema;