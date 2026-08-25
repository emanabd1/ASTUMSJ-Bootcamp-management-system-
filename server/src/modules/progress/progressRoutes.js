const express = require("express");
const Progress = require("./progressModel");
const User = require("../users/userModel");
const Notification = require("../notifications/notificationModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");
const {
  canManage,
  summarize,
} = require("../../services/progressService");

// Fire-and-forget student notification with specialized dynamic query parameters
const notifyStudentOfProgress = async (record) => {
  try {
    await Notification.create({
      user: record.student,
      title: "Progress updated",
      message: `Your mentor updated "${record.topic}" — now ${record.percentage}% (${record.status}).`,
      type: "progress",
      link: `/student/progress?progressId=${record._id}`,
      meta: {
        progressId: String(record._id),
        topic: record.topic,
      },
    });
  } catch (notifyErr) {
    console.error("Failed to create progress notification:", notifyErr);
  }
};

// Comment notification capturing the proper redirection flag depending on author role
const notifyOfComment = async ({
  record,
  recipientId,
  authorName,
  authorRole,
}) => {
  try {
    const isFromStudent = authorRole === "student";

    await Notification.create({
      user: recipientId,
      title: isFromStudent
        ? "New reply from your student"
        : "New reply from your mentor",
      message: `${authorName} replied on "${record.topic}".`,
      type: "progress-comment",
      link: isFromStudent
        ? `/mentor/progress?progressId=${record._id}&openComments=1`
        : `/student/progress?progressId=${record._id}&openComments=1`,
      meta: {
        progressId: String(record._id),
        topic: record.topic,
      },
    });
  } catch (notifyErr) {
    console.error("Failed to create comment notification:", notifyErr);
  }
};

const router = express.Router();

router.use(protect);

const statuses = [
  "Not Started",
  "In Progress",
  "Completed",
  "Needs Improvement",
];

