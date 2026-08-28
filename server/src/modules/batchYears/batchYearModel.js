const mongoose = require('mongoose');

// A "Batch" here is the yearly/termly container admins rarely touch
// (e.g. "2026 Batch", "Batch 4"). Day-to-day mentor/student groups
// (the old Batch model) now live inside one of these via `batchYear`.
const batchYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

batchYearSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('BatchYear', batchYearSchema);