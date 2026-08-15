const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../modules/users/userModel");

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({
      email: "admin@bootcamp.com"
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      "Admin@123456",
      salt
    );

    await User.create({
      fullName: "System Administrator",
      email: "admin@bootcamp.com",
      password: hashedPassword,
      role: "Admin"
    });

    console.log("Admin created successfully.");
    console.log("Email: admin@bootcamp.com");
    console.log("Password: Admin@123456");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();