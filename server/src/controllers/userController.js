const {
    getAll,
    getByEmail,
    getOne,
    login,
    register,
    verifyEmail,
    forgotPassword: forgotPasswordService,
    resetPass,
    unlockAcc,
    changePassword,
    updateOne,
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

exports.searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                message: "Search query is required",
                data: [],
            });
        }

        const users = await getAll();

        // Filter users based on search query (email or fullName)
        const filteredUsers = users.filter(user => {
            const query = q.toLowerCase();
            return (
                user.email?.toLowerCase().includes(query) ||
                user.fullName?.toLowerCase().includes(query)
            );
        });

        res.status(200).json({
            message: "Users search completed successfully!",
            data: formatMongoData(filteredUsers),
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
        const { password, email, ...otherData } = req.body;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const userData = {
            ...otherData,
            email,
            password: hashedPassword,
        };

        const response = await register(userData);

        if (!response.success) {
            throw new Error(response.message);
        }

        const token = generateAccessToken(
            {
                id: response.data._id,
                email: email,
                fullName: req.body.fullName,
            },
            "6h"
        );

        const verificationLink = `${SERVER_URL}/auth/verify-email?token=${token}`;
        sendVerificationEmail(
            email,
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

        if (!token) {
            return res.redirect(
                `${config.CLIENT_URL}/auth/email-verified?error=Missing verification token`
            );
        }

        const response = await verifyEmail(token);

        if (response && response.success) {
            res.redirect(
                `${config.CLIENT_URL}/auth/email-verified?message=${encodeURIComponent(response.message)}`
            );
        } else {
            res.redirect(
                `${config.CLIENT_URL}/auth/email-verified?error=${encodeURIComponent(response?.message || 'Verification failed')}`
            );
        }
    } catch (error) {
        console.error('Email verification error:', error);
        res.redirect(
            `${config.CLIENT_URL}/auth/email-verified?error=${encodeURIComponent(error.message || 'Verification failed')}`
        );
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

exports.forgotPassword = async (
    req,
    res,
    next
) => {
    try {
        const { email } = req.body;
        await forgotPasswordService(email);
        res.status(200).json({
            message: "reset password email was sent!",
        });
    } catch (error) {
        if (error && typeof error === "object" && "message" in error) {
            next(error);
        } else {
            next(new Error("Internal server error"));
        }
    }
};

exports.resetPassword = async (
    req,
    res,
    next
) => {
    try {
        const { newPassword, email } = req.body;
        await resetPass(newPassword, email);
        res.status(200).json({
            message: "password reset successfully!",
        });
    } catch (error) {
        next(error);
    }
};

exports.unlockAccount = async (
    req,
    res,
    next
) => {
    try {
        const { token } = req.query;

        const response = await unlockAcc(token);

        res.redirect(`${config.CLIENT_URL}/?message=${response.message}`);
    } catch (error) {
        next(error);
    }
};

exports.updateUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await updateOne(id, req.body);
        if (!updated) return res.status(404).json({ message: "no such user found!", data: null });
        res.status(200).json({ message: "user updated successfully!", data: updated });
    } catch (error) {
        next(error);
    }
};

exports.changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;

        if (req.user && req.user.id && req.user.id.toString() !== id.toString()) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await changePassword(id, oldPassword, newPassword);
        return res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("changePassword error:", error);
        const status = error.statusCode || 400;
        return res.status(status).json({ message: error.message || "Bad request" });
    }
};
