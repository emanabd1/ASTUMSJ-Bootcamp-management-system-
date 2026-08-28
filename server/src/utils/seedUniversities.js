const University = require("../modules/universities/universityModel");

// Runs once at boot. If the University collection is empty (fresh DB), we
// pre-populate it with Adama Science and Technology University — the
// bootcamp's home institution, as requested — plus a handful of other
// well-known Ethiopian universities so admins have a real starting point
// instead of an empty screen. Admins can rename, retire or add more from
// the Universities page at any time; this never overwrites existing data.
const STARTER_UNIVERSITIES = [
  { name: "Adama Science and Technology University", shortName: "ASTU", city: "Adama", color: "#c89b7b" },
  { name: "Addis Ababa University", shortName: "AAU", city: "Addis Ababa", color: "#7ba8c8" },
  { name: "Jimma University", shortName: "JU", city: "Jimma", color: "#8fc87b" },
  { name: "Bahir Dar University", shortName: "BDU", city: "Bahir Dar", color: "#c87ba0" },
  { name: "Hawassa University", shortName: "HU", city: "Hawassa", color: "#c8a37b" },
  { name: "Mekelle University", shortName: "MU", city: "Mekelle", color: "#a87bc8" },
];

const seedUniversities = async () => {
  try {
    const existing = await University.estimatedDocumentCount();
    if (existing > 0) return;

    await University.insertMany(
      STARTER_UNIVERSITIES.map((u) => ({ ...u, status: "active", idLabel: "Student ID" }))
    );

    console.log(`Seeded ${STARTER_UNIVERSITIES.length} starter universities (ASTU included).`);
  } catch (error) {
    // Non-fatal: if this races with another instance and hits the unique
    // index, that's fine — the data is already there.
    if (error.code !== 11000) {
      console.error("University seed error:", error.message);
    }
  }
};

module.exports = seedUniversities;
