const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    
    // Detailed Profile & Coding fields
    gender: { type: String, enum: ["Male", "Female"] },
    department: { type: String },
    yearOfStudy: { type: String, enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] },
    leetcodeUrl: { type: String },
    codeforcesUrl: { type: String },
    githubUrl: { type: String },
    bootcampReason: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);