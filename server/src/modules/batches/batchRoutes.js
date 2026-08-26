const express = require("express");
const mongoose = require("mongoose");

const Batch = require("./batchModel");
const Group = require("../groups/groupModel");
const User = require("../users/userModel");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");

const router = express.Router();

router.use(protect);

const validDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return (
    startDate &&
    endDate &&
    !Number.isNaN(start.getTime()) &&
    !Number.isNaN(end.getTime()) &&
    end >= start
  );
};

const ids = (value) =>
  Array.isArray(value)
    ? value.filter((id) => mongoose.isValidObjectId(id))
    : [];

/* =========================================================
   BATCHES
   ========================================================= */

// Get all batches
router.get("/", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const query =
      req.user.role === "mentor"
        ? { mentors: req.user._id }
        : {};

    const batches = await Batch.find(query)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy")
      .sort({ startDate: -1 });

    res.json({
      success: true,
      batches,
    });
  } catch (e) {
    next(e);
  }
});

// Get one batch
router.get("/:id", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID.",
      });
    }

    const batch = await Batch.findById(req.params.id)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy");

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    if (
      req.user.role === "mentor" &&
      !batch.mentors.some(
        (mentor) =>
          String(mentor._id) === String(req.user._id)
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view assigned batches.",
      });
    }

    res.json({
      success: true,
      batch,
    });
  } catch (e) {
    next(e);
  }
});

/*
=========================================================
GROUPS INSIDE A BATCH
=========================================================
*/

// Get groups belonging to a batch
router.get(
  "/:batchId/groups",
  authorize("admin", "mentor"),
  async (req, res, next) => {
    try {
      const { batchId } = req.params;

      if (!mongoose.isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID.",
        });
      }

      const batch = await Batch.findById(batchId).select(
        "_id name mentors students"
      );

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      const query = {
        batch: batchId,
      };

      // Mentors only see groups assigned to them.
      if (req.user.role === "mentor") {
        query.mentors = req.user._id;
      }

      const groups = await Group.find(query)
        .populate("batch", "name startDate endDate status")
        .populate("mentors", "fullName email")
        .populate(
          "students",
          "fullName email department yearOfStudy"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        groups,
      });
    } catch (e) {
      next(e);
    }
  }
);

/*
=========================================================
ADMIN MODIFICATION ROUTES
=========================================================
*/

router.use(authorize("admin"));

/* -------------------------
   CREATE BATCH
------------------------- */

router.post(
  "/",
  body({
    name: {
      required: true,
      maxLength: 200,
    },
    startDate: {
      required: true,
    },
    endDate: {
      required: true,
    },
  }),
  async (req, res, next) => {
    try {
      const {
        name,
        description = "",
        startDate,
        endDate,
        status = "upcoming",
      } = req.body;

      if (!name?.trim() || !validDates(startDate, endDate)) {
        return res.status(400).json({
          success: false,
          message:
            "Batch name and valid start/end dates are required.",
        });
      }

      if (
        !["upcoming", "active", "completed"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch status.",
        });
      }

      const batch = await Batch.create({
        name: name.trim(),
        description,
        startDate,
        endDate,
        status,
      });

      res.status(201).json({
        success: true,
        batch,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* -------------------------
   UPDATE BATCH
------------------------- */

router.patch(
  "/:id",
  body({
    name: {
      maxLength: 200,
    },
  }),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID.",
        });
      }

      const batch = await Batch.findById(req.params.id);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      const {
        name,
        description,
        startDate,
        endDate,
        status,
      } = req.body;

      if (name !== undefined) {
        const cleanName = String(name).trim();

        if (!cleanName) {
          return res.status(400).json({
            success: false,
            message: "Batch name cannot be empty.",
          });
        }

        batch.name = cleanName;
      }

      if (description !== undefined) {
        batch.description = String(description);
      }

      if (startDate !== undefined) {
        batch.startDate = startDate;
      }

      if (endDate !== undefined) {
        batch.endDate = endDate;
      }

      if (status !== undefined) {
        if (
          !["upcoming", "active", "completed"].includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid batch status.",
          });
        }

        batch.status = status;
      }

      if (!validDates(batch.startDate, batch.endDate)) {
        return res.status(400).json({
          success: false,
          message:
            "End date must be on or after start date.",
        });
      }

      await batch.save();

      res.json({
        success: true,
        batch,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* -------------------------
   DELETE BATCH
------------------------- */

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID.",
      });
    }

    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    // Delete all groups belonging to this batch.
    await Group.deleteMany({
      batch: batch._id,
    });

    // Remove batch from users.
    await User.updateMany(
      {
        batch: batch._id,
      },
      {
        $set: {
          batch: null,
        },
      }
    );

    await batch.deleteOne();

    res.json({
      success: true,
      message: "Batch and its groups deleted.",
    });
  } catch (e) {
    next(e);
  }
});

/* =========================================================
   CREATE GROUP
   ========================================================= */

