import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import ArcGauge from "../components/dashboard/ArcGauge";
import BarCompare from "../components/dashboard/BarCompare";
import AttendanceStrip from "../components/dashboard/AttendanceStrip";
import ProgressChecklist from "../components/dashboard/ProgressChecklist";
import DeadlineList from "../components/dashboard/DeadlineList";
import AnnouncementFeed from "../components/dashboard/AnnouncementFeed";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [coding, setCoding] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/students/dashboard"),
      axiosInstance.get("/coding/stats"),
    ])
      .then(([r, c]) => {
        setData(r.data.dashboard);
        setCoding(c.data.stats?.[r.data.dashboard.student._id] || {});
      })
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load dashboard.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[#a39081]">Loading your dashboard...</p>;
  if (error)
    return (
      <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">
        {error}
      </p>
    );

  const d = data;
  const mentor = d.student.mentor;
  const progressPct = d.totalTopics
    ? Math.round((d.completedTopics / d.totalTopics) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#f5efe6]">
          My Performance Overview
        </h1>
        
      </div>

      <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 sm:grid-cols-3">
        <ArcGauge
          value={d.attendancePercentage}
          label="Attendance"
          sublabel="all sessions"
          color="#c89b7b"
        />
        <ArcGauge
          value={progressPct}
          label="Topics Completed"
          sublabel={`${d.completedTopics}/${d.totalTopics} topics`}
          color="#7fa693"
        />
        <ArcGauge
          value={d.averageGrade}
          label="Average Grade"
          sublabel={`${d.assignments.length} assignments`}
          color="#d9ad63"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <p className="text-xs uppercase tracking-wide text-[#a39081]">Mentor</p>
          <p className="mt-1.5 font-serif text-lg font-bold text-[#f5efe6]">
            {mentor?.fullName || "Not assigned"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <p className="text-xs uppercase tracking-wide text-[#a39081]">Batch</p>
          <p className="mt-1.5 font-serif text-lg font-bold text-[#f5efe6]">
            {d.student.batch?.name || "Not enrolled"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Coding Streaks
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Consecutive active days per platform.
          </p>
          <BarCompare
            items={[
              { label: "LeetCode", value: coding.leetcode?.streak || 0, color: "#c89b7b" },
              { label: "Codeforces", value: coding.codeforces?.streak || 0, color: "#7fa693" },
              { label: "GitHub", value: coding.github?.streak || 0, color: "#d9ad63" },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Attendance History
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Your last {Math.min(30, d.attendance.length)} recorded sessions.
          </p>
          <AttendanceStrip records={d.attendance} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Upcoming Deadlines
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Assignments you still need to submit.
          </p>
          <DeadlineList items={d.upcomingDeadlines} />
        </section>

        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Recent Announcements
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            From your mentors and admins.
          </p>
          <AnnouncementFeed items={d.announcements} />
        </section>
      </div>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
          Progress Tracker
        </h2>
        <p className="mb-5 text-xs text-[#a39081]">
          Topic-by-topic status from your mentor.
        </p>
        <ProgressChecklist items={d.progress} />
      </section>
    </div>
  );
}