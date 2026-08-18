require("dotenv").config();
const mongoose = require("mongoose");
const Assignment = require("./assignmentModel");
const Batch = require("../batches/batchModel");

(async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
    await mongoose.connect(process.env.MONGO_URI);
    const collection = Assignment.collection;
    const docs = await collection.find({}).toArray();
    let migrated = 0;
    let skipped = 0;
    for (const doc of docs) {
      if (doc.batch && mongoose.isValidObjectId(doc.batch)) {
        const update = { $set: { targetMode: doc.targetStudents && doc.targetStudents.length ? "selected" : "batch" } };
        if (doc.resourceFile && (!doc.resourceFiles || !doc.resourceFiles.length)) update.$set.resourceFiles = [{ originalName: String(doc.resourceFile).split("/").pop(), path: doc.resourceFile }];
        if (doc.resourceFile) update.$unset = { resourceFile: "" };
        await collection.updateOne({ _id: doc._id }, update);
        continue;
      }
      const batch = doc.batch ? await Batch.findOne({ name: String(doc.batch).trim() }).select("_id") : null;
      if (!batch) { skipped += 1; continue; }
      const update = { $set: { batch: batch._id, targetMode: doc.targetStudents && doc.targetStudents.length ? "selected" : "batch" } };
      if (doc.resourceFile && (!doc.resourceFiles || !doc.resourceFiles.length)) update.$set.resourceFiles = [{ originalName: String(doc.resourceFile).split("/").pop(), path: doc.resourceFile }];
      update.$unset = { resourceFile: "" };
      await collection.updateOne({ _id: doc._id }, update);
      migrated += 1;
    }
    console.log(`Assignments migrated: ${migrated}`);
    console.log(`Assignments skipped because their batch could not be resolved: ${skipped}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("Assignment migration failed:", error.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
