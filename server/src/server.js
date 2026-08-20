const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./modules/auth/authRoutes");
const userRoutes = require("./modules/users/userRoutes");
const mentorRoutes = require("./modules/mentors/mentorRoutes");
const batchRoutes = require("./modules/batches/batchRoutes");
const settingsRoutes = require("./modules/settings/settingsRoutes");
const studentRoutes = require("./modules/students/studentRoutes");
const assignmentRoutes = require("./modules/assignments/assignmentRoutes");
const notificationRoutes = require("./modules/notifications/notificationRoutes");
const codingRoutes = require("./modules/coding/codingRoutes");
const announcementRoutes = require("./modules/announcements/announcementRoutes");
const attendanceRoutes = require("./modules/attendance/attendanceRoutes");
const progressRoutes = require("./modules/progress/progressRoutes");
const submissionRoutes = require("./modules/submissions/submissionRoutes");
const errorHandler = require("./middleware/errorHandler");
const { startNotificationScheduler } = require("./utils/notificationScheduler");

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
app.use("/api/settings", settingsRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/submissions", submissionRoutes);

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
  .then(() =>
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startNotificationScheduler();
    })
  )
  .catch((error) => {
    console.error("Database connection error:", error);
    process.exit(1);
  });