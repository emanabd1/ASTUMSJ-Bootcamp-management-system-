const express = require("express");
const mongoose = require("mongoose");
const Batch = require("./batchModel");
const User = require("../users/userModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");

const router = express.Router();

// Require authentication for all routes here
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
  Array.isArray(value) ? value.filter((id) => mongoose.isValidObjectId(id)) : [];

router.get("/", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const query = req.user.role === "mentor" ? { mentors: req.user._id } : {};
    const batches = await Batch.find(query)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy")
      .sort({ startDate: -1 });

    res.json({ success: true, batches });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy");

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }
    if (req.user.role === "mentor" && !batch.mentors.some((mentor) => String(mentor._id) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: "You can only view assigned batches." });
    }

    res.json({ success: true, batch });
  } catch (e) {
    next(e);
  }
});

// Restrict all modification routes below strictly to admin
router.use(authorize("admin"));

router.post(
  "/",
  body({
    name: { required: true, maxLength: 200 },
    startDate: { required: true },
    endDate: { required: true }
  }),
  async (req, res, next) => {
    try {
      const { name, description = "", startDate, endDate, status = "upcoming" } = req.body;

      if (!name?.trim() || !validDates(startDate, endDate)) {
        return res.status(400).json({
          success: false,
          message: "Name and valid start/end dates are required."
        });
      }

      if (!["upcoming", "active", "completed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid batch status." });
      }

      const batch = await Batch.create({
        name: name.trim(),
        description,
        startDate,
        endDate,
        status
      });

      res.status(201).json({ success: true, batch });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id",
  body({ name: { maxLength: 200 } }),
  async (req, res, next) => {
    try {
      const batch = await Batch.findById(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found." });
      }

      const { name, description, startDate, endDate, status } = req.body;

      if (name !== undefined) {
        batch.name = String(name).trim();
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
        if (!["upcoming", "active", "completed"].includes(status)) {
          return res.status(400).json({ success: false, message: "Invalid batch status." });
        }
        batch.status = status;
      }

      if (!validDates(batch.startDate, batch.endDate)) {
        return res.status(400).json({
          success: false,
          message: "End date must be on or after start date."
        });
      }

      await batch.save();
      res.json({ success: true, batch });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    await User.updateMany({ batch: batch._id }, { $set: { batch: null } });
    await batch.deleteOne();

    res.json({ success: true, message: "Batch deleted." });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/mentors", async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const mentorIds = ids(req.body.mentorIds);
    const mentors = await User.find({
      _id: { $in: mentorIds },
      role: "mentor",
      status: "approved",
      isActive: true
    }).select("_id");

    batch.mentors = mentors.map((m) => m._id);
    await batch.save();

    res.json({ success: true, batch });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/students", async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const studentIds = ids(req.body.studentIds);
    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
      status: "approved",
      isActive: true
    }).select("_id batch");

    const newIds = students.map((s) => s._id);
    const oldIds = batch.students.map((s) => String(s));
    const newSet = new Set(newIds.map((s) => String(s)));
    const removed = oldIds.filter((id) => !newSet.has(id));

    if (removed.length) {
      await User.updateMany({ _id: { $in: removed } }, { $set: { batch: null } });
    }

    await User.updateMany({ _id: { $in: newIds } }, { $set: { batch: batch._id } });
    batch.students = newIds;
    await batch.save();

    const populated = await Batch.findById(batch._id)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy");

    res.json({ success: true, batch: populated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;