const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."] },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "mentor", "student"], default: "student" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    department: { type: String, trim: true },
    yearOfStudy: { type: String, enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] },
    leetcodeUrl: { type: String, trim: true, validate: { validator: v => !v || /^https?:\/\//i.test(v), message: "Please provide a valid URL." } },
    codeforcesUrl: { type: String, trim: true, validate: { validator: v => !v || /^https?:\/\//i.test(v), message: "Please provide a valid URL." } },
    githubUrl: { type: String, trim: true, validate: { validator: v => !v || /^https?:\/\//i.test(v), message: "Please provide a valid URL." } },
    bootcampReason: { type: String, required: true, trim: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", default: null },
    passwordResetOtpHash: { type: String, select: false, default: null },
    passwordResetOtpExpiresAt: { type: Date, select: false, default: null },
    passwordResetAttempts: { type: Number, select: false, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1, isActive: 1 });
userSchema.index({ mentor: 1 });
userSchema.index({ fullName: "text", email: "text" });

module.exports = mongoose.model("User", userSchema);
