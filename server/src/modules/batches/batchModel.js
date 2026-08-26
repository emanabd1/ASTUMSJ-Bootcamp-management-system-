const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    // A batch represents a yearly bootcamp cohort.
    // Example: "2026 Bootcamp"
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // Kept for compatibility with the existing system.
    // Other modules such as sessions, announcements and assignments
    // already use Batch membership.
    mentors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model("Batch", batchSchema);