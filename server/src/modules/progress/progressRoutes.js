const express = require("express");
const Progress = require("./progressModel");
const User = require("../users/userModel");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const { body } = require("../../validation");
const {
  canManage,
  summarize,
} = require("../../services/progressService");

const router = express.Router();

router.use(protect);

const statuses = [
  "Not Started",
  "In Progress",
  "Completed",
  "Needs Improvement",
];

/*
|--------------------------------------------------------------------------
| GET ALL PROGRESS
|--------------------------------------------------------------------------
| Student -> only their own
| Mentor  -> only assigned students
| Admin   -> all students
*/
router.get("/", async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === "student") {
      query.student = req.user._id;
    }

    if (req.user.role === "mentor") {
      const assignedStudents = await User.find({
        role: "student",
        mentor: req.user._id,
        status: "approved",
        isActive: true,
      }).select("_id");

      query.student = {
        $in: assignedStudents.map(
          (student) => student._id
        ),
      };
    }

    if (
      req.user.role === "admin" &&
      req.query.studentId
    ) {
      query.student = req.query.studentId;
    }

    const records = await Progress.find(query)
      .populate(
        "student",
        "fullName firstName lastName email"
      )
      .populate("mentor", "fullName")
      .sort({
        student: 1,
        topic: 1,
      });

    res.json({
      success: true,
      progress: records,
      summary: summarize(records),
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET STUDENT PROGRESS
|--------------------------------------------------------------------------
*/
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
        .sort({ topic: 1 });

      res.json({
        success: true,
        progress: records,
        summary: summarize(records),
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE PROGRESS
|--------------------------------------------------------------------------
*/
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
      const {
        studentId,
        topic,
        status,
        percentage,
        note,
      } = req.body;

      if (
        !(await canManage(
          req.user,
          studentId
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage assigned students.",
        });
      }

      const progress =
        await Progress.findOneAndUpdate(
          {
            student: studentId,
            topic: topic.trim(),
          },

          {
            student: studentId,
            mentor: req.user._id,
            topic: topic.trim(),
            percentage:
              percentage !== undefined
                ? Number(percentage)
                : 0,
            status,
            note: String(note || "").trim(),
          },

          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      res.status(201).json({
        success: true,
        progress,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE PROGRESS
|--------------------------------------------------------------------------
| IMPORTANT: PATCH, not PUT.
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const progress =
        await Progress.findById(req.params.id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message:
            "Progress record not found.",
        });
      }

      if (
        !(await canManage(
          req.user,
          progress.student
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage assigned students.",
        });
      }

      const {
        topic,
        percentage,
        status,
        note,
      } = req.body;

      if (
        status !== undefined &&
        !statuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid progress status.",
        });
      }

      if (percentage !== undefined) {
        const value = Number(percentage);

        if (
          Number.isNaN(value) ||
          value < 0 ||
          value > 100
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Percentage must be between 0 and 100.",
          });
        }

        progress.percentage = value;
      }

      if (topic !== undefined) {
        progress.topic = String(topic).trim();
      }

      if (status !== undefined) {
        progress.status = status;
      }

      if (note !== undefined) {
        progress.note = String(note).trim();
      }

      progress.mentor = req.user._id;

      await progress.save();

      const updatedProgress =
        await Progress.findById(progress._id)
          .populate(
            "student",
            "fullName firstName lastName email"
          )
          .populate(
            "mentor",
            "fullName"
          );

      res.json({
        success: true,
        progress: updatedProgress,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE PROGRESS
|--------------------------------------------------------------------------
*/
router.delete(
  "/:id",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const progress =
        await Progress.findById(req.params.id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message:
            "Progress record not found.",
        });
      }

      if (
        !(await canManage(
          req.user,
          progress.student
        ))
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only manage assigned students.",
        });
      }

      await progress.deleteOne();

      res.json({
        success: true,
        message:
          "Progress deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| AT RISK STUDENTS
|--------------------------------------------------------------------------
*/
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
            }).select(
              "_id fullName email"
            )
          : await User.find({
              role: "student",
              status: "approved",
              isActive: true,
            }).select(
              "_id fullName email"
            );

      const rows = [];

      for (const student of students) {
        const records =
          await Progress.find({
            student: student._id,
          });

        const summary = summarize(records);

        if (summary.atRisk) {
          rows.push({
            ...student.toObject(),
            progressSummary: summary,
          });
        }
      }

      res.json({
        success: true,
        count: rows.length,
        students: rows,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;