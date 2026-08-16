const bcrypt = require("bcryptjs");
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
      bootcampReason 
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
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
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Pending admin approval."
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register };