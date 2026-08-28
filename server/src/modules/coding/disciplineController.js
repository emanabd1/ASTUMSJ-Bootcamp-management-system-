const DailyDiscipline = require('./disciplineModel');

const TIME_ZONE = process.env.DISCIPLINE_TIMEZONE || 'Africa/Addis_Ababa';

function todayKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function keyToUtcDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function previousKey(key) {
  const date = keyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function calculateSequence(keys) {
  if (!keys.length) return 0;

  let count = 1;
  for (let index = 1; index < keys.length; index += 1) {
    if (previousKey(keys[index - 1]) !== keys[index]) break;
    count += 1;
  }
  return count;
}

async function getStreakStats(studentId) {
  const records = await DailyDiscipline.find({
    student: studentId,
    eveningCheckout: true,
  })
    .select('dateKey')
    .sort({ dateKey: -1 })
    .lean();

  const keys = records.map((record) => record.dateKey);
  const today = todayKey();
  const yesterday = previousKey(today);
  const latest = keys[0] || null;

  const currentStreak =
    latest === today || latest === yesterday ? calculateSequence(keys) : 0;

  let longestStreak = 0;
  let running = 0;
  let previous = null;

  for (const key of [...keys].reverse()) {
    if (!previous || previousKey(key) !== previous) {
      running = 1;
    } else {
      running += 1;
    }
    longestStreak = Math.max(longestStreak, running);
    previous = key;
  }

  return {
    currentStreak,
    longestStreak,
    lastCheckoutDate: latest,
    todayCompleted: latest === today,
    todayKey: today,
  };
}

function cleanGoals(goals) {
  if (!Array.isArray(goals) || goals.length < 1 || goals.length > 3) {
    return null;
  }

  const cleaned = goals.map((goal) => {
    if (typeof goal === 'string') {
      return { text: goal.trim(), completed: false };
    }

    return {
      text: String(goal?.text || '').trim(),
      completed: Boolean(goal?.completed),
    };
  });

  if (cleaned.some((goal) => !goal.text || goal.text.length > 200)) {
    return null;
  }

  const uniqueTexts = new Set(cleaned.map((goal) => goal.text.toLowerCase()));
  if (uniqueTexts.size !== cleaned.length) return null;

  return cleaned;
}

exports.getToday = async (req, res, next) => {
  try {
    const dateKey = todayKey();
    const discipline = await DailyDiscipline.findOne({
      student: req.user._id,
      dateKey,
    }).lean();
    const streak = await getStreakStats(req.user._id);

    res.json({ success: true, discipline, streak });
  } catch (error) {
    next(error);
  }
};

exports.saveMorningGoals = async (req, res, next) => {
  try {
    const goals = cleanGoals(req.body.goals);
    if (!goals) {
      return res.status(400).json({
        success: false,
        message: 'Enter 1 to 3 different coding goals.',
      });
    }

    const dateKey = todayKey();
    let discipline = await DailyDiscipline.findOne({
      student: req.user._id,
      dateKey,
    });

    if (discipline?.eveningCheckout) {
      return res.status(409).json({
        success: false,
        message: 'Today’s evening checkout is already complete, so the goals are locked.',
      });
    }

    if (!discipline) {
      discipline = await DailyDiscipline.create({
        student: req.user._id,
        dateKey,
        goals,
      });
    } else {
      discipline.goals = goals;
      await discipline.save();
    }

    res.json({ success: true, discipline });
  } catch (error) {
    next(error);
  }
};

exports.submitCheckout = async (req, res, next) => {
  try {
    const dateKey = todayKey();
    const discipline = await DailyDiscipline.findOne({
      student: req.user._id,
      dateKey,
    });

    if (!discipline) {
      return res.status(400).json({
        success: false,
        message: 'Set your morning goals before completing the evening checkout.',
      });
    }

    if (discipline.eveningCheckout) {
      return res.status(409).json({
        success: false,
        message: 'Your evening checkout has already been submitted today.',
      });
    }

    const rating = Number(req.body.focusRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Focus rating must be a whole number from 1 to 5.',
      });
    }

    if (Array.isArray(req.body.goals)) {
      const updatedGoals = cleanGoals(req.body.goals);
      if (!updatedGoals || updatedGoals.length !== discipline.goals.length) {
        return res.status(400).json({
          success: false,
          message: 'The submitted goals are invalid.',
        });
      }
      discipline.goals = updatedGoals;
    }

    discipline.focusRating = rating;
    discipline.eveningCheckout = true;
    discipline.checkedOutAt = new Date();
    await discipline.save();

    const streak = await getStreakStats(req.user._id);

    res.json({
      success: true,
      discipline,
      streak,
      message: `Evening checkout complete. Your discipline streak is now ${streak.currentStreak} day${streak.currentStreak === 1 ? '' : 's'}!`,
    });
  } catch (error) {
    next(error);
  }
};

exports.getStreak = async (req, res, next) => {
  try {
    const streak = await getStreakStats(req.user._id);
    res.json({ success: true, streak });
  } catch (error) {
    next(error);
  }
};
