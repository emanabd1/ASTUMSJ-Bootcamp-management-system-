const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const passport = require("./config/passport");


const authRoutes = require("./modules/auth/authRoutes");
const userRoutes = require("./modules/users/userRoutes");
const mentorRoutes = require("./modules/mentors/mentorRoutes");
const batchRoutes = require("./modules/batches/batchRoutes");
const batchYearRoutes = require("./modules/batchYears/batchYearRoutes");
const universityRoutes = require("./modules/universities/universityRoutes");
const settingsRoutes = require("./modules/settings/settingsRoutes");
const studentRoutes = require("./modules/students/studentRoutes");
const assignmentRoutes = require("./modules/assignments/assignmentRoutes");
const notificationRoutes = require("./modules/notifications/notificationRoutes");
const codingRoutes = require("./modules/coding/codingRoutes");
const disciplineRoutes = require("./modules/coding/disciplineRoutes");
const announcementRoutes = require("./modules/announcements/announcementRoutes");
const attendanceRoutes = require("./modules/attendance/attendanceRoutes");
const progressRoutes = require("./modules/progress/progressRoutes");
const submissionRoutes = require("./modules/submissions/submissionRoutes");
const sessionRoutes = require("./modules/sessions/sessionRoutes");
const communityRoutes = require("./modules/community/communityRoutes");
const achievementRoutes = require("./modules/achievements/achievementRoutes");
const reportRoutes = require("./modules/reports/reportRoutes");
const chatRoutes = require("./modules/chat/chatRoutes");
const adminCommitteeRoutes = require("./modules/adminCommittee/adminCommitteeRoutes");
const errorHandler = require("./middleware/errorHandler");
const { startNotificationScheduler } = require("./utils/notificationScheduler");
const seedUniversities = require("./utils/seedUniversities");
const fixUserIndexes = require("./utils/fixUserIndexes");

const app = express();
app.use(passport.initialize());
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing. Add it to server/.env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to server/.env");
  process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/batch-years", batchYearRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/discipline", disciplineRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin-committee", adminCommitteeRoutes);

app.use("/uploads", express.static(require("path").join(__dirname, "../uploads")));

app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "Bootcamp Management API is running." })
);

app.get("/", (req, res) =>
  res.json({ success: true, message: "ASTUMSJ Bootcamp Management API" })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found." })
);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    // Must run before the server starts accepting traffic: repairs the
    // stale unique index on users.university that causes the false
    // "A record with this university already exists." error.
    await fixUserIndexes();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startNotificationScheduler();
      seedUniversities();
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });