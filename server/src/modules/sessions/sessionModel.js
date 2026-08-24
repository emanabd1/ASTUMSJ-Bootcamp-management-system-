const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  originalName: { type: String, default: "" },
  path: { type: String, default: "" },
  resourceLink: { type: String, default: "" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", trim: true, maxlength: 5000 },
  meetLink: { type: String, default: "", trim: true },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resources: { type: [resourceSchema], default: [] },
  feedback: { type: [feedbackSchema], default: [] },
}, { timestamps: true });

sessionSchema.index({ batch: 1, startsAt: 1 });
module.exports = mongoose.model("Session", sessionSchema);
