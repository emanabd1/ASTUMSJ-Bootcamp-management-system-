const express = require("express");
const Achievement = require("./achievementModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();
router.use(protect, authorize("admin"));
router.get("/", async (req, res, next) => {
  try { res.json({ success: true, achievements: await Achievement.find().sort({ createdAt: -1 }) }); } catch (error) { next(error); }
});
router.post("/", async (req, res, next) => {
  try {
    const { title, description, icon = "*", metric, threshold } = req.body;
    if (!title?.trim() || !description?.trim() || !["submissions", "completed_topics_ratio", "coding_activities", "attendance_percentage"].includes(metric) || !Number.isFinite(Number(threshold))) return res.status(400).json({ success: false, message: "Title, description, metric, and threshold are required." });
    const achievement = await Achievement.create({ title, description, icon, metric, threshold: Number(threshold), createdBy: req.user._id });
    res.status(201).json({ success: true, achievement });
  } catch (error) { next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try { const achievement = await Achievement.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }); if (!achievement) return res.status(404).json({ success: false, message: "Achievement not found." }); res.json({ success: true, achievement }); } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try { const achievement = await Achievement.findByIdAndDelete(req.params.id); if (!achievement) return res.status(404).json({ success: false, message: "Achievement not found." }); res.json({ success: true, message: "Achievement deleted." }); } catch (error) { next(error); }
});
module.exports = router;
