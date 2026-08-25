const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  icon: { type: String, default: "*", maxlength: 4 },
  metric: { type: String, enum: ["submissions", "completed_topics_ratio", "coding_activities", "attendance_percentage"], required: true },
  threshold: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

achievementSchema.index({ active: 1, metric: 1 });
module.exports = mongoose.model("Achievement", achievementSchema);
