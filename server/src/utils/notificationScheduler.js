const Assignment = require("../modules/assignments/assignmentModel");
const Notification = require("../modules/notifications/notificationModel");

const notifyUpcomingDeadlines = async () => {
  const now = new Date();
  const in48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const assignments = await Assignment.find({ status: "active", deadline: { $gt: now, $lte: in48Hours } }).select("_id title deadline targetStudents");
  for (const assignment of assignments) {
    if (!assignment.targetStudents.length) continue;
    await Promise.all(assignment.targetStudents.map((studentId) => Notification.updateOne(
      { user: studentId, type: "deadline", "meta.assignmentId": String(assignment._id) },
      { $setOnInsert: { user: studentId, title: "Assignment deadline approaching", message: `${assignment.title} is due on ${new Date(assignment.deadline).toLocaleString()}.`, type: "deadline", link: "/student/assignments", meta: { assignmentId: String(assignment._id) } } },
      { upsert: true }
    )));
  }
};

const startNotificationScheduler = () => {
  const run = () => notifyUpcomingDeadlines().catch((error) => console.error("Deadline notification job failed:", error.message));
  run();
  return setInterval(run, 60 * 60 * 1000);
};

module.exports = { notifyUpcomingDeadlines, startNotificationScheduler };
