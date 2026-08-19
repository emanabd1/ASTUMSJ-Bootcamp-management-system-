// client/src/pages/AssignedStudents.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AssignedStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      setLoading(true);
      try {
        // 1. ከ localStorage የገባውን የሜንተር መረጃ ማግኘት (እባክዎ በባክኤንድዎ አሰራር መሰረት ኬዩን ያስተካክሉት)
        const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
        const currentMentorName = loggedInUser.fullName || loggedInUser.name || "";

        // 2. ተጠቃሚዎችን ከባክኤንድ ማምጣት
        const res = await axiosInstance.get("/users");
        const data = res.data;
        let allUsers = [];

        if (Array.isArray(data)) {
          allUsers = data;
        } else if (Array.isArray(data?.users)) {
          allUsers = data.users;
        } else if (Array.isArray(data?.data)) {
          allUsers = data.data;
        } else if (Array.isArray(data?.data?.users)) {
          allUsers = data.data.users;
        }

        // 3. ተማሪዎችን እና ለአሁኑ ሜንተር የተመደቡትን ብቻ ማጣራት
        const assigned = allUsers.filter((user) => {
          const isStudent = user.role?.toLowerCase() === "student";
          // አድሚኑ ያስቀመጠው assignedMentor ስም ከሜንተሩ ስም ጋር የሚመሳሰል መሆኑን ማረጋገጥ
          const matchesMentor = user.assignedMentor?.toLowerCase() === currentMentorName.toLowerCase();
          return isStudent && matchesMentor;
        });

        setStudents(assigned);
      } catch (err) {
        console.error("Failed to fetch assigned students:", err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedStudents();
  }, []);

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
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year of Study</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-[#a39081] animate-pulse">
                    Loading assigned students...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => {
                  const studentId = student._id || student.id;
                  const status = student.status || "approved";
                  return (
                    <tr key={studentId} className="hover:bg-[#2d231d] transition">
                      <td className="py-3 px-4 font-semibold">{student.fullName || student.name}</td>
                      <td className="py-3 px-4 text-[#a39081]">{student.email}</td>
                      <td className="py-3 px-4">{student.department || "N/A"}</td>
                      <td className="py-3 px-4">{student.yearOfStudy || "N/A"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          status === 'approved' || status === 'active' 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-[#a39081]">
                    No students have been assigned to your mentorship yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}