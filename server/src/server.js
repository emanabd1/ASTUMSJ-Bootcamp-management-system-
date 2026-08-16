const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import Routes (relative to server/src/server.js)
const authRoutes = require("./modules/auth/authRoutes");
const userRoutes = require("./modules/users/userRoutes");
const batchRoutes = require("./modules/batches/batchRoutes");

// Commented out until you create these route files later:
// const attendanceRoutes = require("./modules/attendance/attendanceRoutes");
// const progressRoutes = require("./modules/progress/progressRoutes");
// const assignmentRoutes = require("./modules/assignments/assignmentRoutes");
// const submissionRoutes = require("./modules/submissions/submissionRoutes");
// const announcementRoutes = require("./modules/announcements/announcementsRoutes");

const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/bootcamp_db";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully."))
  .catch((err) => console.error("Database connection error:", err));

// API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/batches", batchRoutes);

// Uncomment these as you build each corresponding module:
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/progress", progressRoutes);
// app.use("/api/assignments", assignmentRoutes);
// app.use("/api/submissions", submissionRoutes);
// app.use("/api/announcements", announcementRoutes);

// Root Health Check
app.get("/", (req, res) => {
  res.status(200).json({ status: "API is running successfully." });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});