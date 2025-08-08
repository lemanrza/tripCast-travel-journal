const express = require("express");
const passport = require("passport");
const config = require("../config/config.js");
const generateAccessToken = require("../utils/jwt.js").generateAccessToken;
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
    (req, res) => {
        try {
            const user = req.user;

            if (!user) {
                throw new Error("User is not define");
            }

            const accessToken = generateAccessToken(
                {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName,
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
