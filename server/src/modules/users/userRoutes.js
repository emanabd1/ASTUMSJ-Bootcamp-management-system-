const express = require("express");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("./userController");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

// All user-management routes require:
// 1. Authentication
// 2. Admin role
router.use(protect);
router.use(authorize("admin"));

// GET /api/users
router.get("/", getUsers);

// GET /api/users/:id
router.get("/:id", getUser);

// POST /api/users
router.post("/", createUser);

// PUT /api/users/:id
router.put("/:id", updateUser);

// DELETE /api/users/:id
router.delete("/:id", deleteUser);

module.exports = router;