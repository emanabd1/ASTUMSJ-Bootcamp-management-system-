const express = require("express");
const CommunityHighlight = require("./communityModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const highlights = await CommunityHighlight.find({ public: true }).sort({ category: 1, createdAt: -1 }).select("name detail category cohort achievement");
    res.json({ success: true, highlights });
  } catch (error) { next(error); }
});

router.use(protect, authorize("admin"));
router.post("/", async (req, res, next) => {
  try {
    const { name, detail, category, cohort = "", achievement = "", public: isPublic = true } = req.body;
    if (!name?.trim() || !detail?.trim() || !["alumni", "hall_of_fame"].includes(category)) return res.status(400).json({ success: false, message: "Name, detail, and a valid category are required." });
    const highlight = await CommunityHighlight.create({ name, detail, category, cohort, achievement, public: isPublic, createdBy: req.user._id });
    res.status(201).json({ success: true, highlight });
  } catch (error) { next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const highlight = await CommunityHighlight.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!highlight) return res.status(404).json({ success: false, message: "Community highlight not found." });
    res.json({ success: true, highlight });
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const highlight = await CommunityHighlight.findByIdAndDelete(req.params.id);
    if (!highlight) return res.status(404).json({ success: false, message: "Community highlight not found." });
    res.json({ success: true, message: "Community highlight deleted." });
  } catch (error) { next(error); }
});

module.exports = router;
