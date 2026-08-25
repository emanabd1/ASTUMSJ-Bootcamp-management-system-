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

// Let the student know their mentor touched their progress. Fire-and-forget:
// a notification failure should never block the actual progress save.
const notifyStudentOfProgress = async (record) => {
  try {
    await Notification.create({
      user: record.student,
      title: "Progress updated",
      message: `Your mentor updated "${record.topic}" — now ${record.percentage}% (${record.status}).`,
      type: "progress",
      link: "/student/progress",
      meta: {
        progressId: String(record._id),
        topic: record.topic,
      },
    });
  } catch (notifyErr) {
    console.error("Failed to create progress notification:", notifyErr);
  }
};

// Notify the other side of the mentor/student pair that a new comment
// was left on a progress topic.
const notifyOfComment = async ({ record, recipientId, authorName, authorRole }) => {
  try {
    await Notification.create({
      user: recipientId,
      title:
        authorRole === "student"
          ? "New reply from your student"
          : "New reply from your mentor",
      message: `${authorName} replied on "${record.topic}".`,
      type: "progress-comment",
      link:
        authorRole === "student"
          ? "/mentor/progress"
          : "/student/progress",
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
      // Mentor branch is handled separately below so we can merge in
      // "virtual" placeholder rows for assigned students who don't have
      // a real Progress record yet (previously these students silently
      // disappeared from the list, and updating them 404'd because
      // there was no Progress document for their id).
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

router.get(
  "/student/:studentId",
  async (req, res, next) => {
    try {
      if (
        req.user.role === "student" &&
        String(req.user._id) !==
          String(req.params.studentId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only view your own progress.",
        });
      }

      if (
        req.user.role === "mentor" &&
        !(await canManage(
          req.user,
          req.params.studentId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only view assigned students.",
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
  }
);

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
  }),
  async (req, res, next) => {
    try {
      if (
        !(await canManage(
          req.user,
          req.body.studentId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage assigned students.",
        });
      }

      const percentage =
        req.body.percentage !== undefined
          ? Number(req.body.percentage)
          : 0;

      if (
        Number.isNaN(percentage) ||
        percentage < 0 ||
        percentage > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Percentage must be between 0 and 100.",
        });
      }

      const r =
        await Progress.findOneAndUpdate(
          {
            student: req.body.studentId,
            topic: req.body.topic.trim(),
          },
          {
            student: req.body.studentId,
            mentor: req.user._id,
            topic: req.body.topic.trim(),
            percentage,
            status: req.body.status,
            note: String(
              req.body.note || ""
            ).trim(),
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      await notifyStudentOfProgress(r);

      res.status(201).json({
        success: true,
        progress: r,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const r = await Progress.findById(
        req.params.id
      );

      if (!r) {
        return res.status(404).json({
          success: false,
          message:
            "Progress record not found.",
        });
      }

      if (
        !(await canManage(
          req.user,
          r.student
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage assigned students.",
        });
      }

      if (
        req.body.status !== undefined &&
        !statuses.includes(req.body.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid progress status.",
        });
      }

      if (req.body.percentage !== undefined) {
        const percentage = Number(
          req.body.percentage
        );

        if (
          Number.isNaN(percentage) ||
          percentage < 0 ||
          percentage > 100
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Percentage must be between 0 and 100.",
          });
        }

        r.percentage = percentage;
      }

      if (req.body.topic !== undefined) {
        r.topic = String(
          req.body.topic
        ).trim();
      }

      if (req.body.status !== undefined) {
        r.status = req.body.status;
      }

      if (req.body.note !== undefined) {
        r.note = String(
          req.body.note
        ).trim();
      }

      await r.save();

      await notifyStudentOfProgress(r);

      res.json({
        success: true,
        progress: r,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:id/comments",
  async (req, res, next) => {
    try {
      const text = String(req.body.text || "").trim();

      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Comment text is required.",
        });
      }

      if (text.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment is too long (max 1000 characters).",
        });
      }

      const r = await Progress.findById(req.params.id);

      if (!r) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found.",
        });
      }

      // Either the mentor assigned to this student, or the student the
      // record belongs to, can post a reply. Admins can too.
      const isOwnStudent =
        req.user.role === "student" &&
        String(r.student) === String(req.user._id);

      const isManagingMentor =
        req.user.role === "mentor" &&
        (await canManage(req.user, r.student));

      if (
        !isOwnStudent &&
        !isManagingMentor &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You can't comment on this progress record.",
        });
      }

      r.comments.push({
        author: req.user._id,
        authorRole: req.user.role,
        text,
      });

      await r.save();

      const populated = await Progress.findById(r._id)
        .populate("student", "fullName email")
        .populate("mentor", "fullName")
        .populate("comments.author", "fullName role");

      // Notify whichever side didn't write the comment.
      const recipientId =
        req.user.role === "student" ? r.mentor : r.student;

      if (recipientId) {
        await notifyOfComment({
          record: r,
          recipientId,
          authorName: req.user.fullName || "Someone",
          authorRole: req.user.role,
        });
      }

      res.status(201).json({
        success: true,
        progress: populated,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const r = await Progress.findById(
        req.params.id
      );

      if (!r) {
        return res.status(404).json({
          success: false,
          message:
            "Progress record not found.",
        });
      }

      if (
        !(await canManage(
          req.user,
          r.student
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage assigned students.",
        });
      }

      await r.deleteOne();

      res.json({
        success: true,
        message: "Progress deleted.",
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;