const sameId = (left, right) => String(left?._id || left) === String(right?._id || right);

const isAssignedToBatch = (user, batch) => user.role === "admin" || (user.role === "mentor" && (batch.mentors || []).some((mentor) => sameId(mentor, user._id))) || (user.role === "student" && (batch.students || []).some((student) => sameId(student, user._id)));
const canStudentView = (user, studentId) => user.role === "admin" || (user.role === "student" && sameId(user, studentId));
const canMentorViewStudent = (user, student) => user.role === "admin" || (user.role === "mentor" && student.role === "student" && sameId(student.mentor, user._id));
const canMentorViewAssignment = (user, assignment, batchIds, studentIds) => user.role === "admin" || (user.role === "mentor" && batchIds.some((id) => sameId(id, assignment.batch)) && (sameId(assignment.creator, user._id) || (assignment.targetStudents || []).some((id) => studentIds.some((studentId) => sameId(id, studentId))) || !(assignment.targetStudents || []).length));
const canGradeSubmission = (user, submission, assignment) => user.role === "admin" || (user.role === "mentor" && sameId(submission.student?.mentor || submission.studentMentor, user._id) && sameId(assignment.creator, user._id));
const canViewAnnouncement = (user, announcement) => announcement.targetAudience === "all" || (user.role === "admin") || (user.role === "student" && announcement.targetAudience === "students") || (user.role === "mentor" && announcement.targetAudience === "mentors");

module.exports = { sameId, isAssignedToBatch, canStudentView, canMentorViewStudent, canMentorViewAssignment, canGradeSubmission, canViewAnnouncement };
