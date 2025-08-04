const express = require("express");
const userValidate = require("../middleware/userValidate.js");
const { 
    getUserById, 
    getUsers, 
    loginUser, 
    registerUser, 
    verifyUserEmail
} = require("../controllers/userController.js");
const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.get("/verify-email", verifyUserEmail);
userRouter.get("/:id", getUserById);
userRouter.post("/register", userValidate, registerUser);
userRouter.post("/login", loginUser);

module.exports = userRouter;
