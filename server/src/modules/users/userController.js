const mongoose = require("mongoose");
const User = require("./userModel");
const bcrypt = require("bcryptjs");

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    // Standard response pattern
    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// Get single user by ID
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format." });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// Create user (Admin control)
const createUser = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Note: If userModel has a pre-save hook for password hashing,
    // do NOT double hash here. Only hash if pre-save hook is not used.
    if (data.password && data.password.trim() !== "") {
      data.password = await bcrypt.hash(data.password, 10);
    }

    data.status = data.status || "approved";
    data.bootcampReason = data.bootcampReason || "Created directly by administrator.";

    const user = await User.create(data);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, user: userResponse });
  } catch (err) {
    next(err);
  }
};

// Update user details / role / account status
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format." });
    }

    const updateData = { ...req.body };

    // If password is provided and not empty, hash it before updating
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // Prevent overwriting with empty string
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    next(err);
  }
};

// Delete user account
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format." });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser 
};