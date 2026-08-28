const express = require('express'); 
const { CodingChallenge, CodingActivity } = require('./codingModel'); 
const User = require('../users/userModel'); 
const protect = require('../../middleware/authMiddleware'); 
const authorize = require('../../middleware/roleMiddleware'); 
const Notification = require('../notifications/notificationModel'); 
 
const router = express.Router(); 
 

router.use(protect);

const PLATFORM_HOSTS = {
  leetcode: ["leetcode.com"],
  codeforces: ["codeforces.com"],
  github: ["github.com"],
};

function isValidPlatformUrl(platform, value) {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return PLATFORM_HOSTS[platform]?.includes(host) || false;
  } catch {
    return false;
  }
}

function platformUrlMessage(platform) {
  const labels = {
    leetcode: "LeetCode (leetcode.com)",
    codeforces: "Codeforces (codeforces.com)",
    github: "GitHub (github.com)",
  };
  return `Invalid URL. A ${labels[platform] || platform} practice must use a ${labels[platform] || platform} URL.`;
}
 
 
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

router.get('/leaderboard', async (req, res, next) => {
  try {
    let studentQuery = { role: 'student', status: 'approved', isActive: true };
    if (req.user.role === 'mentor') studentQuery.mentor = req.user._id;
    if (req.user.role === 'student') studentQuery._id = req.user._id;

    const students = await User.find(studentQuery).select('_id fullName').lean();
    const activities = await CodingActivity.find({ student: { $in: students.map((student) => student._id) } }).select('student platform').lean();
    const leaderboard = students.map((student) => {
      const ownActivities = activities.filter((activity) => String(activity.student) === String(student._id));
      return {
        _id: student._id,
        fullName: student.fullName,
        activities: ownActivities.length,
        platforms: new Set(ownActivities.map((activity) => activity.platform)).size,
      };
    }).sort((a, b) => b.activities - a.activities || a.fullName.localeCompare(b.fullName));

    res.json({ success: true, leaderboard });
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

    if (!PLATFORM_HOSTS[platform]) {
      return res.status(400).json({ success: false, message: 'Invalid coding practice source.' });
    }

    if (!problemUrl || !isValidPlatformUrl(platform, problemUrl)) {
      return res.status(400).json({ success: false, message: platformUrlMessage(platform) });
    }

    if (!Array.isArray(assignedStudents) || assignedStudents.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one student.' });
    }

    const uniqueAssignedStudents = [...new Set(assignedStudents.map(String))];
    const validStudentCount = await User.countDocuments({
      _id: { $in: uniqueAssignedStudents },
      role: 'student',
    });
    if (validStudentCount !== uniqueAssignedStudents.length) {
      return res.status(400).json({ success: false, message: 'Only valid student accounts can receive coding practice.' });
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
    const { 
      platform, 
      url, 
      note, 
      challenge, 
      resourceKey, 
      timeSpentMinutes, 
      attempts 
    } = req.body; 
 
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required.'
      });
    }

    if (!PLATFORM_HOSTS[platform]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coding practice source.'
      });
    }

    if (!url || !isValidPlatformUrl(platform, url)) {
      return res.status(400).json({
        success: false,
        message: platformUrlMessage(platform)
      });
    }

    const parsedTime = 
      timeSpentMinutes === undefined || 
      timeSpentMinutes === null || 
      timeSpentMinutes === '' 
        ? null 
        : Number(timeSpentMinutes); 
 
    const parsedAttempts = 
      attempts === undefined || 
      attempts === null || 
      attempts === '' 
        ? 1 
        : Number(attempts); 
 
    if (Number.isNaN(parsedAttempts) || parsedAttempts < 1 || !Number.isInteger(parsedAttempts)) { 
      return res.status(400).json({ 
        success: false, 
        message: 'Attempts must be a whole number greater than or equal to 1.' 
      }); 
    } 
 
    if (parsedTime !== null && (Number.isNaN(parsedTime) || parsedTime < 0)) { 
      return res.status(400).json({ 
        success: false, 
        message: 'Time taken must be 0 or greater.' 
      }); 
    } 
 
    // if this activity is tied to an assigned challenge or a static practice 
    // resource, repeated submissions update the same record instead of 
    // creating duplicates 
    let a = null; 
 
    if (challenge) { 
      a = await CodingActivity.findOne({ 
        student: req.user._id, 
        challenge 
      }); 
    } else if (resourceKey) { 
      a = await CodingActivity.findOne({ 
        student: req.user._id, 
        resourceKey 
      }); 
    } 
 
    if (a) { 
      // EDIT EXISTING SUBMISSION 
      // The user controls the attempt number instead of it being 
      // automatically increased. 
      a.url = url; 
      a.note = note; 
      a.attempts = parsedAttempts; 
      a.completedAt = new Date(); 
 
      if (parsedTime !== null) { 
        a.timeSpentMinutes = parsedTime; 
      } else { 
        a.timeSpentMinutes = null; 
      } 
 
      await a.save(); 
    } else { 
      // CREATE NEW SUBMISSION 
      a = await CodingActivity.create({ 
        student: req.user._id, 
        platform, 
        url, 
        note, 
        challenge: challenge || null, 
        resourceKey: resourceKey || null, 
        attempts: parsedAttempts, 
        timeSpentMinutes: parsedTime 
      }); 
    } 
 
    res.status(201).json({ 
      success: true, 
      activity: a 
    }); 
  } catch (e) { 
    next(e); 
  } 
}); 
 
module.exports = router;