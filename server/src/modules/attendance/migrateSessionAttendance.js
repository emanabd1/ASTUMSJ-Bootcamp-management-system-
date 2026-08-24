require("dotenv").config();
const mongoose = require("mongoose");
const Attendance = require("./attendanceModel");

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing.");
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Attendance.deleteMany({ session: null });
  console.log(`Removed ${result.deletedCount} attendance records that were not linked to a session.`);
  await mongoose.disconnect();
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
