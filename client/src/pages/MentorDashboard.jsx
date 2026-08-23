import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get("/mentors/dashboard");

        const rawData = response.data;

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
    // Backend (/api/mentors/dashboard) returns progressCompleted / progressTotal
    // rather than a single percentage field, so derive it when present.
    if (
      typeof student.progressCompleted === "number" &&
      typeof student.progressTotal === "number"
    ) {
      if (student.progressTotal === 0) return 0;
      return Math.round(
        (student.progressCompleted / student.progressTotal) * 100
      );
    }

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
          Monitor your assigned students, attendance, progress,
          and performance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-950/40 px-5 py-4">
          <p className="text-sm text-red-400">
            {error}
          </p>

          <p className="text-xs text-red-300/70 mt-1">
            Make sure your backend route is:
            <span className="font-semibold ml-1">
              /api/mentors/dashboard
            </span>
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <p className="text-sm text-[#a39081]">
            Loading assigned students...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">

          <span className="text-xs text-[#a39081]">
            Attendance
          </span>

          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {averageAttendance}%
          </div>

          <span className="text-[10px] text-green-400 mt-2 font-semibold">
            Average attendance
          </span>

        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">

          <span className="text-xs text-[#a39081]">
            Progress
          </span>

          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {averageProgress}%
          </div>

          <span className="text-[10px] text-[#c89b7b] mt-2 font-semibold">
            Average syllabus completion
          </span>

        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">

          <span className="text-xs text-[#a39081]">
            Assigned Students
          </span>

          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {totalStudents}
          </div>

          <span className="text-[10px] text-[#a39081] mt-2">
            Assigned by administrator
          </span>

        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 shadow-md">

          <span className="text-xs text-[#a39081]">
            Average Streak
          </span>

          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">
            {averageStreak}d
          </div>

          <span className="text-[10px] text-green-400 mt-2 font-semibold">
            Student activity
          </span>

        </div>

      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 shadow-md">

        <div className="mb-6">

          <h2 className="text-lg font-bold text-[#f5efe6]">
            Student Progress
          </h2>

          <p className="text-xs text-[#a39081] mt-1">
            Progress and attendance of students assigned by
            the administrator.
          </p>

        </div>

        {assignedStudents.length === 0 ? (

          <div className="h-[320px] flex items-center justify-center rounded-xl border border-[#382b24] bg-[#15100d]">

            <div className="text-center">

              <div className="text-4xl mb-3">
                📊
              </div>

              <p className="text-sm text-[#a39081]">
                No students assigned yet.
              </p>

              <p className="text-xs text-[#66564b] mt-2">
                Students assigned by the administrator will
                appear in this chart.
              </p>

            </div>

          </div>

        ) : (

          <div className="w-full h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={progressChartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 60,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#4a3b32"
                />

                <XAxis
                  dataKey="name"
                  stroke="#a39081"
                  tick={{
                    fill: "#a39081",
                    fontSize: 11,
                  }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="#a39081"
                  tick={{
                    fill: "#a39081",
                    fontSize: 11,
                  }}
                  tickFormatter={(value) => `${value}%`}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1713",
                    border: "1px solid #4a3b32",
                    borderRadius: "8px",
                  }}
                  labelStyle={{
                    color: "#f5efe6",
                  }}
                  formatter={(value, name) => [
                    `${value}%`,
                    name === "progress"
                      ? "Progress"
                      : "Attendance",
                  ]}
                />

                <Legend
                  wrapperStyle={{
                    color: "#f5efe6",
                    fontSize: "12px",
                  }}
                />

                <Bar
                  dataKey="progress"
                  name="Progress"
                  fill="#c89b7b"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="attendance"
                  name="Attendance"
                  fill="#4ade80"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        )}

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5">

          <p className="text-xs text-[#a39081]">
            Completed
          </p>

          <p className="text-3xl font-bold text-green-400 mt-2">
            {completedStudents}
          </p>

          <p className="text-[10px] text-[#a39081] mt-1">
            Students at 100%
          </p>

        </div>


        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5">

          <p className="text-xs text-[#a39081]">
            On Track
          </p>

          <p className="text-3xl font-bold text-blue-400 mt-2">
            {onTrackStudents}
          </p>

          <p className="text-[10px] text-[#a39081] mt-1">
            Students above 75%
          </p>

        </div>


        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5">

          <p className="text-xs text-[#a39081]">
            Needs Attention
          </p>

          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {needsAttention}
          </p>

          <p className="text-[10px] text-[#a39081] mt-1">
            Students below 75%
          </p>

        </div>

      </div>


      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 shadow-md">

        <div className="mb-5">

          <h2 className="text-lg font-bold text-[#f5efe6]">
            Assigned Students
          </h2>

          <p className="text-xs text-[#a39081] mt-1">
            Only students assigned to you by the administrator
            are displayed.
          </p>

        </div>

        {assignedStudents.length === 0 ? (

          <div className="rounded-xl border border-[#382b24] bg-[#15100d] p-10 text-center">

            <p className="text-sm text-[#a39081]">
              No students assigned by admin yet.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {assignedStudents.map((student, index) => {

              const name = getStudentName(student);
              const progress = getProgress(student);
              const attendance = getAttendance(student);
              const batch = getBatch(student);
              const status = getStatus(progress);

              return (

                <div
                  key={
                    student._id ||
                    student.id ||
                    index
                  }
                  className="border border-[#4a3b32] bg-[#15100d] rounded-xl p-4"
                >

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    <div>

                      <h3 className="font-bold text-[#f5efe6]">
                        {name}
                      </h3>

                      <p className="text-xs text-[#a39081] mt-1">
                        {batch}
                      </p>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${status.className}`}
                    >
                      {status.text}
                    </span>

                  </div>


                  <div className="mt-4">

                    <div className="flex justify-between text-xs mb-2">

                      <span className="text-[#a39081]">
                        Progress
                      </span>

                      <span className="text-[#f5efe6] font-semibold">
                        {progress}%
                      </span>

                    </div>

                    <div className="w-full h-2.5 bg-[#2d231d] rounded-full overflow-hidden">

                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(
                          progress
                        )}`}
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                  </div>


                  <div className="mt-4 flex justify-between text-xs">

                    <span className="text-[#a39081]">
                      Attendance
                    </span>

                    <span className="text-[#f5efe6] font-semibold">
                      {attendance}%
                    </span>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 shadow-md">

        <h2 className="text-sm font-bold text-[#f5efe6] mb-5">
          This Week's Trail
        </h2>

        <div className="flex items-center justify-between max-w-2xl my-6 px-2">

          {[1, 2, 3, 4, 5, 6, 7].map(
            (step, index) => (

              <div
                key={step}
                className="flex items-center"
              >

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                    index < 4
                      ? "bg-[#2d231d] border-green-500 text-green-400"
                      : "border-[#4a3b32] text-[#a39081]"
                  }`}
                >
                  {index < 4 ? "✓" : ""}
                </div>

                {index < 6 && (
                  <div
                    className={`h-0.5 w-8 sm:w-16 ${
                      index < 3
                        ? "bg-green-500"
                        : "bg-[#4a3b32]"
                    }`}
                  />
                )}

              </div>

            )
          )}

        </div>

        <div className="flex flex-wrap gap-2">

          {[
            "HTML/CSS",
            "JavaScript",
            "React",
            "Node.js",
            "Express",
            "MongoDB",
            "Git",
          ].map((tech) => (

            <span
              key={tech}
              className="bg-[#2d231d] border border-[#4a3b32] text-[#f5efe6] px-3 py-1 rounded-full text-xs font-medium"
            >
              {tech}
            </span>

          ))}

        </div>

      </div>

    </div>
  );
}