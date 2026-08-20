import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import ArcGauge from "../components/dashboard/ArcGauge";
import AttendanceStrip from "../components/dashboard/AttendanceStrip";

const STATUS_COLOR = {
  Present: "#7fa693",
  Late: "#d9ad63",
  Excused: "#8b6ba8",
  Absent: "#c17c74",
};

const FILTERS = ["All", "Present", "Absent", "Late", "Excused"];

export default function StudentAttendancePage() {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    axiosInstance
      .get("/students/dashboard")
      .then((r) => setRecords(r.data.dashboard.attendance || []))
      .catch((e) => setError(e.response?.data?.message || "Could not load attendance."));
  }, []);

  const stats = useMemo(() => {
    if (!records) return null;
    const total = records.length;
    const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    records.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    const presentLike = counts.Present + counts.Late;
    const percentage = total ? Math.round((presentLike / total) * 100) : 0;
    return { total, counts, percentage };
  }, [records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter === "All") return sorted;
    return sorted.filter((r) => r.status === filter);
  }, [records, filter]);

  if (error)
    return (
      <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">
        {error}
      </p>
    );
  if (!records) return <p className="text-[#a39081]">Loading your attendance...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#f5efe6]">My Attendance</h1>
        <p className="mt-1 text-xs text-[#a39081]">
          Every session your mentor has recorded, and your overall attendance rate.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 sm:grid-cols-[auto_1fr]">
        <ArcGauge
          value={stats.percentage}
          label="Attendance"
          sublabel={`${stats.total} sessions`}
          color="#c89b7b"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FILTERS.slice(1).map((status) => (
            <div
              key={status}
              className="rounded-xl border border-[#4a3b32] p-4 text-center"
            >
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_COLOR[status] }}
              >
                {stats.counts[status]}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                {status}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <h2 className="font-serif text-lg font-bold text-[#f5efe6]">Last 30 Sessions</h2>
        <p className="mb-5 text-xs text-[#a39081]">A quick visual snapshot, oldest to newest.</p>
        <AttendanceStrip records={records} />
      </section>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#f5efe6]">Full History</h2>
            <p className="text-xs text-[#a39081]">Sorted from most recent to oldest.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                  filter === status
                    ? "bg-[#c89b7b] text-[#1e1713]"
                    : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-[#a39081]">No sessions match this filter.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div
                key={r._id}
                className="flex items-center gap-4 rounded-xl border border-[#4a3b32] p-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[r.status] || "#5c4d40" }}
                />
                <span className="w-28 shrink-0 text-sm text-[#f5efe6]">
                  {new Date(r.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span
                  className="w-20 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: STATUS_COLOR[r.status] || "#a39081" }}
                >
                  {r.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-[#a39081]">
                  {r.note || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}