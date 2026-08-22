const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Submission = require("./assignmentSubmissionModel");
const Assignment = require("./assignmentModel");
const User = require("../users/userModel");
const Notification = require("../notifications/notificationModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { isValidUrl } = require("../../middleware/validate");

const uploadDir = path.join(__dirname, "../../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_r, _f, cb) => cb(null, uploadDir),
  filename: (_r, f, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}-${f.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    ),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 50 } });

const router = express.Router();
router.use(protect);

const canManageSubmission = async (user, submission) => {
  if (user.role === "admin") return true;
  if (user.role !== "mentor") return false;
  const student = await User.findOne({
    _id: submission.student,
    role: "student",
    mentor: user._id,
    status: "approved",
    isActive: true,
  });
  return Boolean(student);
};

// GET all submissions with mentor fallback support
router.get("/", async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === "student") {
      query.student = req.user._id;
    } else if (req.user.role === "mentor") {
      const students = await User.find({ role: "student", mentor: req.user._id }).select("_id");
      if (students.length > 0) {
        query.student = { $in: students.map((s) => s._id) };
      }
    } else if (req.query.studentId) {
      query.student = req.query.studentId;
    }

    if (req.query.assignmentId) query.assignment = req.query.assignmentId;
    if (req.query.status) query.status = req.query.status;

    const submissions = await Submission.find(query)
      .populate("student", "fullName email")
      .populate("assignment", "title maximumScore deadline batch")
      .populate("gradedBy", "fullName role")
      .sort({ submittedAt: -1 });

    res.json({ success: true, submissions });
  } catch (error) {
    next(error);
  }
});

// GET a single submission by ID
router.get("/:id", async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("student", "fullName email mentor")
      .populate("assignment", "title maximumScore deadline batch")
      .populate("gradedBy", "fullName role");

    if (!submission) return res.status(404).json({ success: false, message: "Submission not found." });
    
    if (req.user.role === "student" && String(submission.student._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You can only view your own submission." });
    }
    if (req.user.role === "mentor" && submission.student.mentor && !(await canManageSubmission(req.user, submission))) {
      return res.status(403).json({ success: false, message: "You can only view submissions from assigned students." });
    }

    res.json({ success: true, submission });
  } catch (error) {
    next(error);
  }
});

// POST student submission
router.post("/assignments/:assignmentId", authorize("student"), upload.array("files", 50), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    
    if (assignment.targetStudents?.length && !assignment.targetStudents.some((id) => String(id) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: "This assignment is not assigned to you." });
    }
    if (assignment.status === "closed" || new Date(assignment.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: "The assignment deadline has passed or the assignment is closed." });
    }

    const { method, githubUrl = "", liveDemoUrl = "", textAnswer = "" } = req.body;
    
    const content = textAnswer || githubUrl || liveDemoUrl || "";

    const files = (req.files || []).map((f) => ({
      originalName: f.originalname,
      path: `/uploads/${f.filename}`,
      size: f.size,
      mimeType: f.mimetype,
    }));

    let submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
    const payload = {
      method: method || "text",
      githubUrl,
      liveDemoUrl,
      content,
      files,
      submittedAt: new Date(),
      score: null,
      feedback: "",
      status: "submitted",
      gradedBy: null,
      gradedAt: null,
    };

    if (!submission) {
      submission = await Submission.create({
        assignment: assignment._id,
        student: req.user._id,
        ...payload,
        version: 1,
      });
    } else {
      Object.assign(submission, payload);
      submission.version = (submission.version || 1) + 1;
      await submission.save();
    }

    const student = await User.findById(req.user._id).select("fullName mentor");
    const recipients = await User.find({
      $or: [{ _id: student?.mentor }, { role: "admin" }],
      status: "approved",
      isActive: true,
    }).select("_id");

    await Notification.insertMany(
      recipients.map((r) => ({
        user: r._id,
        title: "Assignment submitted",
        message: `${student.fullName} submitted ${assignment.title}.`,
        type: "submission",
        link: "/mentor/assignments",
        meta: { assignmentId: String(assignment._id), submissionId: String(submission._id) },
      }))
    );

    res.status(201).json({ success: true, submission });
  } catch (error) {
    next(error);
  }
});

// PATCH grade or request resubmission
router.patch("/:id/grade", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("assignment", "title maximumScore")
      .populate("student", "fullName mentor");

    if (!submission) return res.status(404).json({ success: false, message: "Submission not found." });
    
    if (submission.student.mentor && !(await canManageSubmission(req.user, submission))) {
      return res.status(403).json({ success: false, message: "You can only grade submissions from assigned students." });
    }

    const score = req.body.score === undefined || req.body.score === "" ? null : Number(req.body.score);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > submission.assignment.maximumScore)) {
      return res.status(400).json({ success: false, message: `Score must be between 0 and ${submission.assignment.maximumScore}.` });
    }

    const requestedStatus = req.body.status;
    const status = (requestedStatus === "resubmission_requested" || requestedStatus === "redo") 
      ? "resubmission_requested" 
      : "graded";

    const feedback = String(req.body.feedback || "").trim();

    submission.score = score;
    submission.feedback = feedback;
    submission.status = status;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();

    await submission.save();

    // Safely create notification with terminal error logging
    try {
      const notif = await Notification.create({
        user: submission.student._id,
        title: status === "resubmission_requested" ? "Resubmission requested" : "Assignment graded",
        message:
          status === "resubmission_requested"
            ? `Please resubmit ${submission.assignment.title}. Feedback: ${feedback}`
            : `${submission.assignment.title} was graded. Score: ${score}/${submission.assignment.maximumScore}. ${feedback}`,
        type: status === "resubmission_requested" ? "redo" : "grade",
        link: "/student/assignments",
        meta: { assignmentId: String(submission.assignment._id), submissionId: String(submission._id) },
      });
      console.log("Notification successfully created for student ID:", notif.user);
    } catch (notifErr) {
      console.error("ERROR creating notification in grade route:", notifErr);
    }

    res.json({ success: true, submission });
  } catch (error) {
    next(error);
  }
});

module.exports = router;