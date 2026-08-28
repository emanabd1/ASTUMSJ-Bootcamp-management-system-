const User = require("../modules/users/userModel");

/**
 * At some point the `university` field on the User model was (directly or
 * indirectly, e.g. through an old `unique: true` on the schema) indexed as
 * UNIQUE in MongoDB. That index is still sitting on the real `users`
 * collection even though the current userModel.js only declares a normal,
 * non-unique index (`userSchema.index({ university: 1 })`).
 *
 * Mongoose's `autoIndex` only ADDS indexes that are missing — it never
 * drops indexes that no longer match the schema. So every time an admin
 * assigns a second student to the same university (or a student registers
 * for a university someone else already picked), MongoDB rejects the
 * write with a duplicate key error (E11000) on `university_1`, which the
 * generic error handler surfaces as:
 *   "A record with this university already exists."
 *
 * This also silently breaks:
 *   - Public signup for every student after the first one per university
 *   - Editing a student's university from Admin > User Management
 *   - The "Students Linked" / "Top University" counts on the
 *     Universities page, since those saves never actually go through
 *
 * Fix: on every server start, find any index on the `users` collection
 * that is keyed on `university` and is unique, drop it, then let
 * Mongoose recreate the correct (non-unique) index.
 */
async function fixUserIndexes() {
  try {
    const collection = User.collection;
    const existingIndexes = await collection.indexes();

    for (const index of existingIndexes) {
      const keys = Object.keys(index.key || {});
      const isUniversityIndex =
        keys.length === 1 && keys[0] === "university";

      if (isUniversityIndex && index.unique) {
        console.log(
          `Removing stale unique index "${index.name}" on users.university ` +
            "(multiple students are allowed to share a university)."
        );
        await collection.dropIndex(index.name);
      }
    }

    // Recreate whatever indexes the current schema actually declares
    // (this is a no-op for indexes that already match).
    await User.syncIndexes();
  } catch (error) {
    console.error("Could not verify/repair user indexes:", error.message);
  }
}

module.exports = fixUserIndexes;