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
    const studentRecords =
      req.user.role === 'student' 
        ? [req.user]
        : ( 
            await User.find({ 
              role: 'student', 
              mentor: req.user._id, 
              status: 'approved', 
              isActive: true 
            }) 
              );
            const students = studentRecords.map((student) => student._id);
 
    const acts = await CodingActivity.find({ student: { $in: students } }); 
    const result = {};
    const mentorChallenges = req.user.role === 'mentor'
      ? await CodingChallenge.find({ assignedStudents: { $in: students } }).select('_id assignedStudents')
      : [];
 
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
 
    const studentSummary = req.user.role === 'mentor'
      ? students.map((studentId) => {
          const studentActivities = acts.filter((activity) => String(activity.student) === String(studentId));
          const assignedChallenges = mentorChallenges.filter((challenge) => challenge.assignedStudents.some((id) => String(id) === String(studentId)));
          const solvedChallenges = new Set(studentActivities.filter((activity) => activity.challenge).map((activity) => String(activity.challenge)));
          const student = studentRecords.find((record) => String(record._id) === String(studentId));
          return {
            _id: studentId,
            fullName: student.fullName,
            solvedChallenges: assignedChallenges.filter((challenge) => solvedChallenges.has(String(challenge._id))).length,
            totalChallenges: assignedChallenges.length,
            stats: result[studentId],
          };
        })
      : [];

    res.json({ success: true, stats: result, students: studentSummary }); 
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
    const assignedStudentIds = req.user.role === 'mentor'
      ? (await User.find({ mentor: req.user._id, role: 'student', status: 'approved', isActive: true }).select('_id')).map((student) => student._id)
      : [];
    const q = req.user.role === 'admin'
      ? {}
      : req.user.role === 'mentor'
        ? { assignedStudents: { $in: assignedStudentIds } }
        : { assignedStudents: req.user._id }; 
    const challenges = await CodingChallenge.find(q) 
      .populate('createdBy', 'fullName') 
      .sort({ dueDate: 1 }); 
 
    // attach the current user's own submission (link + attempt count) for 
    // each challenge so the student UI can show submission status inline 
    const activityQuery = req.user.role === 'mentor'
      ? { student: { $in: assignedStudentIds }, challenge: { $in: challenges.map((c) => c._id) } }
      : { student: req.user._id, challenge: { $in: challenges.map((c) => c._id) } };
    const myActivities = await CodingActivity.find(activityQuery).populate('student', 'fullName email');
 
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
      if (req.user.role === 'mentor') {
        obj.submissions = myActivities
          .filter((activity) => String(activity.challenge) === String(c._id))
          .map((activity) => ({
            student: activity.student,
            url: activity.url,
            attempts: activity.attempts || 1,
            timeSpentMinutes: activity.timeSpentMinutes || null,
            completedAt: activity.completedAt,
          }));
      }
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