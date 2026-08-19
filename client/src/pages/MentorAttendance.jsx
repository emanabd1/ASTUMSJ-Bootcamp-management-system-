// client/src/pages/MentorAttendance.jsx
import React, { useState, useEffect } from "react";

export default function MentorAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);

  // Fetch users from backend with Authorization header and filter by mentor's name
  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        // 1. Get logged-in mentor info and token from localStorage
        const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
        const token = localStorage.getItem("token") || loggedInUser?.token;
        const mentorName = loggedInUser?.fullName || loggedInUser?.name || "Foziya Awel";

        // 2. Fetch users from backend API with Authorization header
        const response = await fetch("http://localhost:5000/api/users", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await response.json();

        // Handle both Array response and Object response ({ success, users })
        const usersArray = Array.isArray(data) 
          ? data 
          : (data.users || data.data || []);

        if (usersArray.length > 0) {
          // 3. Flexible filtering: match student role and compare assigned mentor safely
          const filteredStudents = usersArray.filter((user) => {
            const role = (user.role || "").toLowerCase();
            if (role !== "student") return false;
            
            // Check multiple potential field names for mentor assignment
            const assignedField = user.assignedMentor || user.mentor || user.mentorName || "";
            if (!assignedField) return false;

            const assigned = assignedField.trim().toLowerCase();
            const currentMentor = mentorName.trim().toLowerCase();

            // Match exact or contains
            return assigned === currentMentor || assigned.includes(currentMentor) || currentMentor.includes(assigned);
          });

          // 4. Initialize attendance structure for the assigned students
          const initialData = filteredStudents.map((student, index) => ({
            id: student._id || student.id,
            name: student.fullName || student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
            idNumber: student.idNumber || student.studentId || `RU/000${index + 1}/18`,
            lectures: {
              lecture1: { start: "Present", mid: "Present", end: "Present" },
              lecture2: { start: "Present", mid: "Present", end: "Present" },
              lecture3: { start: "Present", mid: "Present", end: "Present" },
            },
          }));

          setAttendanceData(initialData);
        }
      } catch (err) {
        console.error("Error fetching assigned students:", err);
      }
    };

    fetchAssignedStudents();
  }, []);

  // Corrected Percentage Calculation Logic (Present=1, Late=0.5, Excused=1, Absent=0)
  const calculateScore = (lecture) => {
    const statuses = [lecture.start, lecture.mid, lecture.end];
    let points = 0;
    statuses.forEach((status) => {
      if (status === "Present" || status === "Excused") points += 1;
      else if (status === "Late") points += 0.5; // Late = 50% Credit
      else if (status === "Absent") points += 0;
    });
    const percentage = Math.round((points / 3) * 100);
    return `${percentage}%`;
  };

  // Calculate overall P, EX, A counts correctly
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wide text-[#f5efe6]">ASTUMSJ Summer Bootcamp CP Batch 3</h1>
          <p className="text-xs text-[#a39081]">Class Hours: 03:00 PM - 05:00 PM | Grace Period: 3:00 PM - 3:05 PM | Late = 50% Credit</p>
        </div>
        <button 
          onClick={() => alert("Attendance saved successfully!")}
          className="bg-[#c89b7b] text-[#1e1713] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#b5886a] transition"
        >
          Save Attendance
        </button>
      </div>

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
              
              {/* Lecture 1 */}
              <th colSpan="4" className="py-3 px-3 text-center border-l border-r border-[#4a3b32] bg-[#2d231d]/40">
                <div className="text-[10px] font-bold text-[#c89b7b]">CP LECTURE - 1</div>
                <div className="text-[9px] text-[#a39081]">TUE, JUN 9</div>
              </th>

              {/* Lecture 2 */}
              <th colSpan="4" className="py-3 px-3 text-center border-r border-[#4a3b32] bg-[#2d231d]/40">
                <div className="text-[10px] font-bold text-[#c89b7b]">CP LECTURE - 2</div>
                <div className="text-[9px] text-[#a39081]">THU, JUN 11</div>
              </th>

              {/* Lecture 3 */}
              <th colSpan="4" className="py-3 px-3 text-center bg-[#2d231d]/40">
                <div className="text-[10px] font-bold text-[#c89b7b]">CP LECTURE - 3</div>
                <div className="text-[9px] text-[#a39081]">MON, JUN 15</div>
              </th>
            </tr>
            <tr className="border-b border-[#4a3b32] text-[9px] text-[#a39081]">
              <th colSpan="5"></th>
              {[1, 2, 3].map((lecNum) => (
                <React.Fragment key={lecNum}>
                  <th className="py-2 px-1 text-center border-l border-[#4a3b32]">START (3:00)</th>
                  <th className="py-2 px-1 text-center">MID (4:00)</th>
                  <th className="py-2 px-1 text-center">END (5:00)</th>
                  <th className="py-2 px-1 text-center border-r border-[#4a3b32] text-green-400 font-bold">% SCORE</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4a3b32]">
            {attendanceData.length === 0 ? (
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

                    {/* Lecture 1, 2, 3 */}
                    {["lecture1", "lecture2", "lecture3"].map((lecKey, lIdx) => {
                      const score = calculateScore(student.lectures[lecKey]);
                      return (
                        <React.Fragment key={lecKey}>
                          {/* START */}
                          <td className={`py-3 px-1 text-center border-l ${lIdx === 0 ? "border-[#4a3b32]" : ""}`}>
                            <select
                              value={student.lectures[lecKey].start}
                              onChange={(e) => handleStatusChange(student.id, lecKey, "start", e.target.value)}
                              className={`text-[10px] rounded px-1.5 py-1 font-bold focus:outline-none ${getStatusBadge(student.lectures[lecKey].start)}`}
                            >
                              <option value="Present" className="bg-[#1e1713] text-green-300">Present</option>
                              <option value="Late" className="bg-[#1e1713] text-yellow-300">Late</option>
                              <option value="Absent" className="bg-[#1e1713] text-red-300">Absent</option>
                              <option value="Excused" className="bg-[#1e1713] text-blue-300">Excused</option>
                            </select>
                          </td>
                          {/* MID */}
                          <td className="py-3 px-1 text-center">
                            <select
                              value={student.lectures[lecKey].mid}
                              onChange={(e) => handleStatusChange(student.id, lecKey, "mid", e.target.value)}
                              className={`text-[10px] rounded px-1.5 py-1 font-bold focus:outline-none ${getStatusBadge(student.lectures[lecKey].mid)}`}
                            >
                              <option value="Present" className="bg-[#1e1713] text-green-300">Present</option>
                              <option value="Late" className="bg-[#1e1713] text-yellow-300">Late</option>
                              <option value="Absent" className="bg-[#1e1713] text-red-300">Absent</option>
                              <option value="Excused" className="bg-[#1e1713] text-blue-300">Excused</option>
                            </select>
                          </td>
                          {/* END */}
                          <td className="py-3 px-1 text-center">
                            <select
                              value={student.lectures[lecKey].end}
                              onChange={(e) => handleStatusChange(student.id, lecKey, "end", e.target.value)}
                              className={`text-[10px] rounded px-1.5 py-1 font-bold focus:outline-none ${getStatusBadge(student.lectures[lecKey].end)}`}
                            >
                              <option value="Present" className="bg-[#1e1713] text-green-300">Present</option>
                              <option value="Late" className="bg-[#1e1713] text-yellow-300">Late</option>
                              <option value="Absent" className="bg-[#1e1713] text-red-300">Absent</option>
                              <option value="Excused" className="bg-[#1e1713] text-blue-300">Excused</option>
                            </select>
                          </td>
                          {/* % SCORE */}
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