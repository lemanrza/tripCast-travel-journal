const mongoose = require("mongoose");

const achievementsSchema = new mongoose.Schema({
    key: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
});

module.exports=achievementsSchema