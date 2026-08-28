import React from "react";
import { useAuth } from "../hooks/useAuth";

const ROW = "flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between";
const LABEL = "text-sm font-medium text-[var(--muted)]";
const VALUE = "text-sm font-semibold text-[var(--heading)]";

export default function StudentProfilePage() {
  const { user } = useAuth();

  const initial = (user?.fullName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--heading)]">My Profile</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          View your account information.
        </p>
      </div>

      <div className="max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex items-center gap-4 border-b border-[var(--border)] p-6">
          <div className="btn-cta flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
            {initial}
          </div>

          <div>
            <h2 className="text-xl font-bold text-[var(--heading)]">
              {user?.fullName || "User"}
            </h2>

            <span className="mt-1 inline-block rounded-full bg-[var(--accent-solid)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent-solid)]">
              {user?.role || "Student"}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          <div className={ROW}>
            <span className={LABEL}>Full Name</span>
            <span className={VALUE}>{user?.fullName || "Not available"}</span>
          </div>

          <div className={ROW}>
            <span className={LABEL}>Email</span>
            <span className={VALUE}>{user?.email || "Not available"}</span>
          </div>

          <div className={ROW}>
            <span className={LABEL}>Role</span>
            <span className={`${VALUE} capitalize`}>{user?.role || "Student"}</span>
          </div>

          <div className={ROW}>
            <span className={LABEL}>University</span>
            <span className={VALUE}>{user?.university?.name || "Not set"}</span>
          </div>

          <div className={ROW}>
            <span className={LABEL}>{user?.university?.idLabel || "University ID"}</span>
            <span className={VALUE}>{user?.universityIdNumber || "Not set"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
