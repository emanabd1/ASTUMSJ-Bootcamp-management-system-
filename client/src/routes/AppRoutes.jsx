import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import OAuthSuccessPage from "../pages/OAuthSuccessPage";

import SettingsPage from "../pages/SettingsPage";
import GeneralSettingsPage from "../pages/GeneralSettingsPage";
import NotificationsPage from "../pages/NotificationsPage";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import AdminDashboard from "../pages/AdminDashboard";
import AdminUserManagement from "../pages/AdminUserManagement";
import BatchesPage from "../pages/BatchesPage";
import AssignmentsPage from "../pages/AssignmentsPage";
import CodingPage from "../pages/CodingPage";
import AnnouncementsPage from "../pages/AnnouncementsPage";
import AdminAttendance from "../AdminAttendance";

import MentorDashboard from "../pages/MentorDashboard";
import MentorAnnouncements from "../pages/MentorAnnouncements";
import MentorAssignments from "../pages/MentorAssignments";
import MentorAttendance from "../pages/MentorAttendance";
import MentorProgress from "../pages/MentorProgress";

import StudentDashboard from "../pages/StudentDashboard";
import StudentAttendancePage from "../pages/StudentAttendancePage";
import StudentProgressPage from "../pages/StudentProgressPage";
import StudentProfilePage from "../pages/StudentProfilePage";
import DailyDisciplinePage from "../pages/DailyDisciplinePage";
import ResourcesPage from "../pages/ResourcesPage";
import SessionsPage from "../pages/SessionsPage";
import SessionDetailPage from "../pages/SessionDetailPage";
import InsightsPage from "../pages/InsightsPage";
import AlumniPage from "../pages/AlumniPage";
import AdminCommunityPage from "../pages/AdminCommunityPage";
import AdminCommitteePage from "../pages/AdminCommitteePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register" element={<SignupPage />} />
      <Route path="/alumni" element={<AlumniPage />} />

      <Route
        path="/oauth-success"
        element={<OAuthSuccessPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      <Route element={<DashboardLayout />}>
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin", "mentor", "student"]}
            />
          }
        >
          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/settings/general"
            element={<GeneralSettingsPage />}
          />

          <Route
            path="/notifications"
            element={<NotificationsPage />}
          />

          <Route
            path="/sessions"
            element={<SessionsPage />}
          />

          <Route
            path="/sessions/:id"
            element={<SessionDetailPage />}
          />

          <Route
            path="/assignments/:id"
            element={<AssignmentsPage />}
          />

          <Route
            path="/insights"
            element={<InsightsPage />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["admin"]} />
          }
        >
          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/users"
            element={<AdminUserManagement />}
          />

          <Route
            path="/admin/batches"
            element={<BatchesPage />}
          />

          <Route
            path="/admin/attendance"
            element={<AdminAttendance />}
          />

          <Route
            path="/admin/announcements"
            element={<AnnouncementsPage />}
          />

          <Route
            path="/admin/assignments"
            element={<AssignmentsPage />}
          />

          <Route
            path="/admin/coding"
            element={<CodingPage />}
          />

          <Route
            path="/admin/community"
            element={<AdminCommunityPage />}
          />

          <Route
            path="/admin/committee"
            element={<AdminCommitteePage />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["mentor"]} />
          }
        >
          <Route
            path="/mentor/dashboard"
            element={<MentorDashboard />}
          />

          <Route
            path="/mentor/attendance"
            element={<MentorAttendance />}
          />

          <Route
            path="/mentor/progress"
            element={<MentorProgress />}
          />

          <Route
            path="/mentor/assignments"
            element={<MentorAssignments />}
          />

          <Route
            path="/mentor/coding"
            element={<CodingPage />}
          />

          <Route
            path="/mentor/announcements"
            element={<MentorAnnouncements />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={["student"]} />
          }
        >
          <Route
            path="/student/dashboard"
            element={<StudentDashboard />}
          />

          <Route
            path="/student/attendance"
            element={<StudentAttendancePage />}
          />

          <Route
            path="/student/profile"
            element={<StudentProfilePage />}
          />

          <Route
            path="/student/resources"
            element={<ResourcesPage />}
          />

          <Route
            path="/student/assignments"
            element={<AssignmentsPage />}
          />

          <Route
            path="/student/coding"
            element={<CodingPage />}
          />

          <Route
            path="/student/announcements"
            element={<AnnouncementsPage />}
          />

          <Route
            path="/student/discipline"
            element={<DailyDisciplinePage />}
          />
        </Route>

         <Route
            path="/student/progress"
            element={<StudentProgressPage />}
          />
        </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}