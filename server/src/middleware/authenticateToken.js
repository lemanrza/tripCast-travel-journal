const { verifyAccessToken } = require("../utils/jwt.js");
const UserModel = require("../models/userModel.js");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                message: "Access token required",
                statusCode: 401
            });
        }

        const decoded = verifyAccessToken(token);
        
        if (!decoded) {
            return res.status(403).json({
                message: "Invalid or expired token",
                statusCode: 403
            });
        }

        // Get user from database to ensure user still exists
        const user = await UserModel.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(403).json({
                message: "User not found",
                statusCode: 403
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "User email not verified",
                statusCode: 403
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            message: "Server error in authentication",
            statusCode: 500
        });
    }
};

module.exports = authenticateToken;
