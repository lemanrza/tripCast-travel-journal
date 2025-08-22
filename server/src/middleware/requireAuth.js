const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const { JWT_ACCESS_SECRET_KEY } = require("../config/config");

function getCookie(name, cookieHeader = "") {
  const parts = (cookieHeader || "").split(";").map(s => s.trim());
  for (const p of parts) if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  return "";
}

module.exports = function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const bearer = h.startsWith("Bearer ") ? h.slice(7) : null;
    const cookie = req.cookies?.token;
    const raw = bearer || cookie || req.query?.token;
    if (!raw) return res.status(401).json({ ok: false, message: "Unauthorized" });

    const payload = jwt.verify(raw, JWT_ACCESS_SECRET_KEY);
    const uid = String(payload.sub || payload._id || payload.id || payload.userId || "");
    if (!uid) return res.status(401).json({ ok: false, message: "Unauthorized" });

    req.user = { _id: uid };
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
};
