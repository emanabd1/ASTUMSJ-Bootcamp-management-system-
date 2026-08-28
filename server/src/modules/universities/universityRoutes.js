const express = require("express");
const University = require("./universityModel");
const User = require("../users/userModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");

const router = express.Router();

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Public: powers the University <select> on the signup page. No auth —
// applicants aren't logged in yet. Only active universities, minimal fields.
router.get("/public", async (req, res, next) => {
  try {
    const universities = await University.find({ status: "active" })
      .select("name shortName idLabel")
      .sort({ name: 1 });
    res.json({ success: true, universities });
  } catch (e) {
    next(e);
  }
});

// Everything below is admin-only category management.
router.use(protect, authorize("admin"));

router.get("/", async (req, res, next) => {
  try {
    const [universities, counts] = await Promise.all([
      University.find().sort({ name: 1 }).lean(),
      User.aggregate([
        {
          $match: {
            role: "student",
            university: { $ne: null },
          },
        },
        {
          $group: {
            _id: { $toString: "$university" },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Count only student accounts. Do not rely on the university document
    // storing a counter because users can be created/edited from several
    // places. This keeps the cards and per-university counts in sync.
    const countByUniversity = Object.fromEntries(
      counts.map((c) => [String(c._id), Number(c.total) || 0])
    );

    const withCounts = universities.map((u) => ({
      ...u,
      studentCount: countByUniversity[String(u._id)] || 0,
    }));

    res.json({ success: true, universities: withCounts });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  body({
    name: { required: true, maxLength: 200 },
    shortName: { maxLength: 30 },
    city: { maxLength: 100 },
    idLabel: { maxLength: 60 },
  }),
  async (req, res, next) => {
    try {
      const { name, shortName = "", city = "", idLabel = "", color, status = "active", notes = "" } = req.body;

      if (color && !HEX_COLOR.test(color)) {
        return res.status(400).json({ success: false, message: "Color must be a valid hex code." });
      }
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }

      const university = await University.create({
        name: name.trim(),
        shortName: shortName.trim(),
        city: city.trim(),
        idLabel: idLabel.trim() || "Student ID",
        color: color || "#c89b7b",
        status,
        notes: notes.trim(),
      });

      res.status(201).json({ success: true, university });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: "A university with that name already exists." });
      }
      next(e);
    }
  }
);

router.patch(
  "/:id",
  body({ name: { maxLength: 200 }, shortName: { maxLength: 30 }, city: { maxLength: 100 }, idLabel: { maxLength: 60 } }),
  async (req, res, next) => {
    try {
      const university = await University.findById(req.params.id);
      if (!university) {
        return res.status(404).json({ success: false, message: "University not found." });
      }

      const { name, shortName, city, idLabel, color, status, notes } = req.body;

      if (name !== undefined) university.name = String(name).trim();
      if (shortName !== undefined) university.shortName = String(shortName).trim();
      if (city !== undefined) university.city = String(city).trim();
      if (idLabel !== undefined) university.idLabel = String(idLabel).trim() || "Student ID";
      if (notes !== undefined) university.notes = String(notes).trim();
      if (color !== undefined) {
        if (color && !HEX_COLOR.test(color)) {
          return res.status(400).json({ success: false, message: "Color must be a valid hex code." });
        }
        university.color = color || "#c89b7b";
      }
      if (status !== undefined) {
        if (!["active", "inactive"].includes(status)) {
          return res.status(400).json({ success: false, message: "Invalid status." });
        }
        university.status = status;
      }

      await university.save();
      res.json({ success: true, university });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: "A university with that name already exists." });
      }
      next(e);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ success: false, message: "University not found." });
    }

    const studentCount = await User.countDocuments({ university: university._id });
    if (studentCount > 0) {
      return res.status(409).json({
        success: false,
        message: `${studentCount} user${studentCount > 1 ? "s are" : " is"} still linked to this university. Reassign or mark it inactive instead of deleting it.`,
      });
    }

    await university.deleteOne();
    res.json({ success: true, message: "University deleted." });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
