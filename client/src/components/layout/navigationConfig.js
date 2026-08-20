export const navigationConfig = {
  admin: [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "User Management", path: "/admin/users" },
    { name: "Batches", path: "/admin/batches" },
    { name: "Assignments", path: "/admin/assignments" },
    { name: "Coding Challenges", path: "/admin/coding" },
    { name: "Announcements", path: "/admin/announcements" },
  ],
  mentor: [
    { name: "Dashboard", path: "/mentor/dashboard" },
    { name: "My Students", path: "/mentor/dashboard" },
    { name: "Attendance", path: "/mentor/attendance" },
    { name: "Progress Tracker", path: "/mentor/progress" },
    { name: "Assignments & Grading", path: "/mentor/assignments" },
    { name: "Coding Progress", path: "/mentor/coding" },
    { name: "Announcements", path: "/mentor/announcements" },
  ],
  student: [
    { name: "Dashboard", path: "/student/dashboard" },
    { name: "My Attendance", path: "/student/attendance" },
    { name: "My Progress", path: "/student/progress" },
    { name: "Assignments", path: "/student/assignments" },
    { name: "Resources", path: "/student/resources" },
    { name: "Announcements", path: "/student/announcements" },
  ]
};