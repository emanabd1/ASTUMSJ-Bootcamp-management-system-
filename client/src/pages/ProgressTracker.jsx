import React, { useState, useEffect } from "react";
import axios from "axios";

export default function StudentProgressTracker() {
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // አድሚን አሳይን ያደረጋቸውን ተማሪዎች ከባክኤንድ መጥራት
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

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Student Progress Tracker</h1>
        <p className="text-xs text-[#a39081]">Monitor and analyze your assigned students' learning progress</p>
      </div>

      {/* Progress Overview Table / Container */}
      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 shadow-md">
        <h2 className="text-sm font-bold text-[#f5efe6] mb-6">Progress Overview</h2>

        {/* Table Header */}
        <div className="grid grid-cols-4 text-xs font-semibold text-[#a39081] pb-3 border-b border-[#4a3b32]">
          <span>STUDENT NAME</span>
          <span>CURRENT MODULE</span>
          <span>PROGRESS</span>
          <span className="text-right">STATUS</span>
        </div>

        {/* Dynamic Content from Admin Assigned Students */}
        <div className="divide-y divide-[#382b24]">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#a39081]">Loading assigned students...</div>
          ) : assignedStudents.length > 0 ? (
            assignedStudents.map((student, index) => {
              const progressVal = student.progress || 0;
              // በፕሮግረሱ ልክ ስታተሱን በራስ-ሰር መወሰን
              const statusText = progressVal >= 80 ? "On Track" : progressVal >= 50 ? "Needs Attention" : "At Risk";
              const statusColor = progressVal >= 80 ? "bg-blue-950 text-blue-400 border-blue-800" : "bg-amber-950 text-amber-400 border-amber-800";

              return (
                <div key={index} className="grid grid-cols-4 items-center py-4 text-xs">
                  {/* Student Name */}
                  <span className="font-bold text-[#f5efe6] hover:underline cursor-pointer">
                    {student.name || student.username}
                  </span>

                  {/* Current Module */}
                  <span className="text-[#a39081]">
                    {student.currentModule || student.batch || "N/A"}
                  </span>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1 pr-6">
                    <div className="flex justify-between text-[10px] text-[#a39081]">
                      <span>{progressVal}% completed</span>
                    </div>
                    <div className="w-full bg-[#2d231d] h-2 rounded-full overflow-hidden border border-[#4a3b32]">
                      <div 
                        className="bg-gradient-to-r from-[#c89b7b] to-[#f5efe6] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressVal}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded text-[10px] font-bold border ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-[#a39081]">
              No students assigned by admin yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}