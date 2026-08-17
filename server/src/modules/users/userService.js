const bcrypt = require("bcryptjs");
const User = require("./userModel");
const sendEmail = require("../../utils/sendEmail");

const getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.search) {
    query.$or = [
      { fullName: { $regex: filters.search, $options: "i" } },
      { email: { $regex: filters.search, $options: "i" } }
    ];
  }
  return await User.find(query).select("-password").sort({ createdAt: -1 });
};

const getUserById = async (userId) => {
  return await User.findById(userId).select("-password");
};

// =========================
// CREATE USER (Task 3: Send Email Notification with Credentials)
// =========================
const createUser = async (data) => {
  const { fullName, email, password, role } = data;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    status: "approved" // Admin created users are approved automatically
  });

  // Task 3: Notify user via email about their account creation
  try {
    await sendEmail({
      email: user.email,
      subject: "Your Account Has Been Created",
      message: `Hello ${fullName},\n\nAn administrator has created an account for you.\n\nEmail: ${email}\nPassword: ${password}\nRole: ${role}\n\nPlease log in and change your password.`
    });
  } catch (err) {
    console.error("Failed to send user creation email:", err.message);
  }

  return user;
};

// =========================
// UPDATE USER (Task 1: Admin Approval / Rejection Update)
// =========================
const updateUser = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (data.fullName !== undefined) user.fullName = data.fullName;
  if (data.role !== undefined) user.role = data.role;
  if (data.isActive !== undefined) user.isActive = data.isActive;

  // Handle status approval/rejection (Task 1)
  if (data.status !== undefined && ["pending", "approved", "rejected"].includes(data.status)) {
    user.status = data.status;

    // Send email notification on status approval or rejection
    try {
      await sendEmail({
        email: user.email,
        subject: "Account Registration Status Update",
        message: `Hello ${user.fullName},\n\nYour account status has been updated by the administrator to: ${data.status.toUpperCase()}.`
      });
    } catch (err) {
      console.error("Failed to send status update email:", err.message);
    }
  }

  if (data.email !== undefined) {
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: userId }
    });
    if (existingUser) {
      throw new Error("Email is already in use.");
    }
    user.email = data.email.toLowerCase();
  }

  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(data.password, salt);
  }

  await user.save();
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }
  await user.deleteOne();
  return user;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};