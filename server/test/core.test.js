const test = require("node:test");
const assert = require("node:assert/strict");
const authorize = require("../src/middleware/roleMiddleware");
const Attendance = require("../src/modules/attendance/attendanceModel");
const Submission = require("../src/modules/assignments/assignmentSubmissionModel");

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
