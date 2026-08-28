const express = require("express");
const mongoose = require("mongoose");
const BatchYear = require("./batchYearModel");
const Batch = require("../batches/batchModel");
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

// Admins and mentors can both see the list of batches (years), same as groups
router.get("/", authorize("admin", "mentor"), async (req, res, next) => {
  try {
    const batchYears = await BatchYear.find().populate('mentors', 'fullName email').populate('students', 'fullName email department yearOfStudy').sort({ startDate: -1 });
    res.json({ success: true, batchYears });
  } catch (e) {
    next(e);
  }
});

// Everything below is rare, admin-only maintenance of the yearly container
router.use(authorize("admin"));

router.post(
  "/",
  body({
    name: { required: true, maxLength: 200 },
    startDate: { required: true },
    endDate: { required: true },
  }),
  async (req, res, next) => {
    try {
      const { name, description = "", startDate, endDate, status = "upcoming" } = req.body;

      if (!name?.trim() || !validDates(startDate, endDate)) {
        return res.status(400).json({
          success: false,
          message: "Name and valid start/end dates are required.",
        });
      }
      if (!["upcoming", "active", "completed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }

      const batchYear = await BatchYear.create({
        name: name.trim(),
        description,
        startDate,
        endDate,
        status,
      });

      res.status(201).json({ success: true, batchYear });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: "A batch with that name already exists." });
      }
      next(e);
    }
  }
);

router.patch("/:id", body({ name: { maxLength: 200 } }), async (req, res, next) => {
  try {
    const batchYear = await BatchYear.findById(req.params.id);
    if (!batchYear) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const { name, description, startDate, endDate, status } = req.body;

    if (name !== undefined) batchYear.name = String(name).trim();
    if (description !== undefined) batchYear.description = String(description);
    if (startDate !== undefined) batchYear.startDate = startDate;
    if (endDate !== undefined) batchYear.endDate = endDate;
    if (status !== undefined) {
      if (!["upcoming", "active", "completed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }
      batchYear.status = status;
    }

    if (!validDates(batchYear.startDate, batchYear.endDate)) {
      return res.status(400).json({ success: false, message: "End date must be on or after start date." });
    }

    await batchYear.save();

    // Keep child groups' displayed date range in sync with their parent batch
    if (startDate !== undefined || endDate !== undefined) {
      await Batch.updateMany(
        { batchYear: batchYear._id },
        { $set: { startDate: batchYear.startDate, endDate: batchYear.endDate } }
      );
    }

    res.json({ success: true, batchYear });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ success: false, message: "A batch with that name already exists." });
    }
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const batchYear = await BatchYear.findById(req.params.id);
    if (!batchYear) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const groupCount = await Batch.countDocuments({ batchYear: batchYear._id });
    if (groupCount > 0) {
      return res.status(409).json({
        success: false,
        message: `This batch still has ${groupCount} group${groupCount > 1 ? "s" : ""} inside it. Move or delete them first.`,
      });
    }

    await batchYear.deleteOne();
    res.json({ success: true, message: "Batch deleted." });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/roster", async (req, res, next) => {
  try {
    const batchYear = await BatchYear.findById(req.params.id);
    if (!batchYear) return res.status(404).json({ success: false, message: "Batch not found." });
    const mentorIds = Array.isArray(req.body.mentorIds) ? req.body.mentorIds.filter((id) => mongoose.isValidObjectId(id)) : [];
    const studentIds = Array.isArray(req.body.studentIds) ? req.body.studentIds.filter((id) => mongoose.isValidObjectId(id)) : [];
    const [validMentors, validStudents] = await Promise.all([
      User.find({ _id: { $in: mentorIds }, role: "mentor", status: "approved", isActive: true }).select("_id"),
      User.find({ _id: { $in: studentIds }, role: "student", status: "approved", isActive: true }).select("_id"),
    ]);
    batchYear.mentors = validMentors.map((user) => user._id);
    batchYear.students = validStudents.map((user) => user._id);
    await batchYear.save();
    const populated = await BatchYear.findById(batchYear._id).populate('mentors', 'fullName email').populate('students', 'fullName email department yearOfStudy');
    res.json({ success: true, batchYear: populated });
  } catch (e) { next(e); }
});

module.exports = router;