import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function MentorDashboard() {
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({ pendingGrading: [], atRiskStudents: [], assignments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await axios.get(
          "http://localhost:5000/api/mentors/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const rawData = response.data;
        setDashboardMetrics({
          pendingGrading: rawData?.dashboard?.pendingGrading || [],
          atRiskStudents: rawData?.dashboard?.atRiskStudents || [],
          assignments: rawData?.dashboard?.assignments || [],
        });

        const students =
          rawData?.dashboard?.assignedStudents ||
          rawData?.students ||
          rawData?.data ||
          rawData ||
          [];

        setAssignedStudents(Array.isArray(students) ? students : []);
      } catch (err) {
        console.error("Error fetching assigned students:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load assigned students."
        );

        setAssignedStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedStudents();
  }, []);

  const getStudentName = (student) => {
    if (student.name) {
      return student.name;
    }

    if (student.fullName) {
      return student.fullName;
    }

    if (student.firstName || student.lastName) {
      return `${student.firstName || ""} ${
        student.lastName || ""
      }`.trim();
    }

    if (student.student?.name) {
      return student.student.name;
    }

    if (student.student?.fullName) {
      return student.student.fullName;
    }

    return "Student";
  };

  const getProgress = (student) => {
    const value =
      student.progress ??
      student.progressPercentage ??
      student.completion ??
      student.student?.progress ??
      0;

    const number = Number(value);

    if (Number.isNaN(number)) {
      return 0;
    }

    return Math.min(100, Math.max(0, number));
  };

  const getAttendance = (student) => {
    const value =
      student.attendance ??
      student.attendancePercentage ??
      student.student?.attendance ??
      0;

    const number = Number(value);

    if (Number.isNaN(number)) {
      return 0;
    }

    return Math.min(100, Math.max(0, number));
  };

  const getStreak = (student) => {
    const value =
      student.streak ??
      student.streakDays ??
      student.student?.streak ??
      0;

    const number = Number(value);

    return Number.isNaN(number) ? 0 : number;
  };

  const getBatch = (student) => {
    return (
      student.batch?.name ||
      student.batchName ||
      student.batch ||
      student.student?.batch?.name ||
      "Unassigned Batch"
    );
  };

  const totalStudents = assignedStudents.length;

  const averageAttendance = useMemo(() => {
    if (totalStudents === 0) return 0;

    const total = assignedStudents.reduce(
      (sum, student) => sum + getAttendance(student),
      0
    );

    return Math.round(total / totalStudents);
  }, [assignedStudents, totalStudents]);

  const averageProgress = useMemo(() => {
    if (totalStudents === 0) return 0;

    const total = assignedStudents.reduce(
      (sum, student) => sum + getProgress(student),
      0
    );

    return Math.round(total / totalStudents);
  }, [assignedStudents, totalStudents]);

  const averageStreak = useMemo(() => {
    if (totalStudents === 0) return 0;

    const total = assignedStudents.reduce(
      (sum, student) => sum + getStreak(student),
      0
    );

    return Math.round(total / totalStudents);
  }, [assignedStudents, totalStudents]);

  const uniqueBatches = useMemo(() => {
    const batches = assignedStudents.map((student) =>
      getBatch(student)
    );

    return [...new Set(batches.filter(Boolean))].length;
  }, [assignedStudents]);

  const completedStudents = assignedStudents.filter(
    (student) => getProgress(student) >= 100
  ).length;

  const needsAttention = assignedStudents.filter(
    (student) => getProgress(student) < 75
  ).length;

  const onTrackStudents = assignedStudents.filter(
    (student) =>
      getProgress(student) >= 75 &&
      getProgress(student) < 100
  ).length;

  const progressChartData = useMemo(() => {
    return assignedStudents.map((student) => ({
      name: getStudentName(student),
      progress: getProgress(student),
      attendance: getAttendance(student),
    }));
  }, [assignedStudents]);

  const statusChartData = [
    {
      name: "Completed",
      students: completedStudents,
    },
    {
      name: "On Track",
      students: onTrackStudents,
    },
    {
      name: "Needs Attention",
      students: needsAttention,
    },
  ];

  const getProgressColor = (progress) => {
    if (progress >= 100) {
      return "bg-green-500";
    }

    if (progress >= 75) {
      return "bg-green-400";
    }

    if (progress >= 50) {
      return "bg-yellow-500";
    }

    return "bg-red-500";
  };

  const getStatus = (progress) => {
    if (progress >= 100) {
      return {
        text: "Completed",
        className:
          "bg-green-900/40 text-green-400 border border-green-700",
      };
    }

    if (progress >= 75) {
      return {
        text: "On Track",
        className:
          "bg-blue-900/40 text-blue-400 border border-blue-700",
      };
    }

    return {
      text: "Needs Attention",
      className:
        "bg-yellow-900/40 text-yellow-400 border border-yellow-700",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">
          Dashboard
        </h1>
        <p className="text-xs text-[#a39081] mt-1">
          Monitor your assigned students, attendance, progress, and performance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-950/40 px-5 py-4">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-red-300/70 mt-1">
            Make sure your backend route is:
            <span className="font-semibold ml-1">/api/mentor/assigned-students</span>
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <p className="text-sm text-[#a39081]">Loading assigned students...</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">
          <span className="text-xs text-[#a39081]">Attendance</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {averageAttendance}%
          </div>
          <span className="text-[10px] text-green-400 mt-2 font-semibold">
            Average attendance
          </span>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">
          <span className="text-xs text-[#a39081]">Progress</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {averageProgress}%
          </div>
          <span className="text-[10px] text-[#c89b7b] mt-2 font-semibold">
            Average syllabus completion
          </span>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">
          <span className="text-xs text-[#a39081]">Assigned Students</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {totalStudents}
          </div>
          <span className="text-[10px] text-[#a39081] mt-2">
            Assigned by administrator
          </span>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">
          <span className="text-xs text-[#a39081]">Average Streak</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {averageStreak} days
          </div>
          <span className="text-[10px] text-[#a39081] mt-2">
            Active daily study streaks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <h2 className="font-bold text-[#c89b7b]">Pending Grading</h2>
          <p className="mt-3 text-3xl font-extrabold">{dashboardMetrics.pendingGrading.length}</p>
          <p className="mt-1 text-xs text-[#a39081]">Submitted tasks awaiting review</p>
        </section>
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <h2 className="font-bold text-[#c89b7b]">At-Risk Students</h2>
          <p className="mt-3 text-3xl font-extrabold">{dashboardMetrics.atRiskStudents.length}</p>
          <p className="mt-1 text-xs text-[#a39081]">Students needing support</p>
          <div className="mt-3 space-y-1 text-xs text-[#d8c5b7]">{dashboardMetrics.atRiskStudents.slice(0, 4).map((student) => <p key={student._id}>{student.fullName}</p>)}</div>
        </section>
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <h2 className="font-bold text-[#c89b7b]">My Assignments</h2>
          <p className="mt-3 text-3xl font-extrabold">{dashboardMetrics.assignments.length}</p>
          <p className="mt-1 text-xs text-[#a39081]">Assignments created by you</p>
        </section>
      </div>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
        <h2 className="font-bold text-[#c89b7b]">Assigned Students</h2>
        {assignedStudents.length === 0 ? (
          <p className="mt-3 text-sm text-[#a39081]">No students assigned.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assignedStudents.map((student) => (
              <div key={student._id} className="rounded-xl border border-[#4a3b32] p-4">
                <p className="font-semibold">{getStudentName(student)}</p>
                <p className="mt-1 text-xs text-[#a39081]">{student.email || "No email available"}</p>
                {student.department && <p className="mt-2 text-xs text-[#a39081]">{student.department}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {dashboardMetrics.pendingGrading.length > 0 && (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <h2 className="font-bold text-[#c89b7b]">Submissions Awaiting Grade</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {dashboardMetrics.pendingGrading.slice(0, 8).map((submission) => (
              <div key={submission._id} className="rounded border border-[#4a3b32] p-3 text-sm">
                <p className="font-semibold">{submission.student?.fullName || "Student"}</p>
                <p className="text-xs text-[#a39081]">{submission.assignment?.title || "Assignment"}</p>
                <span className="text-xs text-amber-300">Awaiting review</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
