const User = require("../modules/users/userModel");

async function recipientsFor(author, targetAudience, batchId, targetRole = 'all') {
  const base = { status: 'approved', isActive: true };

  if (author.role === 'mentor') {
    const q = { ...base, role: 'student', mentor: author._id };
    if (targetAudience === 'batch') q.batch = batchId;
    return User.find(q).select('_id');
  }

  const roles = targetRole === 'students' ? ['student'] : targetRole === 'mentors' ? ['mentor'] : ['student', 'mentor'];
  const q = { ...base, role: { $in: roles } };
  if (targetAudience === 'batch') q.batch = batchId;
  return User.find(q).select('_id');
}

module.exports = { recipientsFor };