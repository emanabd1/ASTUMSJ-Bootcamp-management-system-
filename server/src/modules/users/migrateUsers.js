require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./userModel");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const collection = User.collection;
  const legacyPending = await collection.updateMany(
    { status: { $exists: false }, isApproved: false },
    { $set: { status: "pending", isActive: false } }
  );
  const legacyApproved = await collection.updateMany(
    { status: { $exists: false }, $or: [{ isApproved: { $exists: false } }, { isApproved: true }] },
    { $set: { status: "approved", isActive: true } }
  );
  await collection.updateMany({ isApproved: { $exists: true } }, { $unset: { isApproved: "" } });
  console.log(`Legacy pending users migrated: ${legacyPending.modifiedCount}`);
  console.log(`Legacy approved users migrated: ${legacyApproved.modifiedCount}`);
  await mongoose.disconnect();
})().catch(async (err) => { console.error(err); await mongoose.disconnect(); process.exit(1); });
