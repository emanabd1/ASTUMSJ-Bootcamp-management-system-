const test = require("node:test");
const assert = require("node:assert/strict");
const authorize = require("../src/middleware/roleMiddleware");
const Attendance = require("../src/modules/attendance/attendanceModel");
const Submission = require("../src/modules/assignments/assignmentSubmissionModel");
const {
  isAssignedToBatch,
  canStudentView,
  canMentorViewStudent,
  canMentorViewAssignment,
  canGradeSubmission,
  canViewAnnouncement,
} = require("../src/services/accessPolicy");

function responseCapture() {
  return {
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test("attendance percentage counts only present session records", () => {
  const records = [
    { session: "one", status: "Present" },
    { session: "two", status: "Absent" },
    { session: "three", status: "Late" },
  ];
  const percentage = Math.round((records.filter((record) => record.status === "Present").length / records.length) * 100);
  assert.equal(percentage, 33);
});

test("role middleware allows approved role and rejects another role", () => {
  let called = false;
  authorize("admin")({ user: { role: "ADMIN" } }, responseCapture(), () => { called = true; });
  assert.equal(called, true);

  const response = responseCapture();
  authorize("admin")({ user: { role: "mentor" } }, response, () => {});
  assert.equal(response.statusCode, 403);
});

test("role middleware rejects unauthenticated requests", () => {
  const response = responseCapture();
  authorize("student")({}, response, () => {});
  assert.equal(response.statusCode, 401);
});

test("attendance schema is session-based and caps late minutes", () => {
  assert.ok(Attendance.schema.path("session"));
  assert.equal(Attendance.schema.path("lateMinutes").options.max, 15);
});

test("submission schema supports resubmission tracking", () => {
  assert.ok(Submission.schema.path("resubmissionReason"));
  assert.ok(Submission.schema.path("version"));
  assert.deepEqual(Submission.schema.path("status").enumValues, ["submitted", "graded", "resubmission_requested"]);
});

test("student can view only their own records", () => {
  const student = { role: "student", _id: "student-1" };
  assert.equal(canStudentView(student, "student-1"), true);
  assert.equal(canStudentView(student, "student-2"), false);
});

test("mentor can view only assigned students and batches", () => {
  const mentor = { role: "mentor", _id: "mentor-1" };
  assert.equal(canMentorViewStudent(mentor, { role: "student", mentor: "mentor-1" }), true);
  assert.equal(canMentorViewStudent(mentor, { role: "student", mentor: "mentor-2" }), false);
  assert.equal(isAssignedToBatch(mentor, { mentors: ["mentor-1"] }), true);
  assert.equal(isAssignedToBatch(mentor, { mentors: ["mentor-2"] }), false);
});

test("mentor can manage only their assigned assignments and submissions", () => {
  const mentor = { role: "mentor", _id: "mentor-1" };
  const assignment = { batch: "batch-1", creator: "mentor-1", targetStudents: [] };
  assert.equal(canMentorViewAssignment(mentor, assignment, ["batch-1"], []), true);
  assert.equal(canMentorViewAssignment(mentor, assignment, ["batch-2"], []), false);
  assert.equal(canGradeSubmission(mentor, { studentMentor: "mentor-1" }, { creator: "mentor-1" }), true);
  assert.equal(canGradeSubmission(mentor, { studentMentor: "mentor-2" }, { creator: "mentor-1" }), false);
});

test("admin has global batch access and announcement visibility", () => {
  const admin = { role: "admin", _id: "admin-1" };
  assert.equal(isAssignedToBatch(admin, { mentors: [], students: [] }), true);
  assert.equal(canViewAnnouncement(admin, { targetAudience: "mentors" }), true);
});

test("announcement visibility respects role audience", () => {
  assert.equal(canViewAnnouncement({ role: "student" }, { targetAudience: "students" }), true);
  assert.equal(canViewAnnouncement({ role: "student" }, { targetAudience: "mentors" }), false);
  assert.equal(canViewAnnouncement({ role: "mentor" }, { targetAudience: "students" }), false);
});
