const Progress = require("./progressModel");
const User = require("../users/userModel");

// ==========================================
// GET ASSIGNED STUDENTS & PROGRESS FOR MENTOR
// ==========================================
const getMentorProgress = async (req, res, next) => {
  try {
    const mentorId = req.user._id;

    // 1. Find all students explicitly assigned to this mentor by the admin
    const assignedStudents = await User.find({ 
      mentor: mentorId, 
      role: "student" 
    })
      .select("-password")
      .lean();

    if (!assignedStudents || assignedStudents.length === 0) {
      return res.json([]);
    }

    const studentIds = assignedStudents.map((s) => s._id);

    // 2. Find any existing progress documents for these specific students
    const existingProgress = await Progress.find({
      student: { $in: studentIds }
    })
      .populate("student", "fullName email department yearOfStudy")
      .lean();

    const progressMap = {};
    existingProgress.forEach((p) => {
      const sId = p.student?._id?.toString() || p.student?.toString();
      if (sId) {
        progressMap[sId] = p;
      }
    });

    // 3. Combine assigned students with progress data (fallback to 0% / Not Started if none exists)
    const combinedProgress = assignedStudents.map((student) => {
      const studentIdStr = student._id.toString();
      if (progressMap[studentIdStr]) {
        return progressMap[studentIdStr];
      }

      // Default virtual progress object for newly assigned students
      return {
        _id: student._id,
        student: {
          _id: student._id,
          fullName: student.fullName,
          email: student.email,
        },
        module: "HTML / CSS",
        percentage: 0,
        status: "Not Started",
        note: "",
        updatedAt: student.updatedAt,
      };
    });

    res.json(combinedProgress);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE OR CREATE STUDENT PROGRESS
// ==========================================
const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params; // Can be a Progress ID or a Student ID
    const { module, percentage, status, note } = req.body;

    let progress = await Progress.findOne({
      $or: [{ _id: id }, { student: id }]
    });

    if (!progress) {
      // Create a new progress record if one doesn't exist yet
      progress = await Progress.create({
        student: id,
        mentor: req.user._id,
        module: module || "HTML / CSS",
        percentage: percentage !== undefined ? percentage : 0,
        status: status || "Not Started",
        note: note || "",
      });
    } else {
      // Update existing record
      if (module !== undefined) progress.module = module;
      if (percentage !== undefined) progress.percentage = percentage;
      if (status !== undefined) progress.status = status;
      if (note !== undefined) progress.note = note;
      progress.mentor = req.user._id;
      await progress.save();
    }

    const populated = await Progress.findById(progress._id)
      .populate("student", "fullName email")
      .lean();

    res.json({ success: true, progress: populated });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE PROGRESS RECORD
// ==========================================
const deleteProgress = async (req, res, next) => {
  try {
    const progress = await Progress.findByIdAndDelete(req.params.id);
    if (!progress) {
      return res.status(404).json({ success: false, message: "Progress record not found." });
    }
    res.json({ success: true, message: "Progress record deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMentorProgress,
  updateProgress,
  deleteProgress,
};