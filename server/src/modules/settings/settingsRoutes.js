const express = require("express");
const router = express.Router();
const Settings = require("../../modules/settings/settingsModel");

// Route to check if registration is currently open based on manual toggle or time window
router.get("/registration-status", async (req, res, next) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      // Default to open if no global settings document has been created yet
      return res.status(200).json({ success: true, isOpen: true });
    }

    const now = new Date();
    let isOpen = settings.isRegistrationOpenManually;

    // Check time-bound window if configured
    if (settings.registrationOpenTime && now < new Date(settings.registrationOpenTime)) {
      isOpen = false;
    }
    if (settings.registrationCloseTime && now > new Date(settings.registrationCloseTime)) {
      isOpen = false;
    }

    res.status(200).json({ success: true, isOpen });
  } catch (error) {
    next(error);
  }
});

module.exports = router;