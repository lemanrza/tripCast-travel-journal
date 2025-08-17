const express = require("express");
const userValidate = require("../middleware/userValidate.js");
const {
    getUserById,
    getUsers,
    searchUsers,
    loginUser,
    registerUser,
    verifyUserEmail,
    forgotPassword,
    resetPassword,
    unlockAccount,
    updateUserById,
    changeUserPassword
} = require("../controllers/userController.js");
const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.get("/search", searchUsers);
userRouter.post("/register", userValidate, registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify-email", verifyUserEmail);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/unlock-account", unlockAccount);
userRouter.get("/user/:id", getUserById);
userRouter.patch("/user/:id", updateUserById);
userRouter.patch("/user/:id/password", changeUserPassword);
userRouter.put("/user/:id/password", changeUserPassword);
module.exports = userRouter;
