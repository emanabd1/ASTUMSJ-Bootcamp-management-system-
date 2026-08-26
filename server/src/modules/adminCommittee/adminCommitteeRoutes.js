const express = require("express");
const AdminCommitteeMessage = require("./adminCommitteeMessageModel");
const protect = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/roleMiddleware");

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/messages", async (req, res, next) => {
  try {
    const [messages, adminCount] = await Promise.all([
      AdminCommitteeMessage.find()
        .populate("sender", "fullName email")
        .sort({ createdAt: 1 }),
      require("../users/userModel").countDocuments({ role: "admin", status: "approved", isActive: true }),
    ]);
    res.json({ success: true, messages, adminCount });
  } catch (error) {
    next(error);
  }
});

router.post("/messages", async (req, res, next) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "Message cannot be empty." });
    if (message.length > 2000) return res.status(400).json({ success: false, message: "Message cannot exceed 2000 characters." });
    const created = await AdminCommitteeMessage.create({ sender: req.user._id, message });
    const populated = await created.populate("sender", "fullName email");
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
});

router.put("/messages/:id", async (req, res, next) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "Message cannot be empty." });
    if (message.length > 2000) return res.status(400).json({ success: false, message: "Message cannot exceed 2000 characters." });
    const updated = await AdminCommitteeMessage.findOneAndUpdate(
      { _id: req.params.id, sender: req.user._id },
      { $set: { message, edited: true } },
      { new: true, runValidators: true }
    ).populate("sender", "fullName email");
    if (!updated) return res.status(404).json({ success: false, message: "Message not found or not owned by you." });
    res.json({ success: true, message: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/messages/:id", async (req, res, next) => {
  try {
    const deleted = await AdminCommitteeMessage.findOneAndDelete({ _id: req.params.id, sender: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: "Message not found or not owned by you." });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
