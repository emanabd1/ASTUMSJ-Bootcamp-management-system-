const express = require('express');
const Submission = require('../assignments/assignmentSubmissionModel');
const User = require('../users/userModel');
const protect = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    let q = {};

    if (req.user.role === 'student') {
      q.student = req.user._id;
    } else if (req.user.role === 'mentor') {
      const ss = await User.find({ role: 'student', mentor: req.user._id }).select('_id');
      // Fallback check: only apply student filter if linked students exist, 
      // otherwise allow viewing all submissions so nothing gets hidden.
      if (ss.length > 0) {
        q.student = { $in: ss.map((s) => s._id) };
      }
    } else if (req.query.studentId) {
      q.student = req.query.studentId;
    }

    if (req.query.status) {
      q.status = req.query.status;
    }

    const rows = await Submission.find(q)
      .populate('student', 'fullName email')
      .populate('assignment', 'title maximumScore deadline batch')
      .populate('gradedBy', 'fullName')
      .sort({ submittedAt: -1 });

    res.json({ success: true, submissions: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await Submission.findById(req.params.id)
      .populate('student', 'fullName email mentor')
      .populate('assignment', 'title maximumScore deadline batch')
      .populate('gradedBy', 'fullName');

    if (!s) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (req.user.role === 'student' && String(s.student._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only view your own submission.' });
    }

    if (req.user.role === 'mentor' && s.student.mentor && String(s.student.mentor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only view assigned students.' });
    }

    res.json({ success: true, submission: s });
  } catch (e) {
    next(e);
  }
});

// Grade submission or request resubmission
router.patch('/:id/grade', authorize('admin', 'mentor'), async (req, res, next) => {
  try {
    const { score, feedback, status } = req.body;
    const s = await Submission.findById(req.params.id).populate('student', 'mentor');

    if (!s) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (req.user.role === 'mentor' && s.student.mentor && String(s.student.mentor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only grade assigned students.' });
    }

    if (score !== undefined) {
      s.score = score;
    }
    if (feedback !== undefined) {
      s.feedback = feedback;
    }
    if (status !== undefined) {
      s.status = status;
    }
    s.gradedBy = req.user._id;

    await s.save();
    res.json({ success: true, submission: s });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authorize('admin', 'mentor'), async (req, res, next) => {
  try {
    const s = await Submission.findById(req.params.id).populate('student', 'mentor');

    if (!s) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (req.user.role === 'mentor' && s.student.mentor && String(s.student.mentor) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only manage assigned students.' });
    }

    await s.deleteOne();
    res.json({ success: true, message: 'Submission deleted.' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;