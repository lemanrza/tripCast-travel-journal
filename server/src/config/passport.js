const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserModel = require("../models/userModel.js");
const config = require("./config.js");

if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: `${config.SERVER_URL}/auth/google/callback`,
      },
      async (_, __, ___, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const providerId = profile.id;
          const displayName = profile.displayName || "Unnamed";
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email || !providerId) {
            return done(new Error("Invalid Google profile response"), false);
          }

          // Check if user already exists by provider ID
          let existingUser = await UserModel.findOne({
            provider: "google",
            providerId,
          });

          if (existingUser) {
            return done(null, existingUser);
          }

          const emailConflict = await UserModel.findOne({ email });

          if (emailConflict) {
            return done(null, false, {
              message: "Email already in use with another account.",
            });
          }

          const newUser = await UserModel.create({
            email,
            fullName: displayName,
            profileImage: {
              url: profileImageUrl,
              public_id: null,
            },
            provider: "google",
            providerId,
            isVerified: true, 
            password: "google-oauth-no-password", 
          });

          return done(null, newUser);
        } catch (err) {
          console.error("Google OAuth error:", err);
          return done(err, false);
        }
      }
    )
  );
} else {
  console.warn("⚠️ Google OAuth not configured: Missing client ID or secret.");
}

// Session handlers
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
