const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Assignment = require("./assignmentModel");
const Submission = require("./assignmentSubmissionModel");
const User = require("../users/userModel");
const Batch = require("../batches/batchModel");
const Notification = require("../notifications/notificationModel");
const sendEmail = require("../../utils/sendEmail");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");
const { eligibleStudents, validateDeadline } = require("../../services/assignmentService");

const uploadDir = path.join(__dirname, "../../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024, files: 50 } });

const router = express.Router();
router.use(protect);

const buildAssignmentNotificationLink = (assignmentId) => `/assignments/${assignmentId}`;
const isUrl = (value) => !value || /^https?:\/\//i.test(String(value));
const validObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

async function getStudentsForAssignment(user, batchId, requestedIds) {
  const ids = (requestedIds || []).map(String).filter(Boolean);
  const students = await eligibleStudents(user, batchId, ids);
  return students.map(s => String(s._id));
}

router.get("/", async (req, res, next) => {
  try {
    let assignments;
    if (req.user.role === "student") {
      const studentBatch = req.user.batch ? String(req.user.batch) : null;
      const studentSessionIds = studentBatch
        ? await require("../sessions/sessionModel").find({ batch: studentBatch }).select("_id").lean()
        : [];

      const visibleSessionIds = studentSessionIds.map((session) => session._id);

      assignments = await Assignment.find({
        $or: [
          { targetStudents: req.user._id },
          { targetStudents: { $size: 0 }, session: null },
          { targetStudents: { $size: 0 }, batch: studentBatch },
          { targetStudents: { $size: 0 }, session: { $in: visibleSessionIds } },
        ],
      }).populate("creator", "fullName role").populate("batch", "name startDate endDate").populate("session", "title").sort({ deadline: 1 });
    } else if (req.user.role === "mentor") {
      const students = await User.find({ mentor: req.user._id, role: "student", status: "approved", isActive: true }).select("_id");
      const mentorBatches = await Batch.find({ mentors: req.user._id }).select("_id");
      assignments = await Assignment.find({ batch: { $in: mentorBatches.map((batch) => batch._id) }, $or: [{ creator: req.user._id }, { targetStudents: { $in: students.map((student) => student._id) } }, { targetStudents: { $size: 0 } }] }).populate("creator", "fullName role").populate("batch", "name").sort({ createdAt: -1 });
    } else {
      assignments = await Assignment.find({}).populate("creator", "fullName role").populate("batch", "name").sort({ createdAt: -1 });
    }
    res.json({ success: true, assignments });
  } catch (e) { next(e); }
});

router.post("/", authorize("admin", "mentor"), upload.array("resourceFiles", 50), async (req, res, next) => {
  try {
    const { title, description, instructions = "", batch, sessionId = null, deadline, maximumScore, resourceLink = "" } = req.body;
    const requestedStudents = Array.isArray(req.body.studentIds)
      ? req.body.studentIds
      : typeof req.body.studentIds === "string" && req.body.studentIds
        ? req.body.studentIds.split(",").map((x) => x.trim()).filter(Boolean)
        : [];

    if (!title?.trim() || !description?.trim() || !deadline || maximumScore === undefined || maximumScore === "") {
      return res.status(400).json({ success: false, message: "Title, description, deadline and maximum score are required." });
    }
    if (!validObjectId(batch)) return res.status(400).json({ success: false, message: "A valid batch is required." });
    if (!isUrl(resourceLink)) return res.status(400).json({ success: false, message: "Resource link must be a valid URL." });

    const batchDoc = await Batch.findById(batch);
    if (!batchDoc) return res.status(404).json({ success: false, message: "Batch not found." });
    if (sessionId) {
      const session = await require("../sessions/sessionModel").findOne({ _id: sessionId, batch });
      if (!session) return res.status(400).json({ success: false, message: "Session does not belong to the selected batch." });
      if (req.user.role === "mentor" && !batchDoc.mentors.some((id) => String(id) === String(req.user._id))) return res.status(403).json({ success: false, message: "You can only add tasks to your assigned sessions." });
    }

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({ success: false, message: "Deadline must be a valid future date." });
    }
    const score = Number(maximumScore);
    if (!Number.isFinite(score) || score < 0) return res.status(400).json({ success: false, message: "Maximum score must be a non-negative number." });

    let students = await getStudentsForAssignment(req.user, batch, requestedStudents);
    if (req.user.role === "mentor") {
      const batchMentor = batchDoc.mentors.some((id) => String(id) === String(req.user._id));
      if (!batchMentor && students.length === 0) {
        return res.status(403).json({ success: false, message: "You can only create assignments for your assigned students." });
      }
    }
    if (!students.length) return res.status(400).json({ success: false, message: "No eligible students were found in the selected batch." });

    const resourceFiles = (req.files || []).map((f) => ({
      originalName: f.originalname,
      path: `/uploads/${f.filename}`,
      size: f.size,
      mimeType: f.mimetype,
    }));

    const assignment = await Assignment.create({
      title: title.trim(), description: description.trim(), instructions: instructions.trim(), batch, session: sessionId || null,
      deadline: deadlineDate, maximumScore: score, resourceLink: resourceLink.trim(),
      resourceFile: resourceFiles[0]?.path || "", resourceFiles,
      creator: req.user._id, targetStudents: students,
    });

    await Notification.insertMany(students.map((id) => ({
      user: id,
      title: "New assignment",
      message: `${assignment.title} has been assigned to you.`,
      type: "assignment",
      link: buildAssignmentNotificationLink(String(assignment._id)),
      meta: { assignmentId: String(assignment._id) },
    })));
    const assignmentRecipients = await User.find({ _id: { $in: students } }).select("email");
    await Promise.allSettled(assignmentRecipients.filter((recipient) => recipient.email).map((recipient) => sendEmail({
      email: recipient.email,
      subject: `New assignment: ${assignment.title}`,
      message: `A new assignment, ${assignment.title}, has been assigned to you. Deadline: ${assignment.deadline.toLocaleString()}.`,
    })));

    const populated = await Assignment.findById(assignment._id).populate("creator", "fullName role").populate("batch", "name");
    res.status(201).json({ success: true, assignment: populated });
  } catch (e) { next(e); }
});

