const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String },
    path: { type: String },
    size: { type: Number },
    mimeType: { type: String },
  },
  { _id: false }
);

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
  method: {
    type: String,
    enum: ['github', 'files', 'text'],
    default: 'text',
  },
  githubUrl: {
    type: String,
    default: '',
  },
  liveDemoUrl: {
    type: String,
    default: '',
  },
  textAnswer: {
    type: String,
    default: '',
  },
  files: {
    type: [fileSchema],
    default: [],
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
    enum: ['submitted', 'graded', 'redo'],
    default: 'submitted',
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  gradedAt: {
    type: Date,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Submission', submissionSchema);