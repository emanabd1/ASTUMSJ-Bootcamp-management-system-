const mongoose = require("mongoose");

const assignmentResourceSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true },
  path: { type: String, required: true },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: "" },
}, { _id: false });

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  instructions: { type: String, default: "", trim: true, maxlength: 10000 },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: false, default: null },
  deadline: { type: Date, required: true },
  maximumScore: { type: Number, required: true, min: 0 },
  resourceLink: { type: String, default: "", trim: true },
  resourceFile: { type: String, default: "" },
  resourceFiles: { type: [assignmentResourceSchema], default: [] },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["active", "closed"], default: "active" },
}, { timestamps: true });

assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ batch: 1, deadline: 1 });
assignmentSchema.index({ creator: 1, createdAt: -1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
