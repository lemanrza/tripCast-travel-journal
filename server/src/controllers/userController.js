const {
    getAll,
    getByEmail,
    getOne,
    login,
    register,
    verifyEmail,
} = require("../services/userService.js");
const formatMongoData = require("../utils/formatMongoData.js");
const bcrypt = require("bcrypt");
const { generateAccessToken } = require("../utils/jwt.js");
const { sendVerificationEmail } = require("../utils/sendMail.js");
const config = require("../config/config.js");

const SERVER_URL = config.SERVER_URL;

exports.getUsers = async (
    _,
    res,
    next
) => {
    try {
        const users = await getAll();

        res.status(200).json({
            message: "Users retrieved seccessfully!",
            data: formatMongoData(users),
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;
        const user = await getOne(id);
        if (!user) {
            res.status(404).json({
                message: "no such user found!",
                data: null,
            });
        } else {
            res.status(200).json({
                message: "user retrieved successfully!",
                data: user,
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.getUserByEmail = async (
    req,
    res,
    next
) => {
    try {
        const { email } = req.params;
        const user = await getByEmail(email);
        if (!user) {
            res.status(404).json({
                message: "no such user with given email",
                data: null,
            });
        } else {
            res.status(200).json({
                message: "user retrieved successfully!",
                data: user,
            });
        }
    } catch (error) {
        next(error);
    }
};


exports.registerUser = async (
    req,
    res,
    next
) => {
    try {
        const { password, ...otherData } = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userData = {
            ...otherData,
            password: hashedPassword,
        };

        const response = await register(userData);

        if (!response.success) {
            throw new Error(response.message);
        }

        const token = generateAccessToken(
            {
                id: response.data._id,
                email: req.body.email,
                fullName: req.body.fullName,
            },
            "6h"
        );

        const verificationLink = `${SERVER_URL}/auth/verify-email?token=${token}`;
        sendVerificationEmail(
            req.body.email,
            req.body.fullName,
            verificationLink
        );
        res.status(201).json({
            message: "User registered successfully | Verify your email",
            data: response.data,
        });
    } catch (error) {
        if (error && typeof error === "object" && "message" in error) {
            next(error);
        } else {
            next(new Error("Internal server error"));
        }
    }
};

exports.verifyUserEmail = async (
    req,
    res,
    next
) => {
    try {
        const { token } = req.query;

        const response = await verifyEmail(token);

        res.redirect(
            `${config.CLIENT_URL}/auth/email-verified?message=${response?.message}`
        );
    } catch (error) {
        next(error);
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const response = await login(email, password);

        res.cookie("refreshToken", response.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/auth/refresh",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "User successfully login",
            token: response.accessToken,
        });
    } catch (error) {
        let message = "internal server error";
        let statusCode = 500;
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
            if ("statusCode" in error) {
                statusCode = error.statusCode;
            }
        }
        res.json({
            message,
            statusCode,
        });
    }
};