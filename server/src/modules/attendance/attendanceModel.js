const mongoose = require("mongoose");
const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent", "Late", "Excused"], required: true },
  lateMinutes: { type: Number, min: 0, max: 15, default: 0 },
  joinedAt: { type: Date, default: null },
  lastSeenAt: { type: Date, default: null },
  attendedSeconds: { type: Number, min: 0, default: 0 },
  note: { type: String, trim: true, default: "" },
}, { timestamps: true });
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ session: 1, student: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("Attendance", attendanceSchema);
