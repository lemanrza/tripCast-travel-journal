const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel.js");
const JournalEntryModel = require("../models/journalEntryModel.js");
const TravelListModel = require("../models/travelListModel.js");
const DestinationModel = require("../models/destinationModel.js");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
} = require("../utils/jwt.js");
const {
    sendUnlockAccountEmail,
    sendForgotPasswordEmail,
} = require("../utils/sendMail.js");
const config = require("../config/config.js");
const SERVER_URL = config.SERVER_URL;
const CLIENT_URL = config.CLIENT_URL;
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

    if (user.lockUntil) {
        if (user.lockUntil > new Date()) {
            // Account is still locked
            const unlockTime = new Date(user.lockUntil).toLocaleString();
            throw new Error(`Account is locked. Try again after ${unlockTime}`);
        } else {
            // Lock time has expired, automatically unlock the account
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();
        }
    }

    if (user.provider == "google") {
        throw new Error(
            "This account has been created with Google, please try sign in with Google"
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
    user.lockUntil = null;
    user.isBanned = false;
    user.lastLogin = new Date();

    await user.save();

    const populatedUser = await UserModel.findById(user._id)
        .select("-password")
        .populate("journals")
        .populate({
            path: "lists",
            populate: {
                path: "destinations",
                model: "Destination"
            }
        });

    const accessToken = generateAccessToken({
        id: populatedUser._id,
        email: populatedUser.email,
        fullName: populatedUser.fullName,
        profileImage: populatedUser.profileImage,
        premium: populatedUser.premium || false,
        lists: populatedUser.lists || [],
        journals: populatedUser.journals || [],
        lastLogin: populatedUser.lastLogin,
        loginAttempts: populatedUser.loginAttempts || 0,
        lockUntil: populatedUser.lockUntil,
        isVerified: populatedUser.isVerified || false,
        provider: populatedUser.provider || 'local',
        providerId: populatedUser.providerId,
        createdAt: populatedUser.createdAt,
        updatedAt: populatedUser.updatedAt,
    }, "24h");

    const refreshToken = generateRefreshToken({
        id: populatedUser._id,
        email: populatedUser.email,
        fullName: populatedUser.fullName,
        profileImage: populatedUser.profileImage,
        premium: populatedUser.premium || false,
        lists: populatedUser.lists || [],
        journals: populatedUser.journals || [],
        lastLogin: populatedUser.lastLogin,
        loginAttempts: populatedUser.loginAttempts || 0,
        lockUntil: populatedUser.lockUntil,
        isVerified: populatedUser.isVerified || false,
        provider: populatedUser.provider || 'local',
        providerId: populatedUser.providerId,
        createdAt: populatedUser.createdAt,
        updatedAt: populatedUser.updatedAt,
    });

    return {
        message: "User login successfully!",
        accessToken: accessToken,
        refreshToken: refreshToken,
    };
};

exports.unlockAcc = async (token) => {
    const isValidToken = verifyAccessToken(token);

    if (isValidToken && isValidToken.id) {
        const { id } = isValidToken;
        const user = await UserModel.findById(id);

        if (!user) {
            throw new Error("User not found");
        }

        if (user.lockUntil && user.lockUntil > new Date()) {
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();

            return {
                message: "Account has been unlocked successfully",
            };
        } else if (user.lockUntil && user.lockUntil <= new Date()) {
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();

            return {
                message: "Account lock has expired and has been cleared",
            };
        } else {
            return {
                message: "Account is not locked",
            };
        }
    } else {
        throw new Error("Invalid or expired token");
    }
};

exports.forgotPassword = async (email) => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        throw new Error("email does not exist!");
    } else {
        const token = generateAccessToken(
            {
                id: user._id,
                email: user.email,
            },
            "30m"
        );
        const resetPasswordLink = `${CLIENT_URL}/auth/reset-password/${token}`;
        sendForgotPasswordEmail(email, user.fullName, resetPasswordLink);
    }
};

exports.resetPass = async (newPassword, email) => {
    const user = await UserModel.findOne({ email: email });
    if (!user) throw new Error("user not found!");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    await user.save();
    return user;
};

exports.updateOne = async (id, payload) => {
    const allowed = [
        "fullName",
        "bio",
        "location",
        "socials",
        "profileImage",
        "emailNotifs",
        "showStats",
        "isPublic",
        "phone",
        "phoneNumber",
    ];

    const update = {};
    for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) {
            update[k] = payload[k];
        }
    }

    const updated = await UserModel.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
    }).select("-password");

    return updated;
};

exports.changePassword = async (id, oldPassword, newPassword) => {
    const user = await UserModel.findById(id).select("+password");
    if (!user) {
        const e = new Error("User not found");
        e.statusCode = 404;
        throw e;
    }

    if (user.provider === "google") {
        const e = new Error("This account uses Google sign-in");
        e.statusCode = 400;
        throw e;
    }

    if (!oldPassword || !newPassword) {
        const e = new Error("oldPassword and newPassword are required");
        e.statusCode = 400;
        throw e;
    }

    if (oldPassword === newPassword) {
        const e = new Error("New password must differ from current");
        e.statusCode = 400;
        throw e;
    }

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
        const e = new Error("Current password is incorrect");
        e.statusCode = 400;
        throw e;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return true;
};