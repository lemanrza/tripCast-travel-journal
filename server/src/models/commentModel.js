import mongoose from "mongoose";
import commentSchema from "../schemas/commentSchema";

const CommentModel = mongoose.model("Comment", commentSchema);

export default CommentModel;
