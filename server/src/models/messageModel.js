const mongoose =require( "mongoose");
import messageSchema from "../schemas/messageSchema";

const MessageModel = mongoose.model("Message", messageSchema);

module.exports = MessageModel;
