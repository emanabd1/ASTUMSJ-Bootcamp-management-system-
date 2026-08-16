const User = require("./userModel");

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// Create user (Admin control)
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// Update user details / role / account status (active, suspended, pending, approved, rejected)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true }).select("-password");
    res.status(200).json({ success: true, updatedUser });
  } catch (err) {
    next(err);
  }
};

// Delete user account
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };