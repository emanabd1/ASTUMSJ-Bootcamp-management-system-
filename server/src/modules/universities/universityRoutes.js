const express = require("express");
const mongoose = require("mongoose");

const University = require("./universityModel");
const User = require("../users/userModel");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");
const { body } = require("../../validation");

const router = express.Router();

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/*
|--------------------------------------------------------------------------
| DEFAULT UNIVERSITY
|--------------------------------------------------------------------------
| If the database is completely new and there are no universities,
| automatically create ASTU so the registration page has a university.
*/
async function ensureDefaultUniversity() {
  const exists = await University.exists({});

  if (!exists) {
    await University.create({
      name: "Adama Science and Technology University",
      shortName: "ASTU",
      city: "Adama",
      idLabel: "Student ID",
      color: "#c89b7b",
      status: "active",
      notes:
        "Default university category. Admin can edit it or add additional universities.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| PUBLIC UNIVERSITIES
|--------------------------------------------------------------------------
| Registration page uses this endpoint because the applicant is not
| authenticated yet.
*/
router.get("/public", async (req, res, next) => {
  try {
    await ensureDefaultUniversity();

    const universities = await University.find({
      status: "active",
    })
      .select("name shortName idLabel")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      universities,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| ADMIN PROTECTION
|--------------------------------------------------------------------------
*/
router.use(protect, authorize("admin"));

/*
|--------------------------------------------------------------------------
| GET ALL UNIVERSITIES + REAL STUDENT COUNTS
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res, next) => {
  try {
    await ensureDefaultUniversity();

    const universities = await University.find({})
      .sort({ name: 1 })
      .lean();

    /*
     * IMPORTANT:
     *
     * A university is NOT unique per student.
     *
     * Example:
     * Student A -> ASTU
     * Student B -> ASTU
     * Student C -> ASTU
     *
     * All three must be counted.
     *
     * Only students are counted here.
     */
    const counts = await User.aggregate([
      {
        $match: {
          role: "student",
          university: {
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$university",
          total: {
            $sum: 1,
          },
        },
      },
    ]);

    const countByUniversity = new Map(
      counts.map((item) => [
        String(item._id),
        Number(item.total),
      ])
    );

    const universitiesWithCounts = universities.map(
      (university) => ({
        ...university,
        studentCount:
          countByUniversity.get(String(university._id)) || 0,
      })
    );

    res.json({
      success: true,
      universities: universitiesWithCounts,
    });
  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| CREATE UNIVERSITY
|--------------------------------------------------------------------------
*/
router.post(
  "/",
  body({
    name: {
      required: true,
      maxLength: 200,
    },
    shortName: {
      maxLength: 30,
    },
    city: {
      maxLength: 100,
    },
    idLabel: {
      maxLength: 60,
    },
  }),
  async (req, res, next) => {
    try {
      const {
        name,
        shortName = "",
        city = "",
        idLabel = "Student ID",
        color = "#c89b7b",
        status = "active",
        notes = "",
      } = req.body;

      if (!String(name || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "University name is required.",
        });
      }

      if (color && !HEX_COLOR.test(color)) {
        return res.status(400).json({
          success: false,
          message: "Color must be a valid hex code.",
        });
      }

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

      const university = await University.create({
        name: String(name).trim(),
        shortName: String(shortName).trim(),
        city: String(city).trim(),
        idLabel:
          String(idLabel).trim() || "Student ID",
        color: color || "#c89b7b",
        status,
        notes: String(notes).trim(),
      });

      res.status(201).json({
        success: true,
        university,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "A university with that name already exists.",
        });
      }

      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE UNIVERSITY
|--------------------------------------------------------------------------
*/
router.patch(
  "/:id",
  body({
    name: {
      maxLength: 200,
    },
    shortName: {
      maxLength: 30,
    },
    city: {
      maxLength: 100,
    },
    idLabel: {
      maxLength: 60,
    },
  }),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid university ID.",
        });
      }

      const university = await University.findById(
        req.params.id
      );

      if (!university) {
        return res.status(404).json({
          success: false,
          message: "University not found.",
        });
      }

      const {
        name,
        shortName,
        city,
        idLabel,
        color,
        status,
        notes,
      } = req.body;

      if (name !== undefined) {
        university.name = String(name).trim();
      }

      if (shortName !== undefined) {
        university.shortName = String(shortName).trim();
      }

      if (city !== undefined) {
        university.city = String(city).trim();
      }

      if (idLabel !== undefined) {
        university.idLabel =
          String(idLabel).trim() || "Student ID";
      }

      if (notes !== undefined) {
        university.notes = String(notes).trim();
      }

      if (color !== undefined) {
        if (color && !HEX_COLOR.test(color)) {
          return res.status(400).json({
            success: false,
            message: "Color must be a valid hex code.",
          });
        }

        university.color =
          color || "#c89b7b";
      }

      if (status !== undefined) {
        if (!["active", "inactive"].includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status.",
          });
        }

        university.status = status;
      }

      await university.save();

      res.json({
        success: true,
        university,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "A university with that name already exists.",
        });
      }

      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE UNIVERSITY
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid university ID.",
      });
    }

    const university = await University.findById(
      req.params.id
    );

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found.",
      });
    }

    const studentCount =
      await User.countDocuments({
        role: "student",
        university: university._id,
      });

    if (studentCount > 0) {
      return res.status(409).json({
        success: false,
        message: `${studentCount} student${
          studentCount > 1 ? "s are" : " is"
        } still linked to this university. Reassign them or mark the university inactive instead of deleting it.`,
      });
    }

    await university.deleteOne();

    res.json({
      success: true,
      message: "University deleted.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;