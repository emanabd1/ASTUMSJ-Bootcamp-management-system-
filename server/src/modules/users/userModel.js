const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ["Admin", "Mentor", "Student"],
      default: "Student"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Task 1: Approval status for registration
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    },

    // Task 4: OTP fields for password reset
    resetPasswordOtp: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);