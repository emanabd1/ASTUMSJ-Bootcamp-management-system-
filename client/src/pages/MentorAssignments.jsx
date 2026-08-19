import React, { useState } from "react";

export default function MentorAssignments() {
  const [assignments, setAssignments] = useState([
    { id: 1, student: "Abebe Kebede", title: "React Router Task", status: "Submitted", grade: "-" },
    { id: 2, student: "Tigist Alemu", title: "Node API Integration", status: "Pending", grade: "-" },
    { id: 3, student: "Kamel Mohammed", title: "Database Schema", status: "Graded", grade: "95/100" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Assignments & Grading</h1>
        <p className="text-xs text-[#a39081]">Review student assignments and assign grades</p>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#c89b7b]">Submitted Tasks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#f5efe6]">
            <thead className="border-b border-[#4a3b32] text-[#c89b7b] uppercase">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Assignment Title</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {assignments.map((item) => (
                <tr key={item.id} className="hover:bg-[#2d231d] transition">
                  <td className="py-3 px-4 font-semibold">{item.student}</td>
                  <td className="py-3 px-4 text-[#a39081]">{item.title}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      item.status === "Graded" ? "bg-green-900 text-green-200" :
                      item.status === "Submitted" ? "bg-blue-900 text-blue-200" :
                      "bg-yellow-900 text-yellow-200"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#c89b7b] font-bold">{item.grade}</td>
                  <td className="py-3 px-4">
                    <button className="px-3 py-1 bg-[#c89b7b] text-[#1e1713] font-bold rounded hover:bg-[#b58868] transition text-[10px]">
                      Grade / Review
                    </button>
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