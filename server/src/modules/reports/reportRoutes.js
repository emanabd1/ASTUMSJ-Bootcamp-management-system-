const express = require("express");
const PDFDocument = require("pdfkit");
const User = require("../users/userModel");
const Batch = require("../batches/batchModel");
const Attendance = require("../attendance/attendanceModel");
const Assignment = require("../assignments/assignmentModel");
const Submission = require("../assignments/assignmentSubmissionModel");
const Progress = require("../progress/progressModel");
const protect = require("../../middleware/authMiddleware");

const router = express.Router();
router.get("/pdf", protect, async (req, res, next) => {
  try {
    const doc = new PDFDocument({ margin: 48 });
    const filename = `astumsj-${req.user.role}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);
    doc.fontSize(20).text("ASTU MSJ Bootcamp Report");
    doc.moveDown(0.4).fontSize(10).fillColor("#666").text(`Generated for ${req.user.fullName} (${req.user.role}) on ${new Date().toLocaleString()}`);
    doc.moveDown().fillColor("#111");

    if (req.user.role === "admin") {
      const [students, mentors, batches, assignments, submissions, attendance] = await Promise.all([
        User.countDocuments({ role: "student", status: "approved", isActive: true }), User.countDocuments({ role: "mentor", status: "approved", isActive: true }), Batch.countDocuments(), Assignment.countDocuments(), Submission.countDocuments(), Attendance.find().select("status"),
      ]);
      const present = attendance.filter((item) => item.status === "Present").length;
      doc.fontSize(13).text("Bootcamp overview").moveDown(0.4).fontSize(11).text(`Active students: ${students}`).text(`Active mentors: ${mentors}`).text(`Batches: ${batches}`).text(`Assignments: ${assignments}`).text(`Submissions: ${submissions}`).text(`Attendance: ${attendance.length ? Math.round((present / attendance.length) * 100) : 0}%`);
    } else {
      const studentIds = req.user.role === "student" ? [req.user._id] : (await User.find({ mentor: req.user._id, role: "student", status: "approved", isActive: true }).select("_id")).map((item) => item._id);
      const [attendance, progress, submissions] = await Promise.all([Attendance.find({ student: { $in: studentIds }, session: { $ne: null } }).select("status"), Progress.find({ student: { $in: studentIds } }).select("status"), Submission.find({ student: { $in: studentIds } }).select("status score")]);
      const present = attendance.filter((item) => item.status === "Present").length;
      const completed = progress.filter((item) => item.status === "Completed").length;
      doc.fontSize(13).text(req.user.role === "student" ? "Personal report" : "Assigned learner report").moveDown(0.4).fontSize(11).text(`Learners included: ${studentIds.length}`).text(`Attendance: ${attendance.length ? Math.round((present / attendance.length) * 100) : 0}%`).text(`Topics completed: ${completed}/${progress.length}`).text(`Submissions: ${submissions.length}`).text(`Graded submissions: ${submissions.filter((item) => item.status === "graded").length}`);
    }
    doc.end();
  } catch (error) { next(error); }
});
module.exports = router;
