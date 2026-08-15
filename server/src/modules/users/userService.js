const bcrypt = require("bcryptjs");
const User = require("./userModel");

// =========================
// GET ALL USERS
// =========================
const getAllUsers = async (filters = {}) => {
  const query = {};

  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.search) {
    query.$or = [
      {
        fullName: {
          $regex: filters.search,
          $options: "i"
        }
      },
      {
        email: {
          $regex: filters.search,
          $options: "i"
        }
      }
    ];
  }

  return await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 });
};

// =========================
// GET USER BY ID
// =========================
const getUserById = async (userId) => {
  return await User.findById(userId).select("-password");
};

// =========================
// CREATE USER
// =========================
const createUser = async (data) => {
  const {
    fullName,
    email,
    password,
    role
  } = data;

  const existingUser = await User.findOne({
    email: email.toLowerCase()
  });

  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role
  });
};

// =========================
// UPDATE USER
// =========================
const updateUser = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (data.fullName !== undefined) {
    user.fullName = data.fullName;
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

  if (data.role !== undefined) {
    user.role = data.role;
  }

  if (data.isActive !== undefined) {
    user.isActive = data.isActive;
  }

  if (data.password) {
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      data.password,
      salt
    );
  }

  await user.save();

  return user;
};

// =========================
// DELETE USER
// =========================
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