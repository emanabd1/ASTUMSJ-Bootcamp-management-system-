const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("../modules/users/userModel");
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123456";
    const hash = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { email: process.env.SEED_ADMIN_EMAIL || "admin@bootcamp.com" },
      { $set: { fullName: "System Administrator", password: hash, role: "admin", status: "approved", isActive: true, mustChangePassword: false, bootcampReason: "System administrator" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Admin ready: ${process.env.SEED_ADMIN_EMAIL || "admin@bootcamp.com"}`);
    await mongoose.disconnect();
  } catch (error) { console.error("Seed admin error:", error); process.exit(1); }
})();
