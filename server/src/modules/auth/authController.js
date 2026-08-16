const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../users/userModel");

const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      gender,
      department,
      yearOfStudy,
      leetcodeUrl,
      codeforcesUrl,
      githubUrl,
      bootcampReason,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      gender,
      department,
      yearOfStudy,
      leetcodeUrl,
      codeforcesUrl,
      githubUrl,
      bootcampReason,

      // New registered accounts are students
      role: "student",

      // Account needs admin approval
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Pending admin approval.",
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    // 3. Check admin approval
    if (
      user.status &&
      user.status === "pending" &&
      user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Your account is pending admin approval.",
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET || "your_jwt_secret_key",
      {
        expiresIn: "1d",
      }
    );

    // 5. Return token + user
    res.status(200).json({
      success: true,
      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || "student",
        department: user.department,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
};