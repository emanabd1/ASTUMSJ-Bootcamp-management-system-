// client/src/pages/AssignedStudents.jsx
import React, { useState } from "react";

export default function AssignedStudents() {
  // ለጊዜው በናሙና መረጃ (Mock Data) የተዘጋጀ
  const [students] = useState([
    { id: 1, name: "Abebe Kebede", email: "abebe@example.com", batch: "Batch 1", progress: "In Progress" },
    { id: 2, name: "Tigist Alemu", email: "tigist@example.com", batch: "Batch 1", progress: "Completed" },
    { id: 3, name: "Kamel Mohammed", email: "kamel@example.com", batch: "Batch 2", progress: "Needs Improvement" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Assigned Students</h1>
        <p className="text-xs text-[#a39081]">Manage and view details of students assigned to your mentorship</p>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#f5efe6]">
            <thead className="border-b border-[#4a3b32] text-[#c89b7b] uppercase">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Progress Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-[#2d231d] transition">
                  <td className="py-3 px-4 font-semibold">{student.name}</td>
                  <td className="py-3 px-4 text-[#a39081]">{student.email}</td>
                  <td className="py-3 px-4">{student.batch}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      student.progress === 'Completed' ? 'bg-green-900 text-green-200' :
                      student.progress === 'In Progress' ? 'bg-blue-900 text-blue-200' :
                      'bg-yellow-900 text-yellow-200'
                    }`}>
                      {student.progress}
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