router.patch("/:id", authorize("admin", "mentor"), upload.array("resourceFiles", 50), async (req,res,next)=>{try{
  const assignment=await Assignment.findById(req.params.id); if(!assignment)return res.status(404).json({success:false,message:"Assignment not found."});
  if(req.user.role==='mentor'&&String(assignment.creator)!==String(req.user._id))return res.status(403).json({success:false,message:"You can only edit assignments you created."});
  const {title,description,instructions,deadline,maximumScore,resourceLink}=req.body;
  if(title!==undefined){if(!String(title).trim())return res.status(400).json({success:false,message:"Title cannot be empty."});assignment.title=String(title).trim();}
  if(description!==undefined){if(!String(description).trim())return res.status(400).json({success:false,message:"Description cannot be empty."});assignment.description=String(description).trim();}
  if(instructions!==undefined)assignment.instructions=String(instructions).trim();
  if(deadline!==undefined){const check=validateDeadline(deadline,false);if(!check.ok)return res.status(400).json({success:false,message:check.message});assignment.deadline=check.date;}
  if(maximumScore!==undefined){const score=Number(maximumScore);if(!Number.isFinite(score)||score<0)return res.status(400).json({success:false,message:"Maximum score must be a non-negative number."});assignment.maximumScore=score;}
  if(resourceLink!==undefined&&!isUrl(resourceLink))return res.status(400).json({success:false,message:"Resource link must be a valid URL."});
  if(resourceLink!==undefined)assignment.resourceLink=String(resourceLink).trim();
  if(req.files?.length){assignment.resourceFiles=req.files.map(f=>({originalName:f.originalname,path:`/uploads/${f.filename}`,size:f.size,mimeType:f.mimetype}));assignment.resourceFile=assignment.resourceFiles[0]?.path||"";}
  await assignment.save();const populated=await Assignment.findById(assignment._id).populate("creator","fullName role").populate("batch","name");res.json({success:true,assignment:populated});
}catch(e){next(e);}});
router.delete("/:id", authorize("admin", "mentor"), async(req,res,next)=>{try{const assignment=await Assignment.findById(req.params.id);if(!assignment)return res.status(404).json({success:false,message:"Assignment not found."});if(req.user.role==='mentor'&&String(assignment.creator)!==String(req.user._id))return res.status(403).json({success:false,message:"You can only delete assignments you created."});await Submission.deleteMany({assignment:assignment._id});await assignment.deleteOne();res.json({success:true,message:"Assignment deleted."});}catch(e){next(e);}});

