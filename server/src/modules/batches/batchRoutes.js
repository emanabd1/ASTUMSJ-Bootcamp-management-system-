const express = require("express");
const router = express.Router();

// Placeholder Batch Routes
router.get("/", (req, res) => {
  res.status(200).json({ message: "Batches endpoint working" });
});

module.exports = router;