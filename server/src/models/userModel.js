import mongoose from "mongoose";
import userSchema from "../schemas/userSchema.js";

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
