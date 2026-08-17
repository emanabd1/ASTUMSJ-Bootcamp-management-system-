const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    isRegistrationOpenManually: {
      type: Boolean,
      default: true
    },
    registrationOpenTime: {
      type: Date,
      default: null
    },
    registrationCloseTime: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Settings", settingsSchema);