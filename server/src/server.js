const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./modules/auth/authRoutes");
const userRoutes = require("./modules/users/userRoutes");
const settingsRoutes = require("./src/modules/settings/settingsRoutes");

const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Connect database
connectDB();

const app = express();

// =========================
// GLOBAL MIDDLEWARE
// =========================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*"
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// =========================
// HEALTH CHECK
// =========================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Bootcamp Management System API is running."
  });
});

// =========================
// ROUTES
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/settings", settingsRoutes);

// Future modules
// app.use("/api/batches", batchRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/progress", progressRoutes);
// app.use("/api/assignments", assignmentRoutes);
// app.use("/api/announcements", announcementRoutes);

// =========================
// 404
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// =========================
// ERROR HANDLER
// =========================

app.use(errorHandler);

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});