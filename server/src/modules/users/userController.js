const userService = require("./userService");

// =========================
// GET USERS
// =========================
const getUsers = async (req, res, next) => {
  try {
    const {
      role,
      search
    } = req.query;

    const users = await userService.getAllUsers({
      role,
      search
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET SINGLE USER
// =========================
const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// CREATE USER
// =========================
const createUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role
    } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email, password and role are required."
      });
    }

    const allowedRoles = [
      "Admin",
      "Mentor",
      "Student"
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role."
      });
    }

    const user = await userService.createUser({
      fullName,
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    if (
      error.message ===
      "User with this email already exists."
    ) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// =========================
// UPDATE USER
// =========================
const updateUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      isActive
    } = req.body;

    if (role) {
      const allowedRoles = [
        "Admin",
        "Mentor",
        "Student"
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role."
        });
      }
    }

    const user = await userService.updateUser(
      req.params.id,
      {
        fullName,
        email,
        password,
        role,
        isActive
      }
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    if (
      error.message === "User not found." ||
      error.message === "Email is already in use."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};


const deleteUser = async (req, res, next) => {
  try {
    
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account."
      });
    }

    const user = await userService.deleteUser(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "User deleted successfully."
    });
  } catch (error) {
    if (error.message === "User not found.") {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};