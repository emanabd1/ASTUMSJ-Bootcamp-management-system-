const express = require('express');
const { CodingChallenge, CodingActivity } = require('./codingModel');
const User = require('../users/userModel');
const protect = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/roleMiddleware');
const Notification = require('../notifications/notificationModel');

const router = express.Router();

router.use(protect);

function streak(acts) {
  const days = [...new Set(acts.map((a) => new Date(a.completedAt).toISOString().slice(0, 10)))]
    .sort()
    .reverse();

  if (!days.length) {
    return 0;
  }

  let count = 1;
  let prev = new Date(days[0]);

  for (let i = 1; i < days.length; i++) {
    const d = new Date(days[i]);
    const diff = Math.round((prev - d) / 86400000);
    if (diff !== 1) {
      break;
    }
    count++;
    prev = d;
  }

  return count;
}

router.get('/stats', async (req, res, next) => {
  try {
    const students =
      req.user.role === 'student'
        ? [req.user._id]
        : (
            await User.find({
              role: 'student',
              mentor: req.user._id,
              status: 'approved',
              isActive: true
            })
          ).map((s) => s._id);

    const acts = await CodingActivity.find({ student: { $in: students } });
    const result = {};

    for (const id of students) {
      const a = acts.filter((x) => String(x.student) === String(id));
      result[id] = {
        leetcode: {
          count: a.filter((x) => x.platform === 'leetcode').length,
          streak: streak(a.filter((x) => x.platform === 'leetcode'))
        },
        codeforces: {
          count: a.filter((x) => x.platform === 'codeforces').length,
          streak: streak(a.filter((x) => x.platform === 'codeforces'))
        },
        github: {
          count: a.filter((x) => x.platform === 'github').length,
          streak: streak(a.filter((x) => x.platform === 'github'))
        }
      };
    }

    res.json({ success: true, stats: result });
  } catch (e) {
    next(e);
  }
});

router.get('/challenges', async (req, res, next) => {
  try {
    const q = req.user.role === 'admin' ? {} : { assignedStudents: req.user._id };
    const challenges = await CodingChallenge.find(q)
      .populate('createdBy', 'fullName')
      .sort({ dueDate: 1 });

    // attach the current user's own submission (link + attempt count) for
    // each challenge so the student UI can show submission status inline
    const myActivities = await CodingActivity.find({
      student: req.user._id,
      challenge: { $in: challenges.map((c) => c._id) }
    });

    const activityMap = {};
    myActivities.forEach((a) => {
      activityMap[String(a.challenge)] = a;
    });

    const withSubmissions = challenges.map((c) => {
      const obj = c.toObject();
      const a = activityMap[String(c._id)];
      obj.mySubmission = a
        ? {
            url: a.url,
            attempts: a.attempts || 1,
            timeSpentMinutes: a.timeSpentMinutes || null,
            completedAt: a.completedAt
          }
        : null;
      return obj;
    });

    res.json({ success: true, challenges: withSubmissions });
  } catch (e) {
    next(e);
  }
});

// static practice-sheet resources aren't stored in the DB, so submissions
// against them are keyed by a stable `resourceKey` sent from the client
// instead of a challenge id. This returns the current student's submission
// (link, attempts, time spent) for every resource they've submitted to.
router.get('/resource-submissions', async (req, res, next) => {
  try {
    const activities = await CodingActivity.find({
      student: req.user._id,
      resourceKey: { $ne: null }
    });

    const submissions = {};
    activities.forEach((a) => {
      submissions[a.resourceKey] = {
        url: a.url,
        attempts: a.attempts || 1,
        timeSpentMinutes: a.timeSpentMinutes || null,
        completedAt: a.completedAt
      };
    });

    res.json({ success: true, submissions });
  } catch (e) {
    next(e);
  }
});

router.post('/challenges', authorize('admin'), async (req, res, next) => {
  try {
    const { title, platform, problemUrl, description, dueDate, assignedStudents = [] } = req.body;

    if (!title || !platform) {
      return res.status(400).json({ success: false, message: 'Title and platform are required.' });
    }

    const c = await CodingChallenge.create({
      title,
      platform,
      problemUrl,
      description,
      dueDate,
      assignedStudents,
      createdBy: req.user._id
    });

    await Notification.insertMany(
      assignedStudents.map((id) => ({
        user: id,
        title: `New ${platform} challenge`,
        message: `${title} has been assigned to you.`,
        type: 'coding',
        link: '/student/coding'
      }))
    );

    res.status(201).json({ success: true, challenge: c });
  } catch (e) {
    next(e);
  }
});

router.post('/activity', authorize('student'), async (req, res, next) => {
  try {
    const { platform, url, note, challenge, resourceKey, timeSpentMinutes } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required.' });
    }

    const parsedTime =
      timeSpentMinutes === undefined || timeSpentMinutes === null || timeSpentMinutes === ''
        ? null
        : Number(timeSpentMinutes);

    // if this activity is tied to an assigned challenge or a static practice
    // resource, treat repeated submissions as attempts on the same record
    // instead of creating duplicates
    let a = null;

    if (challenge) {
      a = await CodingActivity.findOne({ student: req.user._id, challenge });
    } else if (resourceKey) {
      a = await CodingActivity.findOne({ student: req.user._id, resourceKey });
    }

    if (a) {
      a.url = url;
      a.note = note;
      a.attempts = (a.attempts || 1) + 1;
      a.completedAt = new Date();
      if (parsedTime !== null && !Number.isNaN(parsedTime)) {
        a.timeSpentMinutes = parsedTime;
      }
      await a.save();
    } else {
      a = await CodingActivity.create({
        student: req.user._id,
        platform,
        url,
        note,
        challenge: challenge || null,
        resourceKey: resourceKey || null,
        attempts: 1,
        timeSpentMinutes: parsedTime !== null && !Number.isNaN(parsedTime) ? parsedTime : null
      });
    }

    res.status(201).json({ success: true, activity: a });
  } catch (e) {
    next(e);
  }
});

module.exports = router;