router.get("/:id", async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("creator", "fullName role").populate("batch", "name startDate endDate");
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (req.user.role === "student") {
      const allowed = assignment.targetStudents.length === 0 || assignment.targetStudents.some((id) => String(id) === String(req.user._id));
      if (!allowed) return res.status(403).json({ success: false, message: "You are not assigned to this assignment." });
      const submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
      return res.json({ success: true, assignment, submission });
    }

    let submissionQuery = { assignment: assignment._id };
    if (req.user.role === "mentor") {
      const students = await User.find({ mentor: req.user._id, role: "student", status: "approved", isActive: true }).select("_id");
      const canViewAssignment = String(assignment.creator?._id) === String(req.user._id) || assignment.targetStudents.length === 0 || assignment.targetStudents.some((id) => students.some((student) => String(student._id) === String(id)));
      if (!canViewAssignment) return res.status(403).json({ success: false, message: "You can only review assignments for your assigned students." });
      submissionQuery.student = { $in: students.map((student) => student._id) };
    }

    const submissions = await Submission.find(submissionQuery)
      .populate("student", "fullName email department yearOfStudy")
      .populate("gradedBy", "fullName")
      .sort({ submittedAt: -1 });
    res.json({ success: true, assignment, submissions });
  } catch (e) { next(e); }
});

router.post("/:id/submit", authorize("student"), upload.array("files", 10), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });
    const allowed = assignment.targetStudents.length === 0 || assignment.targetStudents.some((id) => String(id) === String(req.user._id));
    if (!allowed) return res.status(403).json({ success: false, message: "You are not assigned to this assignment." });
    if (assignment.status === "closed" || new Date(assignment.deadline) < new Date()) return res.status(400).json({ success: false, message: "The assignment deadline has passed." });

    const { method, githubUrl = "", liveDemoUrl = "", textAnswer = "", resubmissionReason = "" } = req.body;
    if (!["github", "files", "text"].includes(method)) return res.status(400).json({ success: false, message: "Choose GitHub link, file upload, or written answer." });
    if (method === "github" && !/^https?:\/\//i.test(githubUrl)) return res.status(400).json({ success: false, message: "A valid GitHub URL is required." });
    if (liveDemoUrl && !/^https?:\/\//i.test(liveDemoUrl)) return res.status(400).json({ success: false, message: "Live demo URL must be a valid URL." });
    if (method === "text" && !textAnswer.trim()) return res.status(400).json({ success: false, message: "Written answer is required." });
    if (method === "files" && !(req.files || []).length) return res.status(400).json({ success: false, message: "Upload at least one file." });

    const files = (req.files || []).map((f) => ({ originalName: f.originalname, path: `/uploads/${f.filename}`, size: f.size, mimeType: f.mimetype }));
    let submission = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
    const isResubmission = submission?.status === "resubmission_requested";
    if (isResubmission && !String(resubmissionReason).trim()) {
      return res.status(400).json({ success: false, message: "Explain why you are resubmitting this assignment." });
    }
    const data = { method, githubUrl: githubUrl.trim(), liveDemoUrl: liveDemoUrl.trim(), textAnswer: textAnswer.trim(), content: textAnswer.trim() || githubUrl.trim(), files, resubmissionReason: String(resubmissionReason).trim(), submittedAt: new Date(), status: "submitted", score: null, feedback: "", gradedBy: null, gradedAt: null };
    if (!submission) submission = await Submission.create({ assignment: assignment._id, student: req.user._id, ...data });
    else { Object.assign(submission, data); await submission.save(); }

    const student = await User.findById(req.user._id).select("fullName mentor");
    const recipients = await User.find({ $or: [{ role: "admin", status: "approved", isActive: true }, { _id: student.mentor, role: "mentor", status: "approved", isActive: true }] }).select("_id email");
    await Notification.insertMany(recipients.map((m) => ({ user: m._id, title: isResubmission ? "Resubmission received" : "Assignment submitted", message: isResubmission ? `${student.fullName} resubmitted ${assignment.title}.` : `${student.fullName} submitted ${assignment.title}.`, type: "submission", link: "/mentor/assignments", meta: { assignmentId: String(assignment._id), studentId: String(req.user._id) } })));
    await Promise.allSettled(recipients.filter((recipient) => recipient.email).map((recipient) => sendEmail({
      email: recipient.email,
      subject: isResubmission ? `Resubmission received: ${assignment.title}` : `Assignment submitted: ${assignment.title}`,
      message: `${student.fullName} ${isResubmission ? "resubmitted" : "submitted"} ${assignment.title}.`,
    })));

    res.json({ success: true, message: "Assignment submitted successfully.", submission });
  } catch (e) { next(e); }
});

