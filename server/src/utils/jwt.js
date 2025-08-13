const jwt = require("jsonwebtoken");
const config = require("../config/config.js");
const getSecretKey = (secretKey) => {
  if (typeof secretKey !== "string") {
    throw new Error("JWT_SECRET_KEY must be a valid string.");
  }
  return secretKey;
};

// Generate Token
exports.generateAccessToken = (payload, expiresIn = "15m") => {
  const secretKey = getSecretKey(config.JWT_ACCESS_SECRET_KEY);
  return jwt.sign(payload, secretKey, { expiresIn });
};

// Generate Refresh Token
exports.generateRefreshToken = (payload, expiresIn = "7d") => {
  const secretKey = getSecretKey(config.JWT_REFRESH_SECRET_KEY);
  return jwt.sign(payload, secretKey, { expiresIn });
};

// Verify Token
exports.verifyAccessToken = (token) => {
  try {
    const secretKey = getSecretKey(config.JWT_ACCESS_SECRET_KEY);
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
};

// Verify Token
exports.verifyRefreshToken = (token) => {
  try {
    const secretKey = getSecretKey(config.JWT_REFRESH_SECRET_KEY);
    return jwt.verify(token, secretKey);
  } catch (err) {
    return null;
  }
};
