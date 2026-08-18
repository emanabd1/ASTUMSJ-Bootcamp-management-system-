import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import ArcGauge from "../components/dashboard/ArcGauge";
import BarCompare from "../components/dashboard/BarCompare";
import PipelineFunnel from "../components/dashboard/PipelineFunnel";
import StatusDonut from "../components/dashboard/StatusDonut";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/users/stats")
      .then((r) => setStats(r.data.stats))
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load dashboard.")
      );
  }, []);

  if (error)
    return (
      <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">
        {error}
      </p>
    );
  if (!stats)
    return <p className="text-[#a39081]">Loading dashboard...</p>;

  const gradingCompletion = stats.submissions
    ? Math.round((stats.graded / stats.submissions) * 100)
    : 0;

  const activeAccounts = stats.students + stats.mentors + stats.admins;
  const totalAccounts = activeAccounts + stats.pending + stats.suspended;
  const goodStanding = totalAccounts
    ? Math.round((activeAccounts / totalAccounts) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#f5efe6]">
          Admin Overview
        </h1>
        <p className="mt-1 text-xs text-[#a39081]">
          Live bootcamp health, pulled straight from MongoDB.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 sm:grid-cols-3">
        <ArcGauge
          value={stats.attendancePercentage}
          label="Attendance"
          sublabel="all records"
          color="#c89b7b"
        />
        <ArcGauge
          value={gradingCompletion}
          label="Grading Completion"
          sublabel={`${stats.graded}/${stats.submissions} graded`}
          color="#7fa693"
        />
        <ArcGauge
          value={goodStanding}
          label="Accounts in Good Standing"
          sublabel={`${activeAccounts}/${totalAccounts} active`}
          color="#d9ad63"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Cohort Composition
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Active, approved accounts by role.
          </p>
          <BarCompare
            items={[
              { label: "Students", value: stats.students, color: "#c89b7b" },
              { label: "Mentors", value: stats.mentors, color: "#7fa693" },
              { label: "Admins", value: stats.admins, color: "#d9ad63" },
              { label: "Batches", value: stats.batches, color: "#8b6ba8" },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Assignment Pipeline
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Where submissions currently sit.
          </p>
          <PipelineFunnel
            stages={[
              { label: "Assignments", value: stats.assignments, color: "#c89b7b" },
              { label: "Submitted", value: stats.submissions, color: "#d9ad63" },
              { label: "Graded", value: stats.graded, color: "#7fa693" },
              { label: "Awaiting", value: stats.pendingGrading, color: "#c17c74" },
            ]}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Account Standing
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Every account, by current status.
          </p>
          <StatusDonut
            segments={[
              { label: "Active", value: activeAccounts, color: "#7fa693" },
              { label: "Pending", value: stats.pending, color: "#d9ad63" },
              { label: "Suspended", value: stats.suspended, color: "#c17c74" },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
            Recent Activity
          </h2>
          <p className="mb-5 text-xs text-[#a39081]">
            Latest joins, assignments, and submissions.
          </p>
          <ActivityTimeline items={stats.recentActivity} />
        </section>
      </div>
    </div>
  );
}