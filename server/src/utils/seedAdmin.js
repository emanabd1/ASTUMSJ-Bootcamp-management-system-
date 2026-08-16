const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./modules/users/userModel");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const hashedPassword = await bcrypt.hash(
      "Admin@123456",
      10
    );

    const admin = await User.findOneAndUpdate(
      {
        email: "admin@bootcamp.com",
      },
      {
        fullName: "System Administrator",
        email: "admin@bootcamp.com",
        password: hashedPassword,

        role: "admin",
        status: "approved",
        isActive: true,

        bootcampReason: "System administrator",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Admin account ready:");
    console.log(admin.email);
    console.log(admin.role);

    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
  } catch (error) {
    console.error("Seed admin error:", error);

    process.exit(1);
  }
};

seedAdmin();