router.post(
  "/:batchId/groups",
  body({
    name: {
      required: true,
      maxLength: 200,
    },
  }),
  async (req, res, next) => {
    try {
      const { batchId } = req.params;

      if (!mongoose.isValidObjectId(batchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID.",
        });
      }

      const batch = await Batch.findById(batchId);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      const {
        name,
        description = "",
      } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Group name is required.",
        });
      }

      const group = await Group.create({
        name: name.trim(),
        description: String(description || "").trim(),
        batch: batch._id,
      });

      const populated = await Group.findById(group._id)
        .populate("batch", "name startDate endDate status")
        .populate("mentors", "fullName email")
        .populate(
          "students",
          "fullName email department yearOfStudy"
        );

      res.status(201).json({
        success: true,
        group: populated,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   UPDATE GROUP
   ========================================================= */

router.patch(
  "/:batchId/groups/:groupId",
  body({
    name: {
      maxLength: 200,
    },
  }),
  async (req, res, next) => {
    try {
      const {
        batchId,
        groupId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(batchId) ||
        !mongoose.isValidObjectId(groupId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch or group ID.",
        });
      }

      const group = await Group.findOne({
        _id: groupId,
        batch: batchId,
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found in this batch.",
        });
      }

      const {
        name,
        description,
      } = req.body;

      if (name !== undefined) {
        const cleanName = String(name).trim();

        if (!cleanName) {
          return res.status(400).json({
            success: false,
            message: "Group name cannot be empty.",
          });
        }

        group.name = cleanName;
      }

      if (description !== undefined) {
        group.description = String(description);
      }

      await group.save();

      const populated = await Group.findById(group._id)
        .populate("batch", "name startDate endDate status")
        .populate("mentors", "fullName email")
        .populate(
          "students",
          "fullName email department yearOfStudy"
        );

      res.json({
        success: true,
        group: populated,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   DELETE GROUP
   ========================================================= */

router.delete(
  "/:batchId/groups/:groupId",
  async (req, res, next) => {
    try {
      const {
        batchId,
        groupId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(batchId) ||
        !mongoose.isValidObjectId(groupId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch or group ID.",
        });
      }

      const group = await Group.findOne({
        _id: groupId,
        batch: batchId,
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      await group.deleteOne();

      res.json({
        success: true,
        message: "Group deleted.",
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   ASSIGN GROUP MENTORS
   ========================================================= */

router.patch(
  "/:batchId/groups/:groupId/mentors",
  async (req, res, next) => {
    try {
      const {
        batchId,
        groupId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(batchId) ||
        !mongoose.isValidObjectId(groupId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch or group ID.",
        });
      }

      const group = await Group.findOne({
        _id: groupId,
        batch: batchId,
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      const mentorIds = ids(req.body.mentorIds);

      const mentors = await User.find({
        _id: {
          $in: mentorIds,
        },
        role: "mentor",
        status: "approved",
        isActive: true,
      }).select("_id");

      group.mentors = mentors.map((mentor) => mentor._id);

      await group.save();

      const populated = await Group.findById(group._id)
        .populate("batch", "name startDate endDate status")
        .populate("mentors", "fullName email")
        .populate(
          "students",
          "fullName email department yearOfStudy"
        );

      res.json({
        success: true,
        group: populated,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================================================
   ASSIGN GROUP STUDENTS
   ========================================================= */

router.patch(
  "/:batchId/groups/:groupId/students",
  async (req, res, next) => {
    try {
      const {
        batchId,
        groupId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(batchId) ||
        !mongoose.isValidObjectId(groupId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch or group ID.",
        });
      }

      const batch = await Batch.findById(batchId);

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found.",
        });
      }

      const group = await Group.findOne({
        _id: groupId,
        batch: batchId,
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      const studentIds = ids(req.body.studentIds);

      const students = await User.find({
        _id: {
          $in: studentIds,
        },
        role: "student",
        status: "approved",
        isActive: true,
      }).select("_id batch");

      const newIds = students.map((student) => student._id);

      /*
       * Remove these students from every other group.
       * A student belongs to only one mentoring group.
       */
      if (newIds.length) {
        await Group.updateMany(
          {
            _id: {
              $ne: group._id,
            },
            students: {
              $in: newIds,
            },
          },
          {
            $pull: {
              students: {
                $in: newIds,
              },
            },
          }
        );
      }

      /*
       * Students assigned to this group must also belong
       * to the batch containing the group.
       */
      await User.updateMany(
        {
          _id: {
            $in: newIds,
          },
        },
        {
          $set: {
            batch: batch._id,
          },
        }
      );

      /*
       * Students removed from this group are not automatically
       * removed from the yearly batch because they may still
       * belong to the batch without being assigned to a group.
       */
      group.students = newIds;

      await group.save();

      const populated = await Group.findById(group._id)
        .populate("batch", "name startDate endDate status")
        .populate("mentors", "fullName email")
        .populate(
          "students",
          "fullName email department yearOfStudy"
        );

      res.json({
        success: true,
        group: populated,
      });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;