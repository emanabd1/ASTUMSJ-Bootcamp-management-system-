const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("./userModel");
const University = require("../universities/universityModel");
const Batch = require("../batches/batchModel");
const Attendance = require("../attendance/attendanceModel");
const Assignment = require("../assignments/assignmentModel");
const Submission = require("../assignments/assignmentSubmissionModel");
const Progress = require("../progress/progressModel");
const Notification = require("../notifications/notificationModel");

const sendEmail = require("../../utils/sendEmail");
const { safeUser } = require("../auth/authController");

const sanitize = (user) => {
  const object = user.toObject
    ? user.toObject()
    : { ...user };

  delete object.password;
  delete object.passwordResetOtpHash;
  delete object.passwordResetOtpExpiresAt;
  delete object.passwordResetAttempts;

  return object;
};

/*
|--------------------------------------------------------------------------
| GET USERS
|--------------------------------------------------------------------------
*/
const getUsers = async (req, res, next) => {
  try {
    const {
      status,
      role,
      search,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(query)
      .select(
        "-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts"
      )
      .populate(
        "mentor",
        "fullName email role"
      )
      .populate(
        "university",
        "name shortName color idLabel"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PENDING APPLICATIONS
|--------------------------------------------------------------------------
*/
const getPendingApplications = async (
  req,
  res,
  next
) => {
  try {
    const users = await User.find({
      $or: [
        {
          status: "pending",
        },
        {
          status: {
            $exists: false,
          },
          role: {
            $in: ["student", "user"],
          },
          isApproved: false,
        },
      ],
    })
      .select(
        "-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts"
      )
      .populate(
        "mentor",
        "fullName email role"
      )
      .populate(
        "university",
        "name shortName color idLabel"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET ONE USER
|--------------------------------------------------------------------------
*/
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id
    )
      .select(
        "-password -passwordResetOtpHash -passwordResetOtpExpiresAt -passwordResetAttempts"
      )
      .populate(
        "mentor",
        "fullName email role"
      )
      .populate(
        "university",
        "name shortName color idLabel"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user: sanitize(user),
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/
const createUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      role,
      department,
      gender,
      yearOfStudy,
      githubUrl,
      leetcodeUrl,
      codeforcesUrl,
      batchId,
      university,
      universityIdNumber,
    } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and role are required.",
      });
    }

    if (
      !["student", "mentor", "admin"].includes(
        role
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    /*
     * STUDENT UNIVERSITY RULE
     *
     * A university can have MANY students.
     *
     * We only require the student to select a university.
     * We NEVER reject another student because that university
     * already has students.
     */
    if (role === "student" && !university) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a university for the student.",
      });
    }

    if (
      role === "student" &&
      !String(universityIdNumber || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter the student's university ID number.",
      });
    }

    if (
      batchId &&
      !(await Batch.exists({
        _id: batchId,
      }))
    ) {
      return res.status(404).json({
        success: false,
        message: "Selected batch not found.",
      });
    }

    if (
      university &&
      !(await University.exists({
        _id: university,
      }))
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Selected university not found.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      await User.findOne({
        email: normalizedEmail,
      })
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists.",
      });
    }

    const temporaryPassword = crypto
      .randomBytes(9)
      .toString("base64url")
      .slice(0, 12);

    const password = await bcrypt.hash(
      temporaryPassword,
      12
    );

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role,

      status: "approved",
      isActive: true,
      mustChangePassword: true,

      department,
      gender,
      yearOfStudy,

      githubUrl,
      leetcodeUrl,
      codeforcesUrl,

      university:
        role === "student"
          ? university
          : university || null,

      universityIdNumber:
        role === "student"
          ? String(
              universityIdNumber || ""
            ).trim()
          : "",

      bootcampReason:
        "Account created directly by administrator.",
    });

    if (batchId) {
      const batch = await Batch.findById(
        batchId
      );

      if (!batch) {
        return res.status(404).json({
          success: false,
          message:
            "Selected batch not found.",
        });
      }

      if (role === "student") {
        user.batch = batch._id;

        await user.save();

        await Batch.updateOne(
          {
            _id: batch._id,
          },
          {
            $addToSet: {
              students: user._id,
            },
          }
        );
      } else if (role === "mentor") {
        await Batch.updateOne(
          {
            _id: batch._id,
          },
          {
            $addToSet: {
              mentors: user._id,
            },
          }
        );
      }
    }

    try {
      await sendEmail({
        email: user.email,
        subject:
          "Your ASTUMSJ Bootcamp Account Has Been Created",
        message:
          `Hello ${user.fullName},\n\n` +
          `An administrator created your ASTUMSJ Bootcamp account.\n\n` +
          `Login email: ${user.email}\n` +
          `Temporary password: ${temporaryPassword}\n` +
          `Role: ${user.role}\n\n` +
          `Your account is active. Please log in and change your password from Settings immediately.`,
      });
    } catch (emailError) {
      await user.deleteOne();

      return res.status(500).json({
        success: false,
        message:
          `User was not created because the credential email could not be sent: ${emailError.message}`,
      });
    }

    res.status(201).json({
      success: true,
      message:
        "User created and login credentials sent by email.",
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      String(user._id) ===
        String(req.user._id) &&
      req.body.role &&
      req.body.role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove your own admin role.",
      });
    }

    const previousStatus =
      user.status ||
      (user.isApproved === false
        ? "pending"
        : "approved");

    const {
      fullName,
      email,
      role,
      department,
      gender,
      yearOfStudy,
      githubUrl,
      leetcodeUrl,
      codeforcesUrl,
      status,
      isActive,
      batchId,
      university,
      universityIdNumber,
    } = req.body;

    if (fullName !== undefined) {
      user.fullName =
        String(fullName).trim();
    }

    if (email !== undefined) {
      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const duplicate =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: user._id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Email is already in use.",
        });
      }

      user.email = normalizedEmail;
    }

    if (role !== undefined) {
      if (
        !["admin", "mentor", "student"].includes(
          role
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid role.",
        });
      }

      user.role = role;

      if (role !== "student") {
        user.mentor = null;
      }
    }

    if (department !== undefined) {
      user.department = department;
    }

    if (gender !== undefined) {
      user.gender = gender;
    }

    if (yearOfStudy !== undefined) {
      user.yearOfStudy = yearOfStudy;
    }

    if (githubUrl !== undefined) {
      user.githubUrl = githubUrl;
    }

    if (leetcodeUrl !== undefined) {
      user.leetcodeUrl = leetcodeUrl;
    }

    if (codeforcesUrl !== undefined) {
      user.codeforcesUrl =
        codeforcesUrl;
    }

    if (universityIdNumber !== undefined) {
      user.universityIdNumber =
        String(
          universityIdNumber
        ).trim();
    }

    if (university !== undefined) {
      if (
        university &&
        !(await University.exists({
          _id: university,
        }))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Selected university not found.",
        });
      }

      user.university =
        university || null;
    }

    /*
     * A student must always have a university.
     * Multiple students may have the same university.
     */
    if (user.role === "student") {
      if (!user.university) {
        return res.status(400).json({
          success: false,
          message:
            "A student must have a university.",
        });
      }

      if (
        !String(
          user.universityIdNumber || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A student must have a university ID number.",
        });
      }
    }

    if (status !== undefined) {
      if (
        ![
          "pending",
          "approved",
          "rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid account status.",
        });
      }

      user.status = status;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    if (batchId !== undefined) {
      if (
        batchId &&
        !(await Batch.exists({
          _id: batchId,
        }))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Selected batch not found.",
        });
      }

      await Batch.updateMany(
        {},
        {
          $pull: {
            students: user._id,
            mentors: user._id,
          },
        }
      );

      if (user.role === "student") {
        user.batch = batchId || null;
      } else {
        user.batch = null;
      }

      if (batchId) {
        await Batch.updateOne(
          {
            _id: batchId,
          },
          {
            $addToSet: {
              [user.role === "mentor"
                ? "mentors"
                : "students"]: user._id,
            },
          }
        );
      }
    }

    if (
      user.status === "rejected" ||
      user.status === "pending"
    ) {
      user.isActive = false;
    }

    if (
      status === "approved" &&
      isActive === undefined
    ) {
      user.isActive = true;
    }

    user.isApproved = undefined;

    await user.save();

    if (
      status &&
      status !== previousStatus &&
      ["approved", "rejected"].includes(
        status
      )
    ) {
      try {
        await sendEmail({
          email: user.email,
          subject:
            `Bootcamp Registration ${
              status === "approved"
                ? "Accepted"
                : "Rejected"
            }`,
          message:
            `Hello ${user.fullName},\n\n` +
            `Your ASTUMSJ Bootcamp registration has been ${status}.\n\n` +
            `${
              status === "approved"
                ? "You can now log in using your registered email and password."
                : "Thank you for your interest in the bootcamp."
            }`,
        });
      } catch (emailError) {
        console.error(
          "Status email failed:",
          emailError.message
        );
      }
    }

    res.json({
      success: true,
      message:
        "User updated successfully.",
      user: sanitize(user),
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/
const deleteUser = async (
  req,
  res,
  next
) => {
  try {
    if (
      String(req.params.id) ===
      String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account.",
      });
    }

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await Promise.all([
      Batch.updateMany(
        {},
        {
          $pull: {
            students: user._id,
            mentors: user._id,
          },
        }
      ),

      User.updateMany(
        {
          mentor: user._id,
        },
        {
          $set: {
            mentor: null,
          },
        }
      ),

      Attendance.deleteMany({
        $or: [
          {
            student: user._id,
          },
          {
            mentor: user._id,
          },
        ],
      }),

      Progress.deleteMany({
        $or: [
          {
            student: user._id,
          },
          {
            mentor: user._id,
          },
        ],
      }),

      Submission.deleteMany({
        student: user._id,
      }),

      Assignment.updateMany(
        {},
        {
          $pull: {
            targetStudents: user._id,
          },
        }
      ),

      Notification.deleteMany({
        user: user._id,
      }),
    ]);

    await user.deleteOne();

    res.json({
      success: true,
      message:
        "User deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD STATS
|--------------------------------------------------------------------------
*/
const getStats = async (
  req,
  res,
  next
) => {
  try {
    const [
      students,
      mentors,
      admins,
      pending,
      suspended,
      batches,
      attendance,
      assignments,
      submissions,
      recentUsers,
      recentAssignments,
      recentSubmissions,
    ] = await Promise.all([
      User.countDocuments({
        role: "student",
        status: "approved",
        isActive: true,
      }),

      User.countDocuments({
        role: "mentor",
        status: "approved",
        isActive: true,
      }),

      User.countDocuments({
        role: "admin",
        status: "approved",
        isActive: true,
      }),

      User.countDocuments({
        $or: [
          {
            status: "pending",
          },
          {
            status: {
              $exists: false,
            },
            isApproved: false,
          },
        ],
      }),

      User.countDocuments({
        status: "approved",
        isActive: false,
      }),

      Batch.countDocuments(),

      Attendance.find()
        .select("status date student")
        .lean(),

      Assignment.countDocuments(),

      Submission.countDocuments(),

      User.find()
        .select(
          "fullName role createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean(),

      Assignment.find()
        .select(
          "title creator createdAt"
        )
        .populate(
          "creator",
          "fullName"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean(),

      Submission.find()
        .select(
          "student assignment submittedAt status"
        )
        .populate(
          "student",
          "fullName"
        )
        .populate(
          "assignment",
          "title"
        )
        .sort({
          submittedAt: -1,
        })
        .limit(5)
        .lean(),
    ]);

    const presentLike =
      attendance.filter(
        (item) =>
          item.status === "Present"
      ).length;

    const attendancePercentage =
      attendance.length
        ? Math.round(
            (presentLike /
              attendance.length) *
              100
          )
        : 0;

    const graded =
      await Submission.countDocuments({
        status: "graded",
      });

    const pendingGrading =
      await Submission.countDocuments({
        status: "submitted",
      });

    const recentActivity = [
      ...recentUsers.map((item) => ({
        type: "user",
        text: `${item.fullName} (${item.role}) joined`,
        createdAt: item.createdAt,
      })),

      ...recentAssignments.map(
        (item) => ({
          type: "assignment",
          text: `Assignment created: ${item.title}`,
          createdAt:
            item.createdAt,
        })
      ),

      ...recentSubmissions.map(
        (item) => ({
          type: "submission",
          text: `${
            item.student?.fullName ||
            "Student"
          } submitted ${
            item.assignment?.title ||
            "an assignment"
          }`,
          createdAt:
            item.submittedAt,
        })
      ),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 10);

    res.json({
      success: true,
      stats: {
        students,
        mentors,
        admins,
        pending,
        suspended,
        batches,
        attendancePercentage,
        assignments,
        submissions,
        graded,
        pendingGrading,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| ASSIGN MENTOR
|--------------------------------------------------------------------------
*/
const assignMentor = async (
  req,
  res,
  next
) => {
  try {
    const { mentorId } =
      req.body;

    const student =
      await User.findById(
        req.params.id
      );

    const mentor =
      await User.findById(
        mentorId
      );

    if (
      !student ||
      student.role !== "student"
    ) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (
      !mentor ||
      mentor.role !== "mentor" ||
      mentor.status !== "approved" ||
      !mentor.isActive
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select an active mentor.",
      });
    }

    student.mentor =
      mentor._id;

    await student.save();

    const populated =
      await User.findById(
        student._id
      )
        .select("-password")
        .populate(
          "mentor",
          "fullName email role"
        );

    res.json({
      success: true,
      message:
        "Mentor assigned successfully.",
      user: populated,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| UNASSIGN MENTOR
|--------------------------------------------------------------------------
*/
const unassignMentor = async (
  req,
  res,
  next
) => {
  try {
    const student =
      await User.findById(
        req.params.id
      );

    if (
      !student ||
      student.role !== "student"
    ) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    student.mentor = null;

    await student.save();

    res.json({
      success: true,
      message:
        "Mentor assignment removed.",
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET MENTORS
|--------------------------------------------------------------------------
*/
const getMentors = async (
  req,
  res,
  next
) => {
  try {
    const mentors =
      await User.find({
        role: "mentor",
        status: "approved",
        isActive: true,
      })
        .select(
          "fullName email department"
        )
        .sort({
          fullName: 1,
        });

    res.json({
      success: true,
      mentors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getPendingApplications,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getStats,
  assignMentor,
  unassignMentor,
  getMentors,
};