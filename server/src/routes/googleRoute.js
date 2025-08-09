const express = require("express");
const passport = require("passport");
const config = require("../config/config.js");
const generateAccessToken = require("../utils/jwt.js").generateAccessToken;
const UserModel = require("../models/userModel.js");
const JournalEntryModel = require("../models/journalEntryModel.js"); 
const TravelListModel = require("../models/travelListModel.js");
const DestinationModel = require("../models/destinationModel.js");
const googleRouter = express.Router();

googleRouter.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
    })
);

googleRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${config.CLIENT_URL}/?error=google_failed`,
        session: false,
    }),
    async (req, res) => {
        try {
            const user = req.user;

            if (!user) {
                throw new Error("User is not define");
            }

            // Fetch user with populated lists and journals for JWT payload
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

            const accessToken = generateAccessToken(
                {
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
                    provider: populatedUser.provider || 'google',
                    providerId: populatedUser.providerId,
                    createdAt: populatedUser.createdAt,
                    updatedAt: populatedUser.updatedAt,
                },
                "15m"
            );

            res.redirect(`${config.CLIENT_URL}/auth/success/${accessToken}`);
        } catch (err) {
            res.redirect("/?error=Something went wrong");
        }
    }
);

module.exports = googleRouter;
