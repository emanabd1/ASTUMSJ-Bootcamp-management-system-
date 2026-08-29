const express = require("express");
const User = require("../users/userModel");
const Attendance = require("../attendance/attendanceModel");
const Progress = require("../progress/progressModel");
const Assignment = require("../assignments/assignmentModel");
const Submission = require("../assignments/assignmentSubmissionModel");
const Announcement = require("../announcements/announcementModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorize("mentor"));

const ensureAssignedStudent = async (mentorId, studentId) => {
  return User.findOne({
    _id: studentId,
    role: "student",
    mentor: mentorId,
    status: "approved",
    isActive: true
  }).select("-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts");
};

router.get("/dashboard", async (req, res, next) => {
  try {
    const students = await User.find({
      role: "student",
      mentor: req.user._id,
      status: "approved",
      isActive: true
    }).select("fullName email department yearOfStudy");

    const ids = students.map((s) => s._id);

    const [attendance, progress, pendingSubmissions, assignments, announcements] = await Promise.all([
      Attendance.find({ student: { $in: ids }, session: { $ne: null } }),
      Progress.find({ student: { $in: ids } }),
      Submission.find({ student: { $in: ids }, status: { $in: ["submitted", "resubmission_requested"] } })
        .populate("student", "fullName")
        .populate("assignment", "title deadline"),
      Assignment.find({ creator: req.user._id }).sort({ createdAt: -1 }).limit(10),
      Announcement.find({ author: req.user._id }).sort({ createdAt: -1 }).limit(5)
    ]);

    const studentStats = students.map((st) => {
      const a = attendance.filter((x) => String(x.student) === String(st._id));
      const p = progress.filter((x) => String(x.student) === String(st._id));
      const present = a.filter((x) => ["Present"].includes(x.status)).length;
      
      const completedProgress = p.filter((x) => x.status === "Completed").length;
      const attendancePercentage = a.length ? Math.round((present / a.length) * 100) : 0;
      const progressPercentage = p.length ? completedProgress / p.length : 0;
      
      const atRisk = (p.length > 0 && progressPercentage < 0.5) || (a.length > 0 && present / a.length < 0.75);

      return {
        ...st.toObject(),
        attendancePercentage,
        progressCompleted: completedProgress,
        progressTotal: p.length,
        atRisk
      };
    });

    res.json({
      success: true,
      dashboard: {
        assignedStudents: studentStats,
        pendingGrading: pendingSubmissions,
        assignments,
        announcements,
        atRiskStudents: studentStats.filter((s) => s.atRisk)
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get("/students", async (req, res, next) => {
  try {
    const students = await User.find({
      role: "student",
      mentor: req.user._id,
      status: "approved",
      isActive: true
    })
      .select("-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts")
      .sort({ fullName: 1 });

    const enriched = await Promise.all(
      students.map(async (student) => {
        const [attendance, progress] = await Promise.all([
          Attendance.find({ student: student._id, session: { $ne: null } }).sort({ date: -1 }),
          Progress.find({ student: student._id }).sort({ topic: 1 })
        ]);

        const presentLike = attendance.filter((a) => ["Present"].includes(a.status)).length;
        const attendancePercentage = attendance.length ? Math.round((presentLike / attendance.length) * 100) : 0;

        return {
          ...student.toObject(),
          attendancePercentage,
          progressCompleted: progress.filter((p) => p.status === "Completed").length,
          progressTotal: progress.length,
          progressNeedsImprovement: progress.filter((p) => p.status === "Needs Improvement").length
        };
      })
    );

    res.json({ success: true, students: enriched });
  } catch (error) {
    next(error);
  }
});

router.get("/students/:studentId", async (req, res, next) => {
  try {
    const student = await ensureAssignedStudent(req.user._id, req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Assigned student not found." });
    }

    const [attendance, progress] = await Promise.all([
      Attendance.find({ student: student._id }).sort({ date: -1 }),
      Progress.find({ student: student._id }).sort({ topic: 1 })
    ]);

    res.json({ success: true, student: student.toObject(), attendance, progress });
  } catch (error) {
    next(error);
  }
});

router.post("/students/:studentId/attendance", async (req, res, next) => {
  try {
    const student = await ensureAssignedStudent(req.user._id, req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Assigned student not found." });
    }

    const { date, status, note } = req.body;
    if (!date || !["Present", "Absent", "Late", "Excused"].includes(status)) {
      return res.status(400).json({ success: false, message: "Date and valid attendance status are required." });
    }

    const record = await Attendance.findOneAndUpdate(
      { student: student._id, date: new Date(date) },
      {
        student: student._id,
        mentor: req.user._id,
        date: new Date(date),
        status,
        note: note || ""
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: "Attendance saved.", attendance: record });
  } catch (error) {
    next(error);
  }
});

router.post("/students/:studentId/progress", async (req, res, next) => {
  try {
    const student = await ensureAssignedStudent(req.user._id, req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Assigned student not found." });
    }

    const { topic, status, note } = req.body;
    if (!topic || !["Not Started", "In Progress", "Completed", "Needs Improvement"].includes(status)) {
      return res.status(400).json({ success: false, message: "Topic and valid progress status are required." });
    }

    const record = await Progress.findOneAndUpdate(
      { student: student._id, topic: topic.trim() },
      {
        student: student._id,
        mentor: req.user._id,
        topic: topic.trim(),
        status,
        note: note || ""
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, message: "Progress saved.", progress: record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;