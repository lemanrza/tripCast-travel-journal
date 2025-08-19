const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    req.user = { id: payload.id || payload._id };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