router.get("/", async (req, res, next) => {
  try {
    let q = {};

    if (req.user.role === "student") {
      q.student = req.user._id;
    } else if (req.user.role === "mentor") {
      const ss = await User.find({
        role: "student",
        mentor: req.user._id,
        status: "approved",
        isActive: true,
      }).select("_id fullName email");

      const studentIds = ss.map((s) => s._id);

      const records = await Progress.find({
        student: { $in: studentIds },
      })
        .populate("student", "fullName email")
        .populate("mentor", "fullName")
        .populate("comments.author", "fullName role")
        .sort({ student: 1, topic: 1 });

      const studentsWithProgress = new Set(
        records.map((r) => String(r.student?._id || r.student))
      );

      const placeholders = ss
        .filter((s) => !studentsWithProgress.has(String(s._id)))
        .map((s) => ({
          _id: null,
          isVirtual: true,
          student: {
            _id: s._id,
            fullName: s.fullName,
            email: s.email,
          },
          mentor: null,
          topic: "HTML / CSS",
          percentage: 0,
          status: "Not Started",
          note: "",
          updatedAt: null,
        }));

      return res.json({
        success: true,
        progress: [...records, ...placeholders],
        summary: summarize(records),
      });
    } else if (req.query.studentId) {
      q.student = req.query.studentId;
    }

    const records = await Progress.find(q)
      .populate("student", "fullName email")
      .populate("mentor", "fullName")
      .populate("comments.author", "fullName role")
      .sort({ student: 1, topic: 1 });

    res.json({
      success: true,
      progress: records,
      summary: summarize(records),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/student/:studentId", async (req, res, next) => {
  try {
    if (
      req.user.role === "student" &&
      String(req.user._id) !== String(req.params.studentId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own progress.",
      });
    }

    if (
      req.user.role === "mentor" &&
      !(await canManage(req.user, req.params.studentId))
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view assigned students.",
      });
    }

    const records = await Progress.find({
      student: req.params.studentId,
    })
      .populate("mentor", "fullName")
      .populate("comments.author", "fullName role")
      .sort({ topic: 1 });

    res.json({
      success: true,
      progress: records,
      summary: summarize(records),
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/at-risk",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const students =
        req.user.role === "mentor"
          ? await User.find({
              role: "student",
              mentor: req.user._id,
              status: "approved",
              isActive: true,
            }).select("_id fullName email")
          : await User.find({
              role: "student",
              status: "approved",
              isActive: true,
            }).select("_id fullName email");

      const rows = [];

      for (const s of students) {
        const records = await Progress.find({
          student: s._id,
        });

        const summary = summarize(records);

        if (summary.atRisk) {
          rows.push({
            ...s.toObject(),
            progressSummary: summary,
          });
        }
      }

      res.json({
        success: true,
        count: rows.length,
        students: rows,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/",
  authorize("admin", "mentor"),
  body({
    studentId: {
      required: true,
      type: "objectId",
    },
    topic: {
      required: true,
      maxLength: 200,
    },
    status: {
      required: true,
      enum: statuses,
    },
    percentage: {
      type: "number",
      min: 0,
      max: 100,
    },
    note: {
      type: "string",
    },
  }),
  async (req, res, next) => {
    try {
      const {
        studentId,
        topic,
        status,
        percentage,
        note,
      } = req.body;

      if (
        req.user.role === "mentor" &&
        !(await canManage(req.user, studentId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only manage assigned students.",
        });
      }

      const existingRecord = await Progress.findOne({
        student: studentId,
        topic,
      });

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: `Progress record for topic "${topic}" already exists. Use PUT to update instead.`,
        });
      }

      const record = await Progress.create({
        student: studentId,
        mentor:
          req.user.role === "mentor"
            ? req.user._id
            : null,
        topic,
        status,
        percentage: percentage || 0,
        note: note || "",
      });

      notifyStudentOfProgress(record);

      res.status(201).json({
        success: true,
        progress: record,
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
 * POST COMMENT ON PROGRESS RECORD
 *
 * Frontend request:
 * POST /api/progress/:id/comments
 *
 * This fixes the 404 error from StudentProgressPage.jsx.
 */
router.post(
  "/:id/comments",
  body({
    text: {
      required: true,
      type: "string",
      maxLength: 1000,
    },
  }),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const text = String(req.body.text || "").trim();

      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Comment text is required.",
        });
      }

      const record = await Progress.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found.",
        });
      }

      // Students can only comment on their own progress.
      if (
        req.user.role === "student" &&
        String(record.student) !== String(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only comment on your own progress.",
        });
      }

      // Mentors can only comment on progress belonging to their assigned students.
      if (
        req.user.role === "mentor" &&
        !(await canManage(req.user, record.student))
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only comment on assigned students.",
        });
      }

      record.comments.push({
        author: req.user._id,
        authorRole: req.user.role,
        text,
      });

      await record.save();

      const updated = await Progress.findById(record._id)
        .populate("student", "fullName email")
        .populate("mentor", "fullName")
        .populate("comments.author", "fullName role");

      const studentId = String(record.student);
      const mentorId = record.mentor ? String(record.mentor) : null;

      // Notify the other participant.
      if (req.user.role === "student" && mentorId) {
        notifyOfComment({
          record: updated,
          recipientId: record.mentor,
          authorName: req.user.fullName || "Your student",
          authorRole: req.user.role,
        });
      } else if (req.user.role === "mentor") {
        notifyOfComment({
          record: updated,
          recipientId: record.student,
          authorName: req.user.fullName || "Your mentor",
          authorRole: req.user.role,
        });
      }

      res.status(201).json({
        success: true,
        progress: updated,
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
 * UPDATE EXISTING PROGRESS RECORD
 *
 * Frontend request:
 * PATCH /api/progress/:id
 *
 * This route was missing, which caused:
 * "Route not found"
 */
router.patch(
  "/:id",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        topic,
        status,
        percentage,
        note,
      } = req.body;

      const record = await Progress.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found.",
        });
      }

      if (
        req.user.role === "mentor" &&
        !(await canManage(req.user, record.student))
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only manage assigned students.",
        });
      }

      if (topic && topic !== record.topic) {
        const duplicate = await Progress.findOne({
          _id: { $ne: record._id },
          student: record.student,
          topic,
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Progress record for topic "${topic}" already exists.`,
          });
        }

        record.topic = topic;
      }

      if (status !== undefined) {
        if (!statuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid progress status.",
          });
        }

        record.status = status;
      }

      if (percentage !== undefined) {
        const numericPercentage = Number(percentage);

        if (
          Number.isNaN(numericPercentage) ||
          numericPercentage < 0 ||
          numericPercentage > 100
        ) {
          return res.status(400).json({
            success: false,
            message: "Percentage must be between 0 and 100.",
          });
        }

        record.percentage = numericPercentage;
      }

      if (note !== undefined) {
        record.note = note;
      }

      record.updatedAt = new Date();

      await record.save();

      notifyStudentOfProgress(record);

      res.json({
        success: true,
        progress: record,
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;