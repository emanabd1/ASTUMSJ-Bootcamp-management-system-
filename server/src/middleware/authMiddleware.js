const jwt = require("jsonwebtoken");
const User = require("../modules/users/userModel");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authorized. No token provided." });
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change-this-secret");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User no longer exists." });
    if (user.status !== "approved" || !user.isActive) return res.status(403).json({ success: false, message: "Your account is not active." });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") return res.status(401).json({ success: false, message: "Invalid token." });
    if (error.name === "TokenExpiredError") return res.status(401).json({ success: false, message: "Token has expired. Please log in again." });
    next(error);
  }
};
module.exports = protect;
