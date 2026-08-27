const mongoose = require("mongoose");

const adminCommitteeMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

adminCommitteeMessageSchema.index({ createdAt: 1 });

module.exports = mongoose.model("AdminCommitteeMessage", adminCommitteeMessageSchema);
