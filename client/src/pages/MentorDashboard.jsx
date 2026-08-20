import React, { useState, useEffect } from "react";
import axios from "axios";

export default function MentorDashboard() {
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ከአድሚን የተመደቡትን ተማሪዎች ከባክኤንድ ለመጥራት
  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        // የባክኤንድ ሮውቱን እዚህ ያስገቡ (ለምሳሌ: /api/mentor/assigned-students)
        const response = await axios.get("http://localhost:5000/api/mentor/assigned-students", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAssignedStudents(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching assigned students:", error);
        setLoading(false);
      }
    };

    fetchAssignedStudents();
  }, []);

  // ከባክኤንድ የተማሪዎች መረጃ እስኪመጣ ወይም እስኪመደቡ ድረስ የሚሰሉ ሜትሪኮች (ዳታ ከሌለ 0 ይሆናል)
  const totalStudentsCount = assignedStudents.length;
  
  const avgAttendance = totalStudentsCount > 0 
    ? Math.round(assignedStudents.reduce((acc, curr) => acc + (curr.attendance || 0), 0) / totalStudentsCount) 
    : 0;

  const avgProgress = totalStudentsCount > 0 
    ? Math.round(assignedStudents.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalStudentsCount) 
    : 0;

  const uniqueBatches = totalStudentsCount > 0 
    ? [...new Set(assignedStudents.map(s => s.batch))].length 
    : 0;

  const avgStreak = totalStudentsCount > 0 
    ? Math.round(assignedStudents.reduce((acc, curr) => acc + (curr.streak || 0), 0) / totalStudentsCount) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Dashboard</h1>
        <p className="text-xs text-[#a39081]">Monitor overall bootcamp metrics, attendance, and at-risk students.</p>
      </div>

      {/* Top 4 Metric Cards (Dynamic based on Admin Assignment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <span className="text-xs text-[#a39081] font-medium">Attendance</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">{avgAttendance}%</div>
          <span className="text-[10px] text-green-400 mt-2 font-semibold">Active participation</span>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <span className="text-xs text-[#a39081] font-medium">Progress</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">{avgProgress}%</div>
          <span className="text-[10px] text-[#c89b7b] mt-2 font-semibold">Syllabus completion</span>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <span className="text-xs text-[#a39081] font-medium">Batches</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">{uniqueBatches}</div>
          <span className="text-[10px] text-[#a39081] mt-2">Active assigned batches</span>
        </div>

        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 flex flex-col justify-between shadow-md">
          <span className="text-xs text-[#a39081] font-medium">Streak</span>
          <div className="text-3xl font-extrabold text-[#f5efe6] mt-3">{avgStreak}d</div>
          <span className="text-[10px] text-green-400 mt-2 font-semibold">Consistent logging</span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: This week's trail */}
        <div className="lg:col-span-2 bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#f5efe6] mb-4">This week's trail</h2>
            <div className="flex items-center justify-between max-w-md my-6 px-2">
              {[1, 2, 3, 4, 5, 6, 7].map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${idx < 4 ? 'bg-[#2d231d] border-green-500 text-green-400 text-xs' : 'border-[#4a3b32] text-[#a39081]'}`}>
                    {idx < 4 ? '✓' : ''}
                  </div>
                  {idx < 6 && <div className={`h-0.5 w-8 ${idx < 3 ? 'bg-green-500' : 'bg-[#4a3b32]'}`}></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {["HTML/CSS", "JavaScript", "React", "Node.js", "Express", "MongoDB", "Git"].map((tech, i) => (
              <span key={i} className="bg-[#2d231d] border border-[#4a3b32] text-[#f5efe6] px-3 py-1 rounded-full text-xs font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Admin Assigned Students Chart (Empty until Admin assigns) */}
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-400 text-sm">⚠</span>
              <h2 className="text-sm font-bold text-[#f5efe6]">Admin Assigned Students Chart</h2>
            </div>
            
            {/* Rectangular Chart Container */}
            <div className="space-y-3 bg-[#15100d] border border-[#382b24] p-4 rounded-xl min-h-[150px] flex flex-col justify-center">
              {loading ? (
                <p className="text-xs text-[#a39081] text-center">Loading...</p>
              ) : assignedStudents.length > 0 ? (
                assignedStudents.map((student, index) => (
                  <div key={index} className="bg-[#1e1713] border border-[#4a3b32] p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#f5efe6]">{student.name}</span>
                        <span className="text-[9px] text-[#a39081] ml-2">({student.batch || "Batch"})</span>
                      </div>
                      <span className="bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {student.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-[#2d231d] h-2.5 rounded-md overflow-hidden border border-[#4a3b32]">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-md transition-all duration-500" 
                        style={{ width: `${student.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#a39081] text-center">No students assigned by admin yet.</p>
              )}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-[#a39081] text-right">
            Students tracking below 75% limits.
          </div>
        </div>
      </div>
    </div>
  );
}