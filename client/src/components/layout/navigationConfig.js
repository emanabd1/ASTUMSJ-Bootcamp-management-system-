export const navigationConfig = {
  admin: [
    { name: "Dashboard", path: "/admin/dashboard", icon: "LayoutDashboard" },
    { name: "User Management", path: "/admin/users", icon: "Users" },
    { name: "Batches", path: "/admin/batches", icon: "Layers" },
    { name: "Announcements", path: "/admin/announcements", icon: "Bell" },
  ],
  mentor: [
    { name: "Dashboard", path: "/mentor/dashboard", icon: "LayoutDashboard" },
    { name: "Attendance", path: "/mentor/attendance", icon: "CalendarCheck" },
    { name: "Progress Tracker", path: "/mentor/progress", icon: "TrendingUp" },
    { name: "Assignments & Grading", path: "/mentor/assignments", icon: "FileText" },
    { name: "Announcements", path: "/mentor/announcements", icon: "Bell" },
  ],
  student: [
    { name: "Dashboard", path: "/student/dashboard", icon: "LayoutDashboard" },
    { name: "My Attendance", path: "/student/attendance", icon: "CalendarCheck" },
    { name: "My Progress", path: "/student/progress", icon: "TrendingUp" },
    { name: "Assignments", path: "/student/assignments", icon: "FileText" },
    { name: "Announcements", path: "/student/announcements", icon: "Bell" },
  ]
};