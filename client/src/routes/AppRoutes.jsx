import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import AdminDashboard from "../pages/AdminDashboard";
import AdminUserManagement from "../pages/AdminUserManagement";
import MentorDashboard from "../pages/MentorDashboard";
import StudentDashboard from "../pages/StudentDashboard";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}

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


      {/* ================= PROTECTED ROUTES ================= */}

      <Route element={<DashboardLayout />}>

        {/* ---------- ADMIN ---------- */}

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


        {/* ---------- MENTOR ---------- */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["mentor"]} />
          }
        >
          <Route
            path="/mentor/dashboard"
            element={<MentorDashboard />}
          />
        </Route>


        {/* ---------- STUDENT ---------- */}

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


      {/* ================= DEFAULT ================= */}

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