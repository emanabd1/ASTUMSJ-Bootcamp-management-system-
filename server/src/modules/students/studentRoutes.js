const express = require('express');
const User = require('../users/userModel');
const Attendance = require('../attendance/attendanceModel');
const Progress = require('../progress/progressModel');
const Assignment = require('../assignments/assignmentModel');
const Submission = require('../assignments/assignmentSubmissionModel');
const Announcement = require('../announcements/announcementModel');
const { CodingActivity } = require('../coding/codingModel');
const protect = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id)
      .select(
        'fullName email role status isActive department yearOfStudy gender githubUrl leetcodeUrl codeforcesUrl bootcampReason mentor batch mustChangePassword'
      )
      .populate('mentor', 'fullName email department')
      .populate('batch', 'name startDate endDate');

    const [attendance, progress, assignments, submissions, announcements] = await Promise.all([
      Attendance.find({ student: student._id, session: { $ne: null } }).sort({ date: -1 }),
      Progress.find({ student: student._id }).sort({ topic: 1 }),
      Assignment.find({
        $or: [{ targetStudents: student._id }, { targetStudents: { $size: 0 } }]
      }).sort({ deadline: 1 }),
      Submission.find({ student: student._id })
        .populate('assignment', 'title maximumScore deadline')
        .sort({ submittedAt: -1 }),
      Announcement.find({
        publishDate: { $lte: new Date() },
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'students' },
          { targetAudience: 'batch', batch: student.batch }
        ]
      })
        .sort({ publishDate: -1 })
        .limit(5)
    ]);

    const presentLike = attendance.filter((a) => ['Present'].includes(a.status)).length;
    const attendancePercentage = attendance.length ? Math.round((presentLike / attendance.length) * 100) : 0;
    const completedTopics = progress.filter((p) => p.status === 'Completed').length;
    
    const graded = submissions.filter((s) => s.status === 'graded' && s.score != null);
    const averageGrade = graded.length
      ? Math.round(graded.reduce((n, s) => n + s.score, 0) / graded.length)
      : 0;

    const byId = new Map(submissions.map((s) => [String(s.assignment?._id), s]));
    const assignmentStatus = assignments.map((a) => ({
      assignment: a,
      submission: byId.get(String(a._id)) || null
    }));

    res.json({
      success: true,
      dashboard: {
        student,
        attendancePercentage,
        attendance,
        progress,
        completedTopics,
        totalTopics: progress.length,
        assignments: assignmentStatus,
        averageGrade,
        announcements,
        upcomingDeadlines: assignmentStatus
          .filter((x) => !x.submission || x.submission.status === 'redo')
          .slice(0, 5)
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get('/achievements', async (req, res, next) => {
  try {
    const [attendance, progress, submissions, codingActivities] = await Promise.all([
      Attendance.find({ student: req.user._id, session: { $ne: null } }).select('status'),
      Progress.find({ student: req.user._id }).select('status'),
      Submission.find({ student: req.user._id }).select('_id'),
      CodingActivity.find({ student: req.user._id }).select('_id'),
    ]);
    const completedTopics = progress.filter((item) => item.status === 'Completed').length;
    const attendancePercentage = attendance.length
      ? Math.round((attendance.filter((item) => item.status === 'Present').length / attendance.length) * 100)
      : 0;
    const achievements = [
      { icon: '🎯', title: 'First submission', description: 'Submit your first assignment solution.', earned: submissions.length > 0 },
      { icon: '📚', title: 'Topic builder', description: 'Complete at least half of your tracked topics.', earned: progress.length > 0 && completedTopics / progress.length >= 0.5 },
      { icon: '🔥', title: 'Coding spark', description: 'Record five coding activities.', earned: codingActivities.length >= 5 },
      { icon: '⏱', title: 'Reliable learner', description: 'Reach 80% attendance across sessions.', earned: attendance.length > 0 && attendancePercentage >= 80 },
    ];
    res.json({ success: true, achievements });
  } catch (e) {
    next(e);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const allowed = ['fullName', 'department', 'yearOfStudy', 'gender', 'githubUrl', 'leetcodeUrl', 'codeforcesUrl'];

    allowed.forEach((k) => {
      if (req.body[k] !== undefined) {
        user[k] = req.body[k];
      }
    });

    await user.save();

    const safe = await User.findById(user._id).select(
      '-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts'
    );

    res.json({ success: true, user: safe });
  } catch (e) {
    next(e);
  }
});

module.exports = router;