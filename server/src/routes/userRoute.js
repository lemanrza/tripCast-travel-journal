const express = require("express");
const userValidate = require("../middleware/userValidate.js");
const {
    getUserById,
    getUsers,
    loginUser,
    registerUser,
    verifyUserEmail,
    forgotPassword,
    resetPassword,
    unlockAccount
} = require("../controllers/userController.js");
const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.post("/register", userValidate, registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/verify-email", verifyUserEmail);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/unlock-account", unlockAccount);
userRouter.get("/user/:id", getUserById);

module.exports = userRouter;
