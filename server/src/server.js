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
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((v) => v.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/students", studentRoutes);

app.get("/api/health", (req, res) => res.json({ success: true, message: "Bootcamp Management API is running." }));
app.get("/", (req, res) => res.json({ success: true, message: "ASTUMSJ Bootcamp Management API" }));
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((error) => { console.error("Database connection error:", error); process.exit(1); });
