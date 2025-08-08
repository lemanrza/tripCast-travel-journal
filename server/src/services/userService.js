const bcrypt = require("bcrypt");
const UserModel =require( "../models/userModel.js");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
} = require("../utils/jwt.js");
const {
    sendUnlockAccountEmail,
} = require("../utils/sendMail.js");
const config = require("../config/config.js");
const SERVER_URL = config.SERVER_URL;
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 10 * 60 * 1000;

exports.getAll = async () => {
    return await UserModel.find()
        .select("-password")
};

exports.getOne = async (id) => {
    return await UserModel.findById(id)
        .select("-password")
        .populate("journals")
        .populate("lists");
}

exports.getByEmail = async (email) => {
    return await UserModel.find({ email: email }).select("-password");
}

exports.register = async (payload) => {
    try {
        const { email } = payload;
        const dublicateUser = await UserModel.findOne({ email });
        if (dublicateUser) {
            return {
                success: false,
                message: "Email already exists",
            };
        }

        return {
            success: true,
            data: await UserModel.create(payload),
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return message;
    }
};

exports.verifyEmail = async (token) => {
    const isValidToken = verifyAccessToken(token);
    if (isValidToken) {
        const { id } = isValidToken;
        const user = await UserModel.findById(id);
        if (user) {
            if (user.isVerified) {
                return {
                    success: false,
                    message: "email already has been verified",
                };
            } else {
                user.isVerified = true;
                await user.save();
                return {
                    success: true,
                    message: "email has been verified successfully!",
                };
            }
        }
    } else {
        throw new Error("invalid or expired token!");
    }
};

exports.login = async (email, password) => {

    const user = await UserModel.findOne({ email });

    if (!user) throw new Error("Invalid credentials");

    if (!user.isVerified) throw new Error("User should be verified first");

    if (user.lockUntil && user.lockUntil > new Date()) {
        const unlockTime = new Date(user.lockUntil).toLocaleString();
        throw new Error(`User is locked. Try again after ${unlockTime}`);
    }

    if (user.provider == "google") {
        throw new Error(
            "This account has been created with Google, please try sign in with Google"
        );
    } else if (user.provider == "instagram") {
        throw new Error(
            "This account has been created with Instagram, please try sign in with Instagram"
        );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;

        if (user.loginAttempts >= MAX_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCK_TIME);
            await user.save();

            const token = generateAccessToken(
                {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                },
                "6h"
            );

            const unlockAccountLink = `${SERVER_URL}/auth/unlock-account?token=${token}`;
            sendUnlockAccountEmail(
                user.email,
                user.fullName,
                user.lockUntil,
                unlockAccountLink
            );

            throw new Error(
                "Too many login attempts. Account locked for 10 minutes. Check your email"
            );
        }

        await user.save();
        throw new Error("Invalid credentials");
    }

    user.loginAttempts = 0;
    user.isBanned = false;
    user.lastLogin = new Date();

    await user.save();

    const accessToken = generateAccessToken({
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        premium: user.premium || false,
        lists: user.lists || [],
        journals: user.journals || [],
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts || 0,
        lockUntil: user.lockUntil,
        isVerified: user.isVerified || false,
        provider: user.provider || 'local',
        providerId: user.providerId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });

    const refreshToken = generateRefreshToken({
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        premium: user.premium || false,
        lists: user.lists || [],
        journals: user.journals || [],
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts || 0,
        lockUntil: user.lockUntil,
        isVerified: user.isVerified || false,
        provider: user.provider || 'local',
        providerId: user.providerId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });

    return {
        message: "User login successfully!",
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
};