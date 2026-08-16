const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe
} = require("./authController");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.put("/change-password", protect, changePassword);
router.get("/me", protect, getMe);

module.exports = router;