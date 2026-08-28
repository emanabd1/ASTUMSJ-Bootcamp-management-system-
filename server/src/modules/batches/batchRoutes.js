const express = require("express");
const mongoose = require("mongoose");
const Batch = require("./batchModel");
const BatchYear = require("../batchYears/batchYearModel");
const User = require("../users/userModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");

const router = express.Router();

// Require authentication for all routes here
router.use(protect);

const ids = (value) =>
  Array.isArray(value) ? value.filter((id) => mongoose.isValidObjectId(id)) : [];

router.get("/", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const query = req.user.role === "mentor" ? { mentors: req.user._id } : {};
    const batches = await Batch.find(query)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy")
      .populate("batchYear", "name startDate endDate status")
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
      .populate("students", "fullName email department yearOfStudy")
      .populate("batchYear", "name startDate endDate status");

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
    batchYearId: { required: true }
  }),
  async (req, res, next) => {
    try {
      const { name, description = "", batchYearId, status = "upcoming" } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ success: false, message: "A group name is required." });
      }
      if (!mongoose.isValidObjectId(batchYearId)) {
        return res.status(400).json({ success: false, message: "Choose which batch this group belongs to." });
      }

      const batchYear = await BatchYear.findById(batchYearId);
      if (!batchYear) {
        return res.status(404).json({ success: false, message: "That batch no longer exists." });
      }

      if (!["upcoming", "active", "completed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid batch status." });
      }

      // Groups inherit their timeframe from the parent batch (year) instead
      // of asking the admin for dates every time.
      const batch = await Batch.create({
        name: name.trim(),
        description,
        batchYear: batchYear._id,
        startDate: batchYear.startDate,
        endDate: batchYear.endDate,
        status
      });

      const populated = await Batch.findById(batch._id).populate("batchYear", "name startDate endDate status");

      res.status(201).json({ success: true, batch: populated });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: "A group with that name already exists." });
      }
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

      const { name, description, status, batchYearId } = req.body;

      if (name !== undefined) {
        batch.name = String(name).trim();
      }
      if (description !== undefined) {
        batch.description = String(description);
      }
      if (status !== undefined) {
        if (!["upcoming", "active", "completed"].includes(status)) {
          return res.status(400).json({ success: false, message: "Invalid batch status." });
        }
        batch.status = status;
      }

      // Moving a group to a different batch (year) also carries its dates along,
      // since a group's timeframe is always inherited from its parent batch.
      if (batchYearId !== undefined) {
        if (!mongoose.isValidObjectId(batchYearId)) {
          return res.status(400).json({ success: false, message: "Choose a valid batch." });
        }
        const batchYear = await BatchYear.findById(batchYearId);
        if (!batchYear) {
          return res.status(404).json({ success: false, message: "That batch no longer exists." });
        }
        batch.batchYear = batchYear._id;
        batch.startDate = batchYear.startDate;
        batch.endDate = batchYear.endDate;
      }

      await batch.save();
      const populated = await Batch.findById(batch._id).populate("batchYear", "name startDate endDate status");
      res.json({ success: true, batch: populated });
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
    if (batch.batchYear) {
      const batchYear = await BatchYear.findById(batch.batchYear).select("mentors");
      const allowedMentors = new Set((batchYear?.mentors || []).map((id) => String(id)));
      if (mentorIds.some((id) => !allowedMentors.has(String(id)))) return res.status(400).json({ success: false, message: "Choose mentors from this batch's roster." });
    }
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
    if (batch.batchYear) {
      const batchYear = await BatchYear.findById(batch.batchYear).select("students");
      const allowedStudents = new Set((batchYear?.students || []).map((id) => String(id)));
      if (studentIds.some((id) => !allowedStudents.has(String(id)))) return res.status(400).json({ success: false, message: "Choose students from this batch's roster." });
    }
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

    // A student can only belong to one group at a time: pull them out of any
    // other group's roster before adding them here, so rosters stay in sync
    // with User.batch instead of a student silently lingering in two groups.
    if (newIds.length) {
      await Batch.updateMany(
        { _id: { $ne: batch._id } },
        { $pull: { students: { $in: newIds } } }
      );
    }

    await User.updateMany({ _id: { $in: newIds } }, { $set: { batch: batch._id } });
    batch.students = newIds;
    await batch.save();

    const populated = await Batch.findById(batch._id)
      .populate("mentors", "fullName email")
      .populate("students", "fullName email department yearOfStudy")
      .populate("batchYear", "name startDate endDate status");

    res.json({ success: true, batch: populated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;