const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: false,
  },
  method: { type: String, enum: ['github', 'files', 'text'], default: 'text' },
  githubUrl: { type: String, default: '' },
  liveDemoUrl: { type: String, default: '' },
  textAnswer: { type: String, default: '' },
  files: [{ originalName: String, path: String, size: Number, mimeType: String }],
  resubmissionReason: { type: String, default: '' },
  version: { type: Number, default: 1 },
  fileUrl: {
    type: String,
    required: false,
  },
  score: {
    type: Number,
    default: null,
  },
  feedback: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'resubmission_requested'], // Added 'resubmission_requested' here
    default: 'submitted',
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Submission', submissionSchema);