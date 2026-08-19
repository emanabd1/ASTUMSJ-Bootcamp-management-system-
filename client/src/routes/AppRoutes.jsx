import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import AdminDashboard from "../pages/AdminDashboard";
import AdminUserManagement from "../pages/AdminUserManagement";
import MentorDashboard from "../pages/MentorDashboard";
import AssignedStudents from "../pages/AssignedStudents";
import MentorAttendance from "../pages/MentorAttendance";
import MentorProgress from "../pages/MentorProgress";
import MentorAssignments from "../pages/MentorAssignments";
import MentorAnnouncements from "../pages/MentorAnnouncements";
import StudentDashboard from "../pages/StudentDashboard";

export default function AppRoutes() {
  return (
    <Routes>


      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      <Route
        path="/register"
        element={<SignupPage />}
      />



      <Route element={<DashboardLayout />}>


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
            path="/mentor/students"
            element={<AssignedStudents />}
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
        </Route>

      </Route>



      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}