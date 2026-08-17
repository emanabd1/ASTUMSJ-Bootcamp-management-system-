import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import SettingsPage from "../pages/SettingsPage";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUserManagement from "../pages/AdminUserManagement";
import MentorDashboard from "../pages/MentorDashboard";
import StudentDashboard from "../pages/StudentDashboard";
import AssignmentsPage from "../pages/AssignmentsPage";
import CodingPage from "../pages/CodingPage";
import NotificationsPage from "../pages/NotificationsPage";
import BatchesPage from "../pages/BatchesPage";
import AnnouncementsPage from "../pages/AnnouncementsPage";
export default function AppRoutes(){return <Routes><Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<SignupPage/>}/><Route path="/register" element={<SignupPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/><Route element={<DashboardLayout/>}><Route element={<ProtectedRoute allowedRoles={["admin","mentor","student"]}/>}><Route path="/settings" element={<SettingsPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/></Route><Route element={<ProtectedRoute allowedRoles={["admin"]}/>}><Route path="/admin/dashboard" element={<AdminDashboard/>}/><Route path="/admin/users" element={<AdminUserManagement/>}/><Route path="/admin/batches" element={<BatchesPage/>}/><Route path="/admin/announcements" element={<AnnouncementsPage/>}/><Route path="/admin/assignments" element={<AssignmentsPage/>}/><Route path="/admin/coding" element={<CodingPage/>}/></Route><Route element={<ProtectedRoute allowedRoles={["mentor"]}/>}><Route path="/mentor/dashboard" element={<MentorDashboard/>}/><Route path="/mentor/assignments" element={<AssignmentsPage/>}/><Route path="/mentor/coding" element={<CodingPage/>}/><Route path="/mentor/announcements" element={<AnnouncementsPage/>}/></Route><Route element={<ProtectedRoute allowedRoles={["student"]}/>}><Route path="/student/dashboard" element={<StudentDashboard/>}/><Route path="/student/assignments" element={<AssignmentsPage/>}/><Route path="/student/coding" element={<CodingPage/>}/><Route path="/student/announcements" element={<AnnouncementsPage/>}/></Route></Route><Route path="/" element={<Navigate to="/login" replace/>}/><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>}
