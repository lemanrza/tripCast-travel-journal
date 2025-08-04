const mongoose = require("mongoose");
const userSchema = require("../schemas/userSchema.js");

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
