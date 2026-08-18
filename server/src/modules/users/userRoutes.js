const express = require("express");

const {
  getUsers,
  getUser,
  getUserStats, 
  createUser,
  updateUser,
  deleteUser,
} = require("./userController");

const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getUsers);

if (getUserStats) {
  router.get("/stats", getUserStats);
}

router.get("/:id", getUser);

router.post("/", createUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

module.exports = router;