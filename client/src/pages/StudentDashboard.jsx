import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/students/dashboard")
      .then((r) => setData(r.data.dashboard))
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load dashboard.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-xs text-[#a39081]">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-xs text-rose-300">
        {error}
      </p>
    );
  }

  const d = data;
  const mentor = d.student.mentor;

  return (
    <div className="space-y-7 text-[#f5efe6]">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide">
          My Performance Overview
        </h1>
        <p className="text-xs text-[#a39081] mt-1">
          Your dashboard is loaded from your account, attendance, and progress records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#a39081]">Overall Attendance</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">
            {d.attendancePercentage}%
          </p>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#a39081]">Completed Topics</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">
            {d.completedTopics} / {d.totalTopics}
          </p>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-xl">
          <p className="text-xs text-[#a39081]">Assigned Mentor</p>
          <p className="text-xl font-bold text-[#c89b7b] mt-2 truncate">
            {mentor?.fullName || "Not assigned"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-xl">
          <h2 className="font-bold text-lg text-[#f5efe6]">My Information</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
              <span className="text-xs text-[#a39081] block">Name</span>
              <b className="text-sm truncate block mt-0.5">{d.student.fullName}</b>
            </div>
            <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
              <span className="text-xs text-[#a39081] block">Email</span>
              <b className="text-xs truncate block mt-1">{d.student.email}</b>
            </div>
            <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
              <span className="text-xs text-[#a39081] block">Department</span>
              <b className="text-sm truncate block mt-0.5">{d.student.department || "—"}</b>
            </div>
            <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
              <span className="text-xs text-[#a39081] block">Year</span>
              <b className="text-sm truncate block mt-0.5">{d.student.yearOfStudy || "—"}</b>
            </div>
          </div>
        </section>

        <section className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-xl">
          <h2 className="font-bold text-lg text-[#f5efe6]">Progress Breakdown</h2>
          <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {d.progress.length ? (
              d.progress.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between rounded-xl border border-[#4a3b32] bg-[#16110e] p-3 text-sm"
                >
                  <span className="font-medium">{p.topic}</span>
                  <span className="text-xs font-bold text-[#c89b7b] bg-[#1e1713] px-2.5 py-1 rounded-lg border border-[#4a3b32]">
                    {p.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#a39081]">No progress records yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}