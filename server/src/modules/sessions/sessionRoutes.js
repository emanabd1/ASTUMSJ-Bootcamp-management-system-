const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Session = require("./sessionModel");
const Batch = require("../batches/batchModel");
const BatchYear = require("../batchYears/batchYearModel");
const User = require("../users/userModel");
const Assignment = require("../assignments/assignmentModel");
const Submission = require("../assignments/assignmentSubmissionModel");
const Attendance = require("../attendance/attendanceModel");
const Notification = require("../notifications/notificationModel");
const sendEmail = require("../../utils/sendEmail");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const uploadDir = path.join(__dirname, "../../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`) }), limits: { fileSize: 20 * 1024 * 1024 } });

const router = express.Router();
router.use(protect);

async function canAccess(user, batch) {
  const members = user.role === "student" ? batch.students : batch.mentors;
  const parentBatchYear = batch.batchYear || await BatchYear.findOne({ name: batch.name }).select("students mentors");
  const parentMembers = user.role === "student" ? parentBatchYear?.students : parentBatchYear?.mentors;
  return user.role === "admin" || members.some((member) => String(member._id || member) === String(user._id)) || parentMembers?.some((member) => String(member._id || member) === String(user._id));
}

async function notifyUsers(users = [], title, message, link, meta) {
  const recipients = users
    .filter(Boolean)
    .filter((user, index, all) => all.findIndex((item) => String(item._id) === String(user._id)) === index);

  // Notifications/emails must never make a successful session or resource operation fail.
  if (recipients.length) {
    try {
      await Notification.insertMany(recipients.map((user) => ({ user: user._id, title, message, type: "session", link, meta })));
    } catch (error) {
      console.error("Notification creation failed:", error.message);
    }

    const emailResults = await Promise.allSettled(
      recipients.filter((user) => user.email).map((user) => sendEmail({ email: user.email, subject: title, message }))
    );
    emailResults.forEach((result) => {
      if (result.status === "rejected") console.error("Notification email failed:", result.reason?.message || result.reason);
    });
  }
}

router.get("/", async (req, res, next) => {
  try {
    const batches = req.user.role === "admin"
      ? await Batch.find().select("_id")
      : await (async () => {
        const memberField = req.user.role === "student" ? "students" : "mentors";
        const parentBatchYears = await BatchYear.find({ [memberField]: req.user._id }).select("_id name");
        return Batch.find({
          $or: [
            { [memberField]: req.user._id },
            { batchYear: { $in: parentBatchYears.map((batchYear) => batchYear._id) } },
            { name: { $in: parentBatchYears.map((batchYear) => batchYear.name) } },
          ],
        }).select("_id");
      })();
    const sessions = await Session.find({ batch: { $in: batches.map((batch) => batch._id) } }).populate("batch", "name").populate("createdBy", "fullName role").sort({ startsAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Only admins can create sessions." });
    const { title, description = "", startsAt, endsAt, meetLink = "", batchId } = req.body;
    const batch = await Batch.findById(batchId).populate("students", "fullName email").populate("mentors", "fullName email").populate("batchYear", "students mentors");
    if (!batch) return res.status(404).json({ success: false, message: "Batch not found." });
    if (!(await canAccess(req.user, batch))) return res.status(403).json({ success: false, message: "You can only create sessions for your assigned batches." });
    const start = new Date(startsAt); const end = new Date(endsAt);
    if (!title?.trim() || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start || (meetLink && !/^https:\/\/meet\.google\.com\//i.test(meetLink))) return res.status(400).json({ success: false, message: "Title, valid times, and a valid Google Meet link are required." });
    if (start < new Date(Date.now() + 60 * 60 * 1000)) return res.status(400).json({ success: false, message: "A session must start at least 1 hour after it is created." });
    if (end - start < 30 * 60 * 1000) return res.status(400).json({ success: false, message: "A session must last at least 30 minutes." });
    const nearbySession = await Session.findOne({ startsAt: { $lt: new Date(end.getTime() + 2 * 60 * 60 * 1000) }, endsAt: { $gt: new Date(start.getTime() - 2 * 60 * 60 * 1000) } });
    if (nearbySession) return res.status(400).json({ success: false, message: "Sessions must have at least a 2-hour gap." });
    const session = await Session.create({ title: title.trim(), description: description.trim(), meetLink: meetLink.trim(), startsAt: start, endsAt: end, batch: batch._id, createdBy: req.user._id });
    const parentBatchYear = batch.batchYear || await BatchYear.findOne({ name: batch.name }).select("students mentors");
    const parentUsers = parentBatchYear
      ? await User.find({ _id: { $in: [...parentBatchYear.students, ...parentBatchYear.mentors] } }).select("fullName email")
      : [];
    const users = [...batch.students, ...batch.mentors, ...parentUsers];
    const message = `${session.title} is scheduled for ${start.toLocaleString()} to ${end.toLocaleString()} for batch ${batch.name}.${session.meetLink ? ` Join: ${session.meetLink}` : ""}`;
    await notifyUsers(users, "New learning session", message, "/sessions", { sessionId: String(session._id), batchId: String(batch._id) });
    const populatedSession = await Session.findById(session._id)
      .populate("batch", "name")
      .populate("createdBy", "fullName role");
    res.status(201).json({ success: true, session: populatedSession });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).populate("batch", "name students mentors batchYear").populate("batch.students", "fullName email").populate("batch.mentors", "fullName email").populate("batch.batchYear", "students mentors").populate("createdBy", "fullName role");
    if (!session) return res.status(404).json({ success: false, message: "Session not found." });
    if (!(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot access this session." });

    // Students may be attached directly to a Batch or inherited from its BatchYear.
    // Merge both sources so attendance always shows the actual student names.
    const directStudentIds = (session.batch.students || []).map((student) => student._id || student);
    const parentBatchYear = session.batch.batchYear || await BatchYear.findOne({ name: session.batch.name }).select("students");
    const parentStudentIds = (parentBatchYear?.students || []).map((student) => student._id || student);
    const allStudentIds = [...new Set([...directStudentIds, ...parentStudentIds].map(String))];
    const allStudents = await User.find({
      _id: { $in: allStudentIds },
      role: "student",
      status: "approved",
      isActive: true,
    }).select("fullName email mentor");

    const assignedStudents = req.user.role === "mentor"
      ? allStudents.filter((student) => String(student.mentor || "") === String(req.user._id))
      : allStudents;
    const sessionBatchId = session.batch?._id || session.batch;
    const taskQuery = req.user.role === "student"
      ? {
          $and: [
            { $or: [{ session: session._id }, { batch: sessionBatchId, session: null }] },
            { $or: [{ targetStudents: req.user._id }, { targetStudents: { $size: 0 } }, { targetStudents: { $exists: false } }] },
          ],
        }
      : req.user.role === "mentor"
        ? {
            $and: [
              { $or: [{ session: session._id }, { batch: sessionBatchId, session: null }] },
              { $or: [{ creator: req.user._id }, { targetStudents: { $in: assignedStudents.map((student) => student._id) } }, { targetStudents: { $size: 0 } }, { targetStudents: { $exists: false } }] },
            ],
          }
        : { session: session._id };
    const attendanceQuery = req.user.role === "mentor"
      ? { session: session._id, student: { $in: assignedStudents.map((student) => student._id) } }
      : { session: session._id };
    const [tasks, attendance] = await Promise.all([Assignment.find(taskQuery).populate("creator", "fullName role").sort({ createdAt: -1 }), Attendance.find(attendanceQuery).populate("student", "fullName email").sort({ date: 1 })]);
    const submissions = await Submission.find({ assignment: { $in: tasks.map((task) => task._id) }, ...(req.user.role === "student" ? { student: req.user._id } : {}) }).populate("student", "fullName email").populate("gradedBy", "fullName role");
    const tasksWithSubmissions = tasks.map((task) => ({ ...task.toObject(), submissions: submissions.filter((submission) => String(submission.assignment) === String(task._id)) }));
    const safeSession = session.toObject();
    // Always return the merged student list with populated names for attendance.
    safeSession.batch.students = allStudents.map((student) => student.toObject());
    if (req.user.role === "mentor") safeSession.batch.students = safeSession.batch.students.filter((student) => assignedStudents.some((assigned) => String(assigned._id) === String(student._id)));
    safeSession.feedback = req.user.role === "student"
      ? safeSession.feedback.filter((item) => String(item.student) === String(req.user._id)).map(({ student, ...item }) => item)
      : safeSession.feedback.map(({ student, ...item }) => item);
    res.json({ success: true, session: safeSession, tasks: tasksWithSubmissions, attendance: req.user.role === "student" ? attendance.filter((record) => String(record.student?._id) === String(req.user._id)) : attendance });
  } catch (error) { next(error); }
});
router.post("/:id/join", async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can join sessions.",
      });
    }

    const session = await Session.findById(req.params.id)
      .populate("batch", "name students batchYear")
      .populate("batch.batchYear", "students");
    const parentBatchYear = session?.batch?.batchYear || (session?.batch ? await BatchYear.findOne({ name: session.batch.name }).select("students") : null);

    if (
      !session ||
      !(session.batch.students.some((student) => String(student) === String(req.user._id)) || parentBatchYear?.students?.some((student) => String(student) === String(req.user._id)))
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this session.",
      });
    }

    const now = new Date();

    const trackingStart =
      now < session.startsAt ? session.startsAt : now;

    const lateMinutes =
      now > session.startsAt
        ? Math.floor((now - session.startsAt) / 60000)
        : 0;

    const record = await Attendance.findOneAndUpdate(
      {
        session: session._id,
        student: req.user._id,
      },
      {
        $set: {
          session: session._id,
          student: req.user._id,
          mentor: session.createdBy,
          date: session.startsAt,
          status: "Absent",
          lastSeenAt: trackingStart,
          lateMinutes: Math.min(lateMinutes, 15),
          note: "Attendance is being tracked.",
        },
        $setOnInsert: {
          joinedAt: now,
          attendedSeconds: 0,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      attendance: record,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/presence", async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can report presence.",
      });
    }

    const session = await Session.findById(req.params.id)
      .populate("batch", "students");

    if (
      !session ||
      !session.batch.students.some(
        (student) => String(student) === String(req.user._id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this session.",
      });
    }

    const record = await Attendance.findOne({
      session: session._id,
      student: req.user._id,
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Join the session first.",
      });
    }

    const now = new Date();

    const effectiveNow =
      now < session.startsAt ? session.startsAt : now;

    const previousSeen =
      record.lastSeenAt && record.lastSeenAt > session.startsAt
        ? record.lastSeenAt
        : session.startsAt;

    const effectiveEnd =
      effectiveNow > session.endsAt
        ? session.endsAt
        : effectiveNow;

    if (effectiveEnd > previousSeen) {
      const elapsed = Math.min(
        60,
        Math.max(
          0,
          (effectiveEnd - previousSeen) / 1000
        )
      );

      record.attendedSeconds += elapsed;
    }

    record.lastSeenAt = effectiveNow;

    const duration = Math.max(
      1,
      (session.endsAt - session.startsAt) / 1000
    );

    if (now >= session.endsAt) {
      record.attendedSeconds = Math.min(
        record.attendedSeconds,
        duration
      );

      if (record.attendedSeconds >= duration * 0.8) {
        record.status = "Present";
      } else if (record.attendedSeconds > 0) {
        record.status = "Late";
      } else {
        record.status = "Absent";
      }
    }

    await record.save();

    res.json({
      success: true,
      attendance: record,
      completed: now >= session.endsAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/resources", upload.single("file"), async (req, res, next) => {
  try {
    if (!["admin", "mentor"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only admins and mentors can upload resources." });
    const session = await Session.findById(req.params.id).populate("batch", "students mentors");
    if (!session || !(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot manage this session." });
    const { title = "Session resource", resourceLink = "" } = req.body;
    if (!req.file && !/^https?:\/\//i.test(resourceLink)) return res.status(400).json({ success: false, message: "Upload a file or provide a valid resource link." });
    session.resources.push({ title, originalName: req.file?.originalname || "", path: req.file ? `/uploads/${req.file.filename}` : "", resourceLink: resourceLink.trim(), uploadedBy: req.user._id });
    await session.save();
    const batch = await Batch.findById(session.batch).populate("students", "fullName email").populate("mentors", "fullName email");
    await notifyUsers([...batch.students, ...batch.mentors], "New session resource", `${title} was added to ${session.title}.`, "/sessions", { sessionId: String(session._id) });
    res.status(201).json({ success: true, resources: session.resources });
  } catch (error) { next(error); }
});

router.patch("/:id/resources/:resourceId", async (req, res, next) => {
  try {
    if (!["admin", "mentor"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only admins and mentors can edit resources." });
    const session = await Session.findById(req.params.id).populate("batch", "students mentors");
    if (!session || !(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot edit this session resource." });
    const resource = session.resources.id(req.params.resourceId);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });
    if (req.user.role === "mentor" && String(resource.uploadedBy) !== String(req.user._id)) return res.status(403).json({ success: false, message: "You can only edit resources you uploaded." });
    if (req.body.title !== undefined) resource.title = String(req.body.title).trim();
    if (req.body.resourceLink !== undefined) resource.resourceLink = String(req.body.resourceLink).trim();
    await session.save();
    res.json({ success: true, resources: session.resources });
  } catch (error) { next(error); }
});

router.delete("/:id/resources/:resourceId", async (req, res, next) => {
  try {
    if (!["admin", "mentor"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only admins and mentors can delete resources." });
    const session = await Session.findById(req.params.id).populate("batch", "students mentors");
    if (!session || !(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot delete this session resource." });
    const resource = session.resources.id(req.params.resourceId);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });
    if (req.user.role === "mentor" && String(resource.uploadedBy) !== String(req.user._id)) return res.status(403).json({ success: false, message: "You can only delete resources you uploaded." });
    resource.deleteOne();
    await session.save();
    res.json({ success: true, resources: session.resources });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Only admins can edit sessions." });
    const session = await Session.findById(req.params.id).populate("batch", "students mentors");
    if (!session || !(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot edit this session." });
    const originalStart = session.startsAt.getTime();
    const { title, description, meetLink, startsAt, endsAt, batchId } = req.body;
    if (title !== undefined) session.title = String(title).trim();
    if (description !== undefined) session.description = String(description).trim();
    if (meetLink !== undefined) { if (meetLink && !/^https:\/\/meet\.google\.com\//i.test(meetLink)) return res.status(400).json({ success: false, message: "Use a valid Google Meet link." }); session.meetLink = String(meetLink).trim(); }
    if (startsAt !== undefined) session.startsAt = new Date(startsAt);
    if (endsAt !== undefined) session.endsAt = new Date(endsAt);
    if (batchId !== undefined) {
      const batch = await Batch.findById(batchId);
      if (!batch) return res.status(404).json({ success: false, message: "Batch not found." });
      session.batch = batch._id;
    }
    if (Number.isNaN(session.startsAt.getTime()) || Number.isNaN(session.endsAt.getTime()) || session.endsAt <= session.startsAt) return res.status(400).json({ success: false, message: "Session times are invalid." });
    if (session.startsAt.getTime() !== originalStart && session.startsAt < new Date(Date.now() + 60 * 60 * 1000)) return res.status(400).json({ success: false, message: "A new session start time must be at least 1 hour from now." });
    if (session.endsAt - session.startsAt < 30 * 60 * 1000) return res.status(400).json({ success: false, message: "A session must last at least 30 minutes." });
    const nearbySession = await Session.findOne({ _id: { $ne: session._id }, startsAt: { $lt: new Date(session.endsAt.getTime() + 2 * 60 * 60 * 1000) }, endsAt: { $gt: new Date(session.startsAt.getTime() - 2 * 60 * 60 * 1000) } });
    if (nearbySession) return res.status(400).json({ success: false, message: "Sessions must have at least a 2-hour gap." });
    await session.save(); res.json({ success: true, session });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Only admins can delete sessions." });
    const session = await Session.findById(req.params.id).populate("batch", "students mentors");
    if (!session || !(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot delete this session." });
    await Promise.all([Assignment.deleteMany({ session: session._id }), Attendance.deleteMany({ session: session._id })]); await session.deleteOne();
    res.json({ success: true, message: "Session deleted." });
  } catch (error) { next(error); }
});

router.post("/:id/feedback", async (req, res, next) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ success: false, message: "Only students can leave session feedback." });
    const session = await Session.findById(req.params.id).populate("batch", "students");
    if (!session || !session.batch.students.some((id) => String(id) === String(req.user._id))) return res.status(403).json({ success: false, message: "You cannot give feedback for this session." });
    if (new Date() < session.endsAt) return res.status(400).json({ success: false, message: "Feedback can only be submitted after the session ends." });
    if (!req.body.message?.trim()) return res.status(400).json({ success: false, message: "Feedback is required." });
    session.feedback.push({ message: req.body.message.trim(), student: req.user._id });
    await session.save();
    const batch = await Batch.findById(session.batch).populate("students", "fullName email").populate("mentors", "fullName email");
    const reviewers = await User.find({
      $or: [
        { _id: { $in: batch.mentors.map((mentor) => mentor._id) } },
        { role: "admin" },
      ],
      status: "approved",
      isActive: true,
    }).select("_id email");
    await notifyUsers(reviewers, "New anonymous session feedback", `New anonymous feedback was submitted for ${session.title}.`, "/sessions", { sessionId: String(session._id) });
    res.status(201).json({ success: true, message: "Anonymous feedback submitted." });
  } catch (error) { next(error); }
});

router.post("/:id/attendance", async (req, res, next) => {
  try {
    if (!["admin", "mentor"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only admins and mentors can manage attendance." });
    const session = await Session.findById(req.params.id).populate("batch", "students mentors");
    if (!session || !(await canAccess(req.user, session.batch))) return res.status(403).json({ success: false, message: "You cannot manage this session." });
    const student = session.batch.students.find((id) => String(id) === String(req.body.studentId));
    const lateMinutes = Number(req.body.lateMinutes || 0);
    if (!student || !["Present", "Absent", "Late", "Excused"].includes(req.body.status) || !Number.isInteger(lateMinutes) || lateMinutes < 0 || lateMinutes > 15 || (req.body.status !== "Late" && lateMinutes !== 0)) return res.status(400).json({ success: false, message: "Valid attendance status and late minutes from 0 to 15 are required." });
    const record = await Attendance.findOneAndUpdate({ session: session._id, student }, { session: session._id, student, mentor: req.user._id, date: session.startsAt, status: req.body.status, lateMinutes, note: String(req.body.note || "").trim() }, { upsert: true, new: true, runValidators: true });
    res.json({ success: true, attendance: record });
  } catch (error) { next(error); }
});

module.exports = router;
