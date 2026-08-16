import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#16110e] text-[#c89b7b]">
        Loading portal...
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toLowerCase();

  const normalizedRoles = allowedRoles?.map((role) =>
    role.toLowerCase()
  );

  // User does not have permission
  if (
    normalizedRoles &&
    !normalizedRoles.includes(userRole)
  ) {
    // Send them to THEIR dashboard
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (userRole === "mentor") {
      return <Navigate to="/mentor/dashboard" replace />;
    }

    if (userRole === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}