const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../models/userModel");

// tiny cookie parser
function getCookie(name, cookieHeader = "") {
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const p of parts) if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  return "";
}

function socketAuth(secret) {
  if (!secret) console.error("[socketAuth] JWT_SECRET is missing!");
  return async (socket, next) => {
    try {
      let raw =
        socket.handshake?.auth?.token ||
        ((socket.handshake?.headers?.authorization || "").toLowerCase().startsWith("bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : "") ||
        (socket.handshake?.query?.token ? String(socket.handshake.query.token) : "") ||
        getCookie("token", socket.handshake?.headers?.cookie || "");

      if (!raw || raw === "null" || raw === "undefined") {
        console.error("[socketAuth] no token found in auth/header/query/cookie");
        return next(new Error("UNAUTHORIZED"));
      }
      if (raw.toLowerCase().startsWith("bearer ")) raw = raw.slice(7); // just in case

      const payload = jwt.verify(raw, secret);
      // Try common fields
      let uid = String(payload.sub || payload._id || payload.id || payload.userId || "");

      // If uid is not a Mongo ObjectId, try resolving via DB (email/username/etc.)
      if (!mongoose.isValidObjectId(uid)) {
        if (payload.email) {
          const u = await User.findOne({ email: payload.email }).select("_id").lean();
          if (!u) {
            console.error("[socketAuth] payload had email but user not found");
            return next(new Error("UNAUTHORIZED"));
          }
          uid = String(u._id);
        } else {
          console.error("[socketAuth] token uid is not a Mongo ObjectId and no email to map", {
            uid,
            payloadKeys: Object.keys(payload),
          });
          return next(new Error("UNAUTHORIZED"));
        }
      }

      socket.userId = uid;
      return next();
    } catch (e) {
      console.error("[socketAuth] verify failed:", e?.name, e?.message);
      return next(new Error("UNAUTHORIZED"));
    }
  };
}

module.exports = socketAuth;