router.patch("/:assignmentId/submissions/:submissionId/grade", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.submissionId).populate("assignment").populate("student", "fullName email mentor");
    if (!submission || String(submission.assignment?._id) !== String(req.params.assignmentId)) return res.status(404).json({ success: false, message: "Submission not found." });
    if (req.user.role === "mentor" && String(submission.student.mentor) !== String(req.user._id)) return res.status(403).json({ success: false, message: "You can only grade your assigned students." });
    if (req.user.role === "mentor" && !submission.assignment.session && String(submission.assignment.creator?._id || submission.assignment.creator) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Mentors can only grade tasks they created." });

    const { score, feedback = "", status = "graded" } = req.body;
    const normalizedStatus = status;
    if (!String(feedback).trim() && normalizedStatus === "resubmission_requested") return res.status(400).json({ success: false, message: "Feedback is required when requesting a resubmission." });
    if (score !== undefined && score !== null && (!Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > submission.assignment.maximumScore)) return res.status(400).json({ success: false, message: "Score must be between 0 and the maximum score." });
    if (!["graded", "resubmission_requested"].includes(normalizedStatus)) return res.status(400).json({ success: false, message: "Invalid grading status." });

    submission.score = score === undefined || score === "" ? submission.score : Number(score);
    submission.feedback = String(feedback).trim();
    submission.status = normalizedStatus;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    await submission.save();

    await Notification.create({
      user: submission.student._id,
      title: normalizedStatus === "resubmission_requested" ? "Resubmission requested" : "Assignment graded",
      message: normalizedStatus === "resubmission_requested" ? `Please resubmit ${submission.assignment.title}. Feedback: ${submission.feedback}` : `${submission.assignment.title} was graded. Score: ${submission.score}/${submission.assignment.maximumScore}. ${submission.feedback}`,
      type: normalizedStatus === "resubmission_requested" ? "redo" : "grade",
      link: "/student/assignments",
      meta: { assignmentId: String(submission.assignment._id), submissionId: String(submission._id) },
    });
    await sendEmail({
      email: submission.student.email,
      subject: normalizedStatus === "resubmission_requested" ? `Resubmission requested: ${submission.assignment.title}` : `Assignment graded: ${submission.assignment.title}`,
      message: normalizedStatus === "resubmission_requested" ? `Please resubmit ${submission.assignment.title}. Feedback: ${submission.feedback}` : `${submission.assignment.title} was graded. Score: ${submission.score}/${submission.assignment.maximumScore}. ${submission.feedback}`,
    }).catch(() => {});
    res.json({ success: true, submission });
  } catch (e) { next(e); }
});

router.buildAssignmentNotificationLink = buildAssignmentNotificationLink;
module.exports = router;
