import React from "react";
import { useAuth } from "../hooks/useAuth";

export default function StudentProfilePage() {
  const { user } = useAuth();

  const initial = (user?.fullName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e1713]">My Profile</h1>
        <p className="mt-1 text-sm text-[#7a6a5e]">
          View your account information.
        </p>
      </div>

      <div className="max-w-2xl overflow-hidden rounded-2xl border border-[#e5ddd5] bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-[#e5ddd5] p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c89b7b] text-2xl font-bold text-[#1e1713]">
            {initial}
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1e1713]">
              {user?.fullName || "User"}
            </h2>

            <span className="mt-1 inline-block rounded-full bg-[#c89b7b]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#8a6045]">
              {user?.role || "Student"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#e5ddd5]">
          <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[#7a6a5e]">
              Full Name
            </span>
            <span className="text-sm font-semibold text-[#1e1713]">
              {user?.fullName || "Not available"}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[#7a6a5e]">
              Email
            </span>
            <span className="text-sm font-semibold text-[#1e1713]">
              {user?.email || "Not available"}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[#7a6a5e]">
              Role
            </span>
            <span className="text-sm font-semibold capitalize text-[#1e1713]">
              {user?.role || "Student"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}