const express = require("express");
const User = require("../users/userModel");
const Attendance = require("../attendance/attendanceModel");
const Progress = require("../progress/progressModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const router = express.Router();
router.use(protect, authorize("student"));
router.get("/dashboard", async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id).select("fullName email role status isActive department yearOfStudy gender githubUrl leetcodeUrl codeforcesUrl bootcampReason mentor mustChangePassword").populate("mentor", "fullName email department");
    const [attendance, progress] = await Promise.all([
      Attendance.find({ student: student._id }).sort({ date: -1 }),
      Progress.find({ student: student._id }).sort({ topic: 1 })
    ]);
    const presentLike = attendance.filter(a => ["Present", "Late"].includes(a.status)).length;
    const attendancePercentage = attendance.length ? Math.round((presentLike / attendance.length) * 100) : 0;
    const completedTopics = progress.filter(p => p.status === "Completed").length;
    res.json({ success: true, dashboard: { student, attendancePercentage, attendance, progress, completedTopics, totalTopics: progress.length } });
  } catch (error) { next(error); }
});
module.exports = router;
