// client/src/pages/MentorAttendance.jsx
import React, { useState } from "react";

export default function MentorAttendance() {
  const [students] = useState([
    { id: 1, name: "Abebe Kebede", status: "Present" },
    { id: 2, name: "Tigist Alemu", status: "Absent" },
    { id: 3, name: "Kamel Mohammed", status: "Late" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Attendance Management</h1>
        <p className="text-xs text-[#a39081]">Mark and update daily attendance for your assigned students</p>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#c89b7b]">Daily Attendance Sheet</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#f5efe6]">
            <thead className="border-b border-[#4a3b32] text-[#c89b7b] uppercase">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-[#2d231d] transition">
                  <td className="py-3 px-4 font-semibold">{student.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#4a3b32] text-[#f5efe6]">
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select className="bg-[#2d231d] border border-[#4a3b32] rounded px-2 py-1 text-xs text-[#f5efe6]">
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}