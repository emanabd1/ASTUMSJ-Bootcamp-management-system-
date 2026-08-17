const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../users/userModel");
const sendEmail = require("../../utils/sendEmail");

const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordResetOtpHash;
  delete obj.passwordResetOtpExpiresAt;
  delete obj.passwordResetAttempts;
  return obj;
};

const signToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role },
  process.env.JWT_SECRET || "change-this-secret",
  { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
);

const register = async (req, res, next) => {
  try {
    const {
      fullName, email, password, confirmPassword, gender, department,
      yearOfStudy, leetcodeUrl, codeforcesUrl, githubUrl, bootcampReason,
    } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !gender || !department || !yearOfStudy || !bootcampReason) {
      return res.status(400).json({ success: false, message: "Please complete all required registration fields." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: fullName.trim(), email: normalizedEmail, password: hashedPassword,
      role: "student", status: "pending", isActive: false, mustChangePassword: false,
      gender, department: department.trim(), yearOfStudy,
      leetcodeUrl: leetcodeUrl?.trim(), codeforcesUrl: codeforcesUrl?.trim(), githubUrl: githubUrl?.trim(),
      bootcampReason: bootcampReason.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Registration submitted successfully. Your application is now pending admin approval.",
      user: safeUser(user),
    });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (user.status === "pending") return res.status(403).json({ success: false, message: "Your registration is pending admin approval." });
    if (user.status === "rejected") return res.status(403).json({ success: false, message: "Your registration was rejected by the administrator." });
    if (!user.isActive) return res.status(403).json({ success: false, message: "Your account is suspended. Please contact the administrator." });

    return res.json({ success: true, token: signToken(user), user: safeUser(user) });
  } catch (error) { next(error); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts");
    // Do not reveal whether an email exists.
    if (!user) return res.json({ success: true, message: "If that email is registered, a verification code has been sent." });

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.passwordResetOtpHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetAttempts = 0;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "ASTUMSJ Bootcamp Password Reset OTP",
      message: `Hello ${user.fullName},\n\nYour password reset OTP is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
    });
    return res.json({ success: true, message: "If that email is registered, a verification code has been sent." });
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp, password, confirmPassword } = req.body;
    if (!email || !otp || !password || !confirmPassword) return res.status(400).json({ success: false, message: "Email, OTP, and both password fields are required." });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match." });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const user = await User.findOne({ email }).select("+password +passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetAttempts");
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    if (user.passwordResetAttempts >= 5) return res.status(429).json({ success: false, message: "Too many invalid OTP attempts. Request a new code." });
    if (user.passwordResetOtpExpiresAt < new Date()) return res.status(400).json({ success: false, message: "OTP has expired. Request a new code." });

    const hash = crypto.createHash("sha256").update(String(otp)).digest("hex");
    if (hash !== user.passwordResetOtpHash) {
      user.passwordResetAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    user.password = await bcrypt.hash(password, 12);
    user.mustChangePassword = false;
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetAttempts = 0;
    await user.save();
    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) return res.status(400).json({ success: false, message: "All password fields are required." });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: "Passwords do not match." });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });

    const user = await User.findById(req.user._id).select("+password");
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ success: false, message: "Current password is incorrect." });
    user.password = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
    res.json({ success: true, message: "Password changed successfully." });
  } catch (error) { next(error); }
};

const me = async (req, res) => res.json({ success: true, user: safeUser(req.user) });

module.exports = { register, login, forgotPassword, resetPassword, changePassword, me, safeUser };
