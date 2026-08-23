// client/src/pages/MentorAttendance.jsx
import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

const LECTURES = [
  { key: "lecture1", label: "CP LECTURE - 1", dateLabel: "TUE, JUN 9", date: "2026-06-09" },
  { key: "lecture2", label: "CP LECTURE - 2", dateLabel: "THU, JUN 11", date: "2026-06-11" },
  { key: "lecture3", label: "CP LECTURE - 3", dateLabel: "MON, JUN 15", date: "2026-06-15" },
];

export default function MentorAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, attendanceRes] = await Promise.all([
        axiosInstance.get("/mentors/dashboard"),
        axiosInstance.get("/attendance"),
      ]);

      const dashboardData = dashboardRes.data;
      const studentsArray =
        dashboardData?.dashboard?.assignedStudents ||
        dashboardData?.assignedStudents ||
        dashboardData?.users ||
        dashboardData?.data ||
        [];

      const existingRecords = attendanceRes.data?.attendance || [];

      const initialData = studentsArray.map((student, index) => {
        const studentId = student._id || student.id;

        const lectures = {};
        LECTURES.forEach((lecture) => {
          const match = existingRecords.find((record) => {
            const recordStudentId = record.student?._id || record.student;
            const recordDate = new Date(record.date).toISOString().slice(0, 10);

            return (
              String(recordStudentId) === String(studentId) &&
              recordDate === lecture.date
            );
          });

          const status = match?.status || "Present";

          lectures[lecture.key] = {
            start: status,
            mid: status,
            end: status,
          };
        });

        return {
          id: studentId,
          name:
            student.fullName ||
            student.name ||
            `${student.firstName || ""} ${student.lastName || ""}`.trim(),
          idNumber: student.idNumber || student.studentId || `RU/000${index + 1}/18`,
          lectures,
        };
      });

      setAttendanceData(initialData);
    } catch (err) {
      console.error("Error loading attendance:", err);
      setError(err.response?.data?.message || "Unable to load attendance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateScore = (lecture) => {
    const statuses = [lecture.start, lecture.mid, lecture.end];
    let points = 0;
    statuses.forEach((status) => {
      if (status === "Present" || status === "Excused") points += 1;
      else if (status === "Late") points += 0.5;
      else if (status === "Absent") points += 0;
    });
    const percentage = Math.round((points / 3) * 100);
    return `${percentage}%`;
  };

  const calculateTotals = (lectures) => {
    let P = 0, EX = 0, A = 0;
    Object.values(lectures).forEach((lec) => {
      [lec.start, lec.mid, lec.end].forEach((s) => {
        if (s === "Present" || s === "Late") P += 1;
        if (s === "Excused") EX += 1;
        if (s === "Absent") A += 1;
      });
    });
    return { P, EX, A };
  };

  const deriveLectureStatus = (lecture) => {
    const values = [lecture.start, lecture.mid, lecture.end];

    if (values.includes("Excused")) return "Excused";
    if (values.every((v) => v === "Present")) return "Present";
    if (values.every((v) => v === "Absent")) return "Absent";
    return "Late";
  };

  const handleStatusChange = (studentId, lectureKey, sessionKey, newStatus) => {
    setAttendanceData((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            lectures: {
              ...student.lectures,
              [lectureKey]: {
                ...student.lectures[lectureKey],
                [sessionKey]: newStatus,
              },
            },
          };
        }
        return student;
      })
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-900/80 text-green-300 border border-green-700";
      case "Late":
        return "bg-yellow-900/80 text-yellow-300 border border-yellow-700";
      case "Absent":
        return "bg-red-900/80 text-red-300 border border-red-700";
      case "Excused":
        return "bg-blue-900/80 text-blue-300 border border-blue-700";
      default:
        return "bg-[#4a3b32] text-[#f5efe6]";
    }
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      const requests = [];

      attendanceData.forEach((student) => {
        LECTURES.forEach((lecture) => {
          const lectureData = student.lectures[lecture.key];
          const status = deriveLectureStatus(lectureData);
          const note = `Start: ${lectureData.start} | Mid: ${lectureData.mid} | End: ${lectureData.end}`;

          requests.push(
            axiosInstance.post("/attendance", {
              studentId: student.id,
              date: lecture.date,
              status,
              note,
            })
          );
        });
      });

      await Promise.all(requests);

      setSaveMessage("Attendance saved successfully.");
      await loadData();
    } catch (err) {
      console.error("Error saving attendance:", err);
      setError(err.response?.data?.message || "Unable to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide text-[#f5efe6]">ASTUMSJ Summer Bootcamp CP Batch 3</h1>
          <p className="text-xs text-[#a39081]">Class Hours: 03:00 PM - 05:00 PM | Grace Period: 3:00 PM - 3:05 PM | Late = 50% Credit</p>
        </div>
        <button
          onClick={handleSaveAttendance}
          disabled={saving || loading}
          className="bg-[#c89b7b] text-[#1e1713] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#b5886a] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-950/40 px-5 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className="rounded-xl border border-green-700 bg-green-950/40 px-5 py-3">
          <p className="text-sm text-green-400">{saveMessage}</p>
        </div>
      )}

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-4 flex justify-between items-center text-xs text-[#a39081]">
        <div className="flex items-center gap-3">
          <span>Select Date:</span>
          <input
            type="date"
            defaultValue="2026-08-19"
            className="bg-[#2d231d] border border-[#4a3b32] rounded px-3 py-1 text-xs text-[#f5efe6] focus:outline-none focus:border-[#c89b7b]"
          />
        </div>
        <div className="flex gap-4 text-[10px]">
          <span className="text-green-400">P = Attended</span>
          <span className="text-yellow-400">E = Late</span>
          <span className="text-blue-400">EX = Excused</span>
          <span className="text-red-400">A = Absent</span>
        </div>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 overflow-x-auto">
        <table className="w-full text-left text-xs text-[#f5efe6] border-collapse">
          <thead>
            <tr className="border-b border-[#4a3b32] text-[#c89b7b]">
              <th className="py-3 px-3 uppercase text-[10px]">#</th>
              <th className="py-3 px-3 uppercase text-[10px]">Approved Student Name</th>
              <th className="py-3 px-3 uppercase text-[10px] text-center">P</th>
              <th className="py-3 px-3 uppercase text-[10px] text-center">EX</th>
              <th className="py-3 px-3 uppercase text-[10px] text-center">A</th>

              {LECTURES.map((lecture, idx) => (
                <th
                  key={lecture.key}
                  colSpan="4"
                  className={`py-3 px-3 text-center border-l ${idx === LECTURES.length - 1 ? "" : "border-r"} border-[#4a3b32] bg-[#2d231d]/40`}
                >
                  <div className="text-[10px] font-bold text-[#c89b7b]">{lecture.label}</div>
                  <div className="text-[9px] text-[#a39081]">{lecture.dateLabel}</div>
                </th>
              ))}
            </tr>
            <tr className="border-b border-[#4a3b32] text-[9px] text-[#a39081]">
              <th colSpan="5"></th>
              {LECTURES.map((lecture) => (
                <React.Fragment key={lecture.key}>
                  <th className="py-2 px-1 text-center border-l border-[#4a3b32]">START (3:00)</th>
                  <th className="py-2 px-1 text-center">MID (4:00)</th>
                  <th className="py-2 px-1 text-center">END (5:00)</th>
                  <th className="py-2 px-1 text-center border-r border-[#4a3b32] text-green-400 font-bold">% SCORE</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4a3b32]">
            {loading ? (
              <tr>
                <td colSpan="17" className="py-6 text-center text-[#a39081]">
                  Loading attendance...
                </td>
              </tr>
            ) : attendanceData.length === 0 ? (
              <tr>
                <td colSpan="17" className="py-6 text-center text-[#a39081]">
                  No students assigned to you yet.
                </td>
              </tr>
            ) : (
              attendanceData.map((student, index) => {
                const totals = calculateTotals(student.lectures);
                return (
                  <tr key={student.id} className="hover:bg-[#2d231d] transition">
                    <td className="py-3 px-3 text-[#a39081]">{index + 1}</td>
                    <td className="py-3 px-3 font-semibold">
                      <div>{student.name}</div>
                      <div className="text-[9px] text-[#a39081]">{student.idNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-green-400">{totals.P}</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-400">{totals.EX}</td>
                    <td className="py-3 px-3 text-center font-bold text-red-400">{totals.A}</td>

                    {LECTURES.map((lecture, lIdx) => {
                      const lectureData = student.lectures[lecture.key];
                      const score = calculateScore(lectureData);
                      return (
                        <React.Fragment key={lecture.key}>
                          <td className={`py-3 px-1 text-center border-l ${lIdx === 0 ? "border-[#4a3b32]" : ""}`}>
                            <select
                              value={lectureData.start}
                              onChange={(e) => handleStatusChange(student.id, lecture.key, "start", e.target.value)}
                              className={`text-[10px] rounded px-1.5 py-1 font-bold focus:outline-none ${getStatusBadge(lectureData.start)}`}
                            >
                              <option value="Present" className="bg-[#1e1713] text-green-300">Present</option>
                              <option value="Late" className="bg-[#1e1713] text-yellow-300">Late</option>
                              <option value="Absent" className="bg-[#1e1713] text-red-300">Absent</option>
                              <option value="Excused" className="bg-[#1e1713] text-blue-300">Excused</option>
                            </select>
                          </td>
                          <td className="py-3 px-1 text-center">
                            <select
                              value={lectureData.mid}
                              onChange={(e) => handleStatusChange(student.id, lecture.key, "mid", e.target.value)}
                              className={`text-[10px] rounded px-1.5 py-1 font-bold focus:outline-none ${getStatusBadge(lectureData.mid)}`}
                            >
                              <option value="Present" className="bg-[#1e1713] text-green-300">Present</option>
                              <option value="Late" className="bg-[#1e1713] text-yellow-300">Late</option>
                              <option value="Absent" className="bg-[#1e1713] text-red-300">Absent</option>
                              <option value="Excused" className="bg-[#1e1713] text-blue-300">Excused</option>
                            </select>
                          </td>
                          <td className="py-3 px-1 text-center">
                            <select
                              value={lectureData.end}
                              onChange={(e) => handleStatusChange(student.id, lecture.key, "end", e.target.value)}
                              className={`text-[10px] rounded px-1.5 py-1 font-bold focus:outline-none ${getStatusBadge(lectureData.end)}`}
                            >
                              <option value="Present" className="bg-[#1e1713] text-green-300">Present</option>
                              <option value="Late" className="bg-[#1e1713] text-yellow-300">Late</option>
                              <option value="Absent" className="bg-[#1e1713] text-red-300">Absent</option>
                              <option value="Excused" className="bg-[#1e1713] text-blue-300">Excused</option>
                            </select>
                          </td>
                          <td className="py-3 px-2 text-center border-r border-[#4a3b32] font-bold text-green-400 text-xs">
                            {score}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}