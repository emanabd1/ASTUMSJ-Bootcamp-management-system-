const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, default: 0 },
  mimeType: { type: String, default: "" },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  method: { type: String, enum: ["github", "files", "text"], required: true },
  githubUrl: { type: String, default: "" },
  liveDemoUrl: { type: String, default: "" },
  textAnswer: { type: String, default: "" },
  files: { type: [fileSchema], default: [] },
  submittedAt: { type: Date, default: Date.now },
  score: { type: Number, min: 0, default: null },
  feedback: { type: String, default: "" },
  status: { type: String, enum: ["submitted", "graded", "redo"], default: "submitted" },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  gradedAt: { type: Date, default: null },
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1, status: 1, submittedAt: -1 });

module.exports = mongoose.model("AssignmentSubmission", submissionSchema);
