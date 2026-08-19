// client/src/pages/MentorProgress.jsx
import React, { useState } from "react";

export default function MentorProgress() {
  const [progressData] = useState([
    { id: 1, name: "Abebe Kebede", module: "React Basics", progress: 85, status: "On Track" },
    { id: 2, name: "Tigist Alemu", module: "Node.js & Express", progress: 60, status: "Needs Attention" },
    { id: 3, name: "Kamel Mohammed", module: "Database Design", progress: 95, status: "Excellent" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Student Progress Tracker</h1>
        <p className="text-xs text-[#a39081]">Monitor and analyze your assigned students' learning progress</p>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#c89b7b]">Progress Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#f5efe6]">
            <thead className="border-b border-[#4a3b32] text-[#c89b7b] uppercase">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Current Module</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {progressData.map((student) => (
                <tr key={student.id} className="hover:bg-[#2d231d] transition">
                  <td className="py-3 px-4 font-semibold">{student.name}</td>
                  <td className="py-3 px-4 text-[#a39081]">{student.module}</td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-[#2d231d] rounded-full h-2.5 border border-[#4a3b32]">
                      <div
                        className="bg-[#c89b7b] h-2 rounded-full"
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-[#a39081] mt-1 inline-block">{student.progress}% completed</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      student.status === "Excellent" ? "bg-green-900 text-green-200" :
                      student.status === "On Track" ? "bg-blue-900 text-blue-200" :
                      "bg-yellow-900 text-yellow-200"
                    }`}>
                      {student.status}
                    </span>
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