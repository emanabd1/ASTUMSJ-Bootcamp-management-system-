const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../users/userModel");
const Settings = require("../settings/settingsModel");
const generateToken = require("../../utils/generateToken");
const sendEmail = require("../../utils/sendEmail");

// =========================
// REGISTER (Task 1 & 2)
// =========================
const register = async (req, res, next) => {
  try {
    // Check if registration schedule / window is open (Task 2)
    const settings = await Settings.findOne();
    if (settings) {
      const now = new Date();

      if (settings.isRegistrationOpenManually === false) {
        return res.status(403).json({
          success: false,
          message: "Registration is currently closed by the administrator."
        });
      }

      if (settings.registrationOpenTime && now < new Date(settings.registrationOpenTime)) {
        return res.status(403).json({
          success: false,
          message: `Registration has not opened yet. It opens on ${new Date(settings.registrationOpenTime).toLocaleString()}.`
        });
      }

      if (settings.registrationCloseTime && now > new Date(settings.registrationCloseTime)) {
        return res.status(403).json({
          success: false,
          message: "Registration window has already closed."
        });
      }
    }

    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required."
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const safeRole = role === "Mentor" ? "Mentor" : "Student";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Self-registrations require admin approval (Task 1)
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: safeRole,
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Your account is pending admin approval.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// LOGIN (Task 1 Approval & Suspension check)
// =========================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Check Approval Status (Task 1)
    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is still pending admin approval."
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your account registration has been rejected."
      });
    }

    // Check Suspended/Active status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended or disabled."
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// FORGOT PASSWORD - SEND OTP (Task 4)
// =========================
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiry
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `Your password reset OTP code is: ${otp}. It expires in 10 minutes.`
    });

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    next(error);
  }
};

// =========================
// RESET PASSWORD WITH OTP (Task 4)
// =========================
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: hashedOtp,
      resetPasswordExpires: { $gt: Date.now() }
    }).select("+password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (error) {
    next(error);
  }
};

// =========================
// CHANGE PASSWORD IN PROFILE (Task 5)
// =========================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        status: req.user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe
};