const mongoose = require("mongoose");
const messageSchema = require("../schemas/messageSchema");

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel;
