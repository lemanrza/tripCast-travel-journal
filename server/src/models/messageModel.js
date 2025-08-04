import mongoose from "mongoose";
import messageSchema from "../schemas/messageSchema";

const MessageModel = mongoose.model("Message", messageSchema);

export default MessageModel;
