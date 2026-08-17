import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const field = "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";
const topics = ["HTML / CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB", "Git / GitHub"];

export default function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get("/mentors/students");
      setStudents(r.data.students || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = async (id) => {
    try {
      const r = await axiosInstance.get(`/mentors/students/${id}`);
      setSelected(id);
      setDetail(r.data);
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not load student.");
    }
  };

  const saveAttendance = async (status) => {
    try {
      await axiosInstance.post(`/mentors/students/${selected}/attendance`, {
        date: new Date().toISOString().slice(0, 10),
        status,
      });
      setMessage("Attendance saved.");
      await open(selected);
      await load();
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not save attendance.");
    }
  };

  const saveProgress = async (topic, status) => {
    try {
      await axiosInstance.post(`/mentors/students/${selected}/progress`, {
        topic,
        status,
      });
      setMessage("Progress saved.");
      await open(selected);
      await load();
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not save progress.");
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold">Mentor Dashboard</h1>
        <p className="text-xs text-[#a39081]">
          Manage attendance and progress only for students assigned to you.
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <p className="text-xs text-[#a39081]">Assigned Students</p>
          <p className="mt-2 text-3xl font-bold text-[#c89b7b]">
            {students.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <p className="text-xs text-[#a39081]">Completed Progress Records</p>
          <p className="mt-2 text-3xl font-bold text-[#c89b7b]">
            {students.reduce((a, s) => a + (s.progressCompleted || 0), 0)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] overflow-hidden">
        <div className="p-5 border-b border-[#4a3b32]">
          <h2 className="font-bold">My Assigned Students</h2>
        </div>

        {loading ? (
          <p className="p-5 text-xs text-[#a39081]">Loading...</p>
        ) : students.length === 0 ? (
          <p className="p-5 text-xs text-[#a39081]">
            No students assigned yet. Ask an administrator to assign students to you.
          </p>
        ) : (
          <div className="divide-y divide-[#4a3b32]">
            {students.map((s) => (
              <div
                key={s._id}
                className="p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold">{s.fullName}</p>
                  <p className="text-xs text-[#a39081]">
                    {s.email} · {s.department || "No department"}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span>
                    Attendance:{" "}
                    <b className="text-[#c89b7b]">{s.attendancePercentage}%</b>
                  </span>
                  <span>
                    Progress:{" "}
                    <b className="text-[#c89b7b]">
                      {s.progressCompleted}/{s.progressTotal}
                    </b>
                  </span>
                  <button
                    onClick={() => open(s._id)}
                    className="rounded-lg bg-[#c89b7b] px-3 py-2 font-bold text-[#1e1713] hover:bg-[#b08567] transition"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6 text-[#f5efe6]"
          >
            <div className="flex justify-between items-center border-b border-[#4a3b32] pb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {detail.student.fullName}
                </h2>
                <p className="text-xs text-[#a39081]">{detail.student.email}</p>
              </div>

              <button
                onClick={() => setDetail(null)}
                className="text-[#a39081] hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
                <span className="text-xs text-[#a39081]">Department</span>
                <br />
                <b className="text-[#f5efe6]">{detail.student.department || "—"}</b>
              </div>

              <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
                <span className="text-xs text-[#a39081]">Year</span>
                <br />
                <b className="text-[#f5efe6]">{detail.student.yearOfStudy || "—"}</b>
              </div>

              <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
                <span className="text-xs text-[#a39081]">Attendance</span>
                <br />
                <b className="text-[#c89b7b]">
                  {detail.attendance.length
                    ? Math.round(
                        (detail.attendance.filter((a) =>
                          ["Present", "Late"].includes(a.status)
                        ).length /
                          detail.attendance.length) *
                          100
                      )
                    : 0}
                  %
                </b>
              </div>

              <div className="rounded-xl border border-[#4a3b32] p-3 bg-[#16110e]">
                <span className="text-xs text-[#a39081]">Progress</span>
                <br />
                <b className="text-[#c89b7b]">
                  {
                    detail.progress.filter((p) => p.status === "Completed")
                      .length
                  }
                  /{detail.progress.length}
                </b>
              </div>
            </div>

            <section className="mt-6">
              <h3 className="font-bold text-sm text-[#f5efe6]">
                Mark Today's Attendance
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Present", "Absent", "Late", "Excused"].map((s) => (
                  <button
                    key={s}
                    onClick={() => saveAttendance(s)}
                    className="rounded-xl border border-[#4a3b32] bg-[#16110e] px-4 py-2 text-xs text-[#f5efe6] hover:border-[#c89b7b] hover:bg-[#c89b7b] hover:text-[#1e1713] transition font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className="font-bold text-sm text-[#f5efe6]">
                Update Topic Progress
              </h3>
              <div className="mt-3 space-y-2">
                {topics.map((t) => (
                  <div
                    key={t}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#4a3b32] bg-[#16110e] p-3"
                  >
                    <span className="text-sm font-medium">{t}</span>
                    <select
                      className={field + " max-w-xs"}
                      value={
                        detail.progress.find((p) => p.topic === t)?.status ||
                        "Not Started"
                      }
                      onChange={(e) => saveProgress(t, e.target.value)}
                    >
                      {[
                        "Not Started",
                        "In Progress",
                        "Completed",
                        "Needs Improvement",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}