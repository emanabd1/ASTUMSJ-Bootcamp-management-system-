const express = require("express");
const router = express.Router();
const Settings = require("../../modules/settings/settingsModel");
const User = require("../users/userModel");
const protect = require("../../middleware/authMiddleware");

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


router.get("/profile", protect, async (req,res,next)=>{try{const user=await User.findById(req.user._id).select("fullName email role department yearOfStudy gender githubUrl leetcodeUrl codeforcesUrl mentor batch").populate("mentor","fullName email").populate("batch","name");res.json({success:true,user})}catch(e){next(e)}});
router.patch("/profile", protect, async (req,res,next)=>{try{const user=await User.findById(req.user._id);const allowed=["fullName","department","yearOfStudy","gender","githubUrl","leetcodeUrl","codeforcesUrl"];allowed.forEach(k=>{if(req.body[k]!==undefined)user[k]=req.body[k]});await user.save();const safe=await User.findById(user._id).select("fullName email role department yearOfStudy gender githubUrl leetcodeUrl codeforcesUrl mentor batch");res.json({success:true,message:"Profile updated successfully.",user:safe})}catch(e){next(e)}});
module.exports = router;