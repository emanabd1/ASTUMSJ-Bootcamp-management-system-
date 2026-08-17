const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("./userModel");
const Batch = require("../batches/batchModel");
const Attendance = require("../attendance/attendanceModel");
const Assignment = require("../assignments/assignmentModel");
const Submission = require("../assignments/assignmentSubmissionModel");
const sendEmail = require("../../utils/sendEmail");
const { safeUser } = require("../auth/authController");

const sanitize = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordResetOtpHash;
  delete obj.passwordResetOtpExpiresAt;
  delete obj.passwordResetAttempts;
  return obj;
};

const getUsers = async (req, res, next) => {
  try {
    const { status, role, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) query.$or = [{ fullName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const users = await User.find(query)
      .select("-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts")
      .populate("mentor", "fullName email role")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) { next(error); }
};

const getPendingApplications = async (req, res, next) => {
  try {
    const users = await User.find({
      $or: [
        { status: "pending" },
        { status: { $exists: false }, role: { $in: ["student", "user"] }, isApproved: false }
      ]
    }).select("-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts")
      .populate("mentor", "fullName email role")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) { next(error); }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts")
      .populate("mentor", "fullName email role");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user: sanitize(user) });
  } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const { fullName, email, role, department, gender, yearOfStudy, githubUrl, leetcodeUrl, codeforcesUrl } = req.body;
    if (!fullName || !email || !role) return res.status(400).json({ success: false, message: "Name, email and role are required." });
    if (!["student", "mentor", "admin"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ success: false, message: "A user with this email already exists." });

    const temporaryPassword = crypto.randomBytes(9).toString("base64url").slice(0, 12);
    const password = await bcrypt.hash(temporaryPassword, 12);
    const user = await User.create({
      fullName: fullName.trim(), email: normalizedEmail, password, role,
      status: "approved", isActive: true, mustChangePassword: true,
      department, gender, yearOfStudy, githubUrl, leetcodeUrl, codeforcesUrl,
      bootcampReason: "Account created directly by administrator.",
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "Your ASTUMSJ Bootcamp Account Has Been Created",
        message: `Hello ${user.fullName},\n\nAn administrator created your ASTUMSJ Bootcamp account.\n\nLogin email: ${user.email}\nTemporary password: ${temporaryPassword}\nRole: ${user.role}\n\nYour account is active. Please log in and change your password from Settings immediately.`,
      });
    } catch (emailError) {
      await user.deleteOne();
      return res.status(500).json({ success: false, message: `User was not created because the credential email could not be sent: ${emailError.message}` });
    }

    res.status(201).json({ success: true, message: "User created and login credentials sent by email.", user: safeUser(user) });
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (String(user._id) === String(req.user._id) && req.body.role && req.body.role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin role." });
    }

    const previousStatus = user.status || (user.isApproved === false ? "pending" : "approved");
    const { fullName, email, role, department, gender, yearOfStudy, githubUrl, leetcodeUrl, codeforcesUrl, status, isActive } = req.body;

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (duplicate) return res.status(409).json({ success: false, message: "Email is already in use." });
      user.email = normalizedEmail;
    }
    if (role !== undefined) {
      if (!["admin", "mentor", "student"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role." });
      user.role = role;
      if (role !== "student") user.mentor = null;
    }
    if (department !== undefined) user.department = department;
    if (gender !== undefined) user.gender = gender;
    if (yearOfStudy !== undefined) user.yearOfStudy = yearOfStudy;
    if (githubUrl !== undefined) user.githubUrl = githubUrl;
    if (leetcodeUrl !== undefined) user.leetcodeUrl = leetcodeUrl;
    if (codeforcesUrl !== undefined) user.codeforcesUrl = codeforcesUrl;
    if (status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ success: false, message: "Invalid account status." });
      user.status = status;
    }
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    if (user.status === "rejected" || user.status === "pending") user.isActive = false;
    if (status === "approved" && isActive === undefined) user.isActive = true;
    user.isApproved = undefined;

    await user.save();

    if (status && status !== previousStatus && ["approved", "rejected"].includes(status)) {
      try {
        await sendEmail({
          email: user.email,
          subject: `Bootcamp Registration ${status === "approved" ? "Accepted" : "Rejected"}`,
          message: `Hello ${user.fullName},\n\nYour ASTUMSJ Bootcamp registration has been ${status}.\n\n${status === "approved" ? "You can now log in using your registered email and password." : "Thank you for your interest in the bootcamp."}`,
        });
      } catch (emailError) { console.error("Status email failed:", emailError.message); }
    }

    res.json({ success: true, message: "User updated successfully.", user: sanitize(user) });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const [students, mentors, admins, pending, suspended, batches, attendance, assignments, submissions, recentUsers, recentAssignments, recentSubmissions] = await Promise.all([
      User.countDocuments({ role: "student", status: "approved", isActive: true }),
      User.countDocuments({ role: "mentor", status: "approved", isActive: true }),
      User.countDocuments({ role: "admin", status: "approved", isActive: true }),
      User.countDocuments({ $or: [{ status: "pending" }, { status: { $exists: false }, isApproved: false }] }),
      User.countDocuments({ status: "approved", isActive: false }),
      Batch.countDocuments(),
      Attendance.find().select("status date student").lean(),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      User.find().select("fullName role createdAt").sort({createdAt:-1}).limit(5).lean(),
      Assignment.find().select("title creator createdAt").populate("creator","fullName").sort({createdAt:-1}).limit(5).lean(),
      Submission.find().select("student assignment submittedAt status").populate("student","fullName").populate("assignment","title").sort({submittedAt:-1}).limit(5).lean()
    ]);
    const presentLike=attendance.filter(a=>["Present","Late"].includes(a.status)).length;
    const attendancePercentage=attendance.length?Math.round(presentLike/attendance.length*100):0;
    const graded=await Submission.countDocuments({status:"graded"});
    const pendingGrading=await Submission.countDocuments({status:"submitted"});
    const recentActivity=[
      ...recentUsers.map(x=>({type:"user",text:`${x.fullName} (${x.role}) joined`,createdAt:x.createdAt})),
      ...recentAssignments.map(x=>({type:"assignment",text:`Assignment created: ${x.title}`,createdAt:x.createdAt})),
      ...recentSubmissions.map(x=>({type:"submission",text:`${x.student?.fullName||"Student"} submitted ${x.assignment?.title||"an assignment"}`,createdAt:x.submittedAt}))
    ].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,10);
    res.json({success:true,stats:{students,mentors,admins,pending,suspended,batches,attendancePercentage,assignments,submissions,graded,pendingGrading,recentActivity}});
  } catch (error) { next(error); }
};

const assignMentor = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    const student = await User.findById(req.params.id);
    const mentor = await User.findById(mentorId);
    if (!student || student.role !== "student") return res.status(404).json({ success: false, message: "Student not found." });
    if (!mentor || mentor.role !== "mentor" || mentor.status !== "approved" || !mentor.isActive) return res.status(400).json({ success: false, message: "Select an active mentor." });
    student.mentor = mentor._id;
    await student.save();
    const populated = await User.findById(student._id).select("-password").populate("mentor", "fullName email role");
    res.json({ success: true, message: "Mentor assigned successfully.", user: populated });
  } catch (error) { next(error); }
};

const unassignMentor = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") return res.status(404).json({ success: false, message: "Student not found." });
    student.mentor = null;
    await student.save();
    res.json({ success: true, message: "Mentor assignment removed." });
  } catch (error) { next(error); }
};

const getMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({ role: "mentor", status: "approved", isActive: true }).select("fullName email department").sort({ fullName: 1 });
    res.json({ success: true, mentors });
  } catch (error) { next(error); }
};

module.exports = { getUsers, getPendingApplications, getUser, createUser, updateUser, deleteUser, getStats, assignMentor, unassignMentor, getMentors };
