const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  detail: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, enum: ["alumni", "hall_of_fame"], required: true },
  cohort: { type: String, trim: true, default: "" },
  achievement: { type: String, trim: true, default: "" },
  public: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

communitySchema.index({ category: 1, public: 1, createdAt: -1 });
module.exports = mongoose.model("CommunityHighlight", communitySchema);
