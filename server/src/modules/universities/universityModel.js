const mongoose = require("mongoose");

// A "University" is an admin-managed category that students select on
// registration, alongside their in-university ID number (universityIdNumber
// on the User model). Keeping this as its own collection lets admins add,
// rename, retire or re-color universities without touching user records.
const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    shortName: { type: String, trim: true, default: "" }, // e.g. "ASTU"
    city: { type: String, trim: true, default: "" },
    idLabel: { type: String, trim: true, default: "Student ID" }, // e.g. "Matric No."
    color: { type: String, trim: true, default: "#c89b7b" }, // hex accent used for badges/avatars
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

universitySchema.index({ status: 1, name: 1 });

module.exports = mongoose.model("University", universitySchema);
