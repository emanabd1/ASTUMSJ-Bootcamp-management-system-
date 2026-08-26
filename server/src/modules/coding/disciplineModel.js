const mongoose = require('mongoose');

const disciplineGoalSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const dailyDisciplineSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // A calendar-day key avoids UTC/local-time bugs around midnight.
    // Format: YYYY-MM-DD in DISCIPLINE_TIMEZONE.
    dateKey: { type: String, required: true },
    goals: {
      type: [disciplineGoalSchema],
      validate: {
        validator: (value) => value.length >= 1 && value.length <= 3,
        message: 'Daily commitment must contain 1 to 3 goals.',
      },
    },
    focusRating: { type: Number, min: 1, max: 5, default: null },
    eveningCheckout: { type: Boolean, default: false },
    checkedOutAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dailyDisciplineSchema.index({ student: 1, dateKey: 1 }, { unique: true });

dailyDisciplineSchema.index({ student: 1, eveningCheckout: 1, dateKey: -1 });

module.exports = mongoose.model('DailyDiscipline', dailyDisciplineSchema);
