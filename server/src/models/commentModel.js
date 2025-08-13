const mongoose = require("mongoose");
const commentSchema = require("../schemas/commentSchema");

const CommentModel = mongoose.model("Comment", commentSchema);

module.exports = CommentModel;
