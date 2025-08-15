const mongoose = require("mongoose");

const collaboratorRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    list: { type: mongoose.Schema.Types.ObjectId, ref: "TravelList", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);
module.exports = collaboratorRequestSchema; 