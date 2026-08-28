const express = require("express");

const {
  CodingChallenge,
  CodingActivity,
} = require("./codingModel");

const User = require("../users/userModel");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const Notification = require("../notifications/notificationModel");

const router = express.Router();

router.use(protect);

const SOURCE_HOSTS = {
  leetcode: "leetcode.com",
  codeforces: "codeforces.com",
  github: "github.com",
};

/*
|--------------------------------------------------------------------------
| SOURCE URL VALIDATION
|--------------------------------------------------------------------------
*/
function isValidSourceUrl(
  platform,
  value
) {
  const expectedHost =
    SOURCE_HOSTS[platform];

  if (!expectedHost || !value) {
    return false;
  }

  try {
    const parsed = new URL(
      String(value).trim()
    );

    if (
      !["http:", "https:"].includes(
        parsed.protocol
      )
    ) {
      return false;
    }

    const hostname =
      parsed.hostname.toLowerCase();

    return (
      hostname === expectedHost ||
      hostname ===
        `www.${expectedHost}`
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| STREAK
|--------------------------------------------------------------------------
*/
function streak(activities) {
  const days = [
    ...new Set(
      activities.map(
        (activity) =>
          new Date(
            activity.completedAt
          )
            .toISOString()
            .slice(0, 10)
      )
    ),
  ]
    .sort()
    .reverse();

  if (!days.length) {
    return 0;
  }

  let count = 1;

  let previous = new Date(
    days[0]
  );

  for (
    let index = 1;
    index < days.length;
    index += 1
  ) {
    const current = new Date(
      days[index]
    );

    const difference = Math.round(
      (previous - current) /
        86400000
    );

    if (difference !== 1) {
      break;
    }

    count += 1;
    previous = current;
  }

  return count;
}

/*
|--------------------------------------------------------------------------
| CODING STATS
|--------------------------------------------------------------------------
*/
router.get(
  "/stats",
  async (req, res, next) => {
    try {
      const students =
        req.user.role ===
        "student"
          ? [req.user._id]
          : (
              await User.find({
                role: "student",
                mentor:
                  req.user._id,
                status:
                  "approved",
                isActive: true,
              }).select(
                "_id"
              )
            ).map(
              (student) =>
                student._id
            );

      const activities =
        await CodingActivity.find(
          {
            student: {
              $in: students,
            },
          }
        );

      const result = {};

      for (const id of students) {
        const ownActivities =
          activities.filter(
            (activity) =>
              String(
                activity.student
              ) ===
              String(id)
          );

        result[id] = {};

        for (const platform of Object.keys(
          SOURCE_HOSTS
        )) {
          const platformActivities =
            ownActivities.filter(
              (activity) =>
                activity.platform ===
                platform
            );

          result[id][
            platform
          ] = {
            count:
              platformActivities.length,

            streak:
              streak(
                platformActivities
              ),
          };
        }
      }

      res.json({
        success: true,
        stats: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| LEADERBOARD
|--------------------------------------------------------------------------
*/
router.get(
  "/leaderboard",
  async (req, res, next) => {
    try {
      const studentQuery = {
        role: "student",
        status: "approved",
        isActive: true,
      };

      if (
        req.user.role ===
        "mentor"
      ) {
        studentQuery.mentor =
          req.user._id;
      }

      if (
        req.user.role ===
        "student"
      ) {
        studentQuery._id =
          req.user._id;
      }

      const students =
        await User.find(
          studentQuery
        )
          .select(
            "_id fullName"
          )
          .lean();

      const activities =
        await CodingActivity.find(
          {
            student: {
              $in: students.map(
                (student) =>
                  student._id
              ),
            },
          }
        )
          .select(
            "student platform"
          )
          .lean();

      const leaderboard =
        students
          .map((student) => {
            const ownActivities =
              activities.filter(
                (activity) =>
                  String(
                    activity.student
                  ) ===
                  String(
                    student._id
                  )
              );

            return {
              _id:
                student._id,

              fullName:
                student.fullName,

              activities:
                ownActivities.length,

              platforms:
                new Set(
                  ownActivities.map(
                    (activity) =>
                      activity.platform
                  )
                ).size,
            };
          })
          .sort(
            (a, b) =>
              b.activities -
                a.activities ||
              a.fullName.localeCompare(
                b.fullName
              )
          );

      res.json({
        success: true,
        leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET CHALLENGES
|--------------------------------------------------------------------------
*/
router.get(
  "/challenges",
  async (req, res, next) => {
    try {
      const query =
        req.user.role ===
        "admin"
          ? {}
          : {
              assignedStudents:
                req.user._id,
            };

      const challenges =
        await CodingChallenge.find(
          query
        )
          .populate(
            "createdBy",
            "fullName"
          )
          .sort({
            dueDate: 1,
            createdAt: -1,
          });

      const myActivities =
        await CodingActivity.find(
          {
            student:
              req.user._id,

            challenge: {
              $in: challenges.map(
                (challenge) =>
                  challenge._id
              ),
            },
          }
        );

      const activityMap = {};

      myActivities.forEach(
        (activity) => {
          activityMap[
            String(
              activity.challenge
            )
          ] = activity;
        }
      );

      const withSubmissions =
        challenges.map(
          (challenge) => {
            const object =
              challenge.toObject();

            const activity =
              activityMap[
                String(
                  challenge._id
                )
              ];

            object.mySubmission =
              activity
                ? {
                    url:
                      activity.url,

                    attempts:
                      activity.attempts ||
                      1,

                    timeSpentMinutes:
                      activity.timeSpentMinutes ||
                      null,

                    completedAt:
                      activity.completedAt,
                  }
                : null;

            return object;
          }
        );

      res.json({
        success: true,
        challenges:
          withSubmissions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESOURCE SUBMISSIONS
|--------------------------------------------------------------------------
*/
router.get(
  "/resource-submissions",
  async (req, res, next) => {
    try {
      const activities =
        await CodingActivity.find(
          {
            student:
              req.user._id,

            resourceKey: {
              $ne: null,
            },
          }
        );

      const submissions = {};

      activities.forEach(
        (activity) => {
          submissions[
            activity.resourceKey
          ] = {
            url: activity.url,
            attempts:
              activity.attempts ||
              1,
            timeSpentMinutes:
              activity.timeSpentMinutes ||
              null,
            completedAt:
              activity.completedAt,
          };
        }
      );

      res.json({
        success: true,
        submissions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN RELEASE CODING PRACTICE
|--------------------------------------------------------------------------
*/
router.post(
  "/challenges",
  authorize("admin"),
  async (req, res, next) => {
    try {
      const {
        title,
        platform,
        problemUrl,
        description = "",
        dueDate,
        assignedStudents = [],
      } = req.body;

      if (
        !title?.trim() ||
        !platform
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title and question source are required.",
        });
      }

      if (
        !SOURCE_HOSTS[platform]
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid question source.",
        });
      }

      /*
       * IMPORTANT:
       *
       * LeetCode -> leetcode.com
       * Codeforces -> codeforces.com
       * GitHub -> github.com
       */
      if (
        !isValidSourceUrl(
          platform,
          problemUrl
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid URL. A ${platform} practice must use a ${SOURCE_HOSTS[platform]} URL.`,
        });
      }

      if (
        !Array.isArray(
          assignedStudents
        ) ||
        assignedStudents.length ===
          0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one student.",
        });
      }

      const uniqueStudentIds =
        [
          ...new Set(
            assignedStudents.map(
              String
            )
          ),
        ];

      const validStudents =
        await User.find({
          _id: {
            $in:
              uniqueStudentIds,
          },

          role: "student",

          status:
            "approved",

          isActive: true,
        }).select(
          "_id"
        );

      if (
        validStudents.length !==
        uniqueStudentIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected users are not active students.",
        });
      }

      const challenge =
        await CodingChallenge.create(
          {
            title:
              title.trim(),

            platform,

            problemUrl:
              problemUrl.trim(),

            description:
              String(
                description
              ).trim(),

            dueDate:
              dueDate || null,

            assignedStudents:
              validStudents.map(
                (student) =>
                  student._id
              ),

            createdBy:
              req.user._id,
          }
        );

      await Notification.insertMany(
        validStudents.map(
          (student) => ({
            user:
              student._id,

            title:
              `New ${platform} challenge`,

            message:
              `${title.trim()} has been assigned to you.`,

            type: "coding",

            link:
              "/student/coding",
          })
        )
      );

      res.status(201).json({
        success: true,
        message:
          "Coding practice released successfully.",
        challenge,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| STUDENT RECORD ACTIVITY
|--------------------------------------------------------------------------
*/
router.post(
  "/activity",
  authorize("student"),
  async (req, res, next) => {
    try {
      const {
        platform,
        url,
        note,
        challenge,
        resourceKey,
        timeSpentMinutes,
        attempts,
      } = req.body;

      if (
        !SOURCE_HOSTS[platform]
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid coding platform.",
        });
      }

      /*
       * Validate student-submitted URL too.
       * This prevents bypassing the frontend.
       */
      if (
        !isValidSourceUrl(
          platform,
          url
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid URL. A ${platform} activity must use a ${SOURCE_HOSTS[platform]} URL.`,
        });
      }

      const parsedTime =
        timeSpentMinutes ===
          undefined ||
        timeSpentMinutes ===
          null ||
        timeSpentMinutes ===
          ""
          ? null
          : Number(
              timeSpentMinutes
            );

      const parsedAttempts =
        attempts ===
          undefined ||
        attempts === null ||
        attempts === ""
          ? 1
          : Number(attempts);

      if (
        Number.isNaN(
          parsedAttempts
        ) ||
        parsedAttempts < 1 ||
        !Number.isInteger(
          parsedAttempts
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Attempts must be a whole number greater than or equal to 1.",
        });
      }

      if (
        parsedTime !== null &&
        (Number.isNaN(
          parsedTime
        ) ||
          parsedTime < 0)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Time taken must be 0 or greater.",
        });
      }

      let activity = null;

      if (challenge) {
        activity =
          await CodingActivity.findOne(
            {
              student:
                req.user._id,

              challenge,
            }
          );
      } else if (
        resourceKey
      ) {
        activity =
          await CodingActivity.findOne(
            {
              student:
                req.user._id,

              resourceKey,
            }
          );
      }

      if (activity) {
        activity.platform =
          platform;

        activity.url =
          url.trim();

        activity.note =
          note || "";

        activity.attempts =
          parsedAttempts;

        activity.timeSpentMinutes =
          parsedTime;

        activity.completedAt =
          new Date();

        await activity.save();
      } else {
        activity =
          await CodingActivity.create(
            {
              student:
                req.user._id,

              platform,

              url:
                url.trim(),

              note:
                note || "",

              challenge:
                challenge ||
                null,

              resourceKey:
                resourceKey ||
                null,

              attempts:
                parsedAttempts,

              timeSpentMinutes:
                parsedTime,
            }
          );
      }

      res.status(201).json({
        success: true,
        activity,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;