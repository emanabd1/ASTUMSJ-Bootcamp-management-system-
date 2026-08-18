const mongoose = require('mongoose');

const codingChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    platform: { type: String, enum: ['leetcode', 'codeforces', 'github'], required: true },
    problemUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    dueDate: { type: Date, default: null },
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const codingActivitySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, enum: ['leetcode', 'codeforces', 'github'], required: true },
    url: { type: String, default: '' },
    note: { type: String, default: '' },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingChallenge', default: null },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

codingActivitySchema.index({ student: 1, platform: 1, completedAt: 1 });

module.exports = {
  CodingChallenge: mongoose.model('CodingChallenge', codingChallengeSchema),
  CodingActivity: mongoose.model('CodingActivity', codingActivitySchema)
};