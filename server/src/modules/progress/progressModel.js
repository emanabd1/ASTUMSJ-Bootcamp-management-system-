const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Not Started",
        "In Progress",
        "Completed",
        "Needs Improvement",
      ],
      default: "Not Started",
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    // Lightweight two-way thread on top of the mentor's note — lets the
    // student ask a question or the mentor follow up without needing a
    // full chat system.
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        authorRole: {
          type: String,
          enum: ["admin", "mentor", "student"],
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

progressSchema.index(
  { student: 1, topic: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Progress",
  progressSchema
);