import React from "react";

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide">My Performance Overview</h1>
        <p className="text-xs text-[#a39081]">Track your attendance status, module progress, and upcoming deadlines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl">
          <p className="text-xs text-[#a39081]">Overall Attendance</p>
          <p className="text-2xl font-bold text-[#c89b7b] mt-1">92.5%</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl">
          <p className="text-xs text-[#a39081]">Completed Topics</p>
          <p className="text-2xl font-bold text-[#c89b7b] mt-1">5 / 7</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl">
          <p className="text-xs text-[#a39081]">Average Grade</p>
          <p className="text-2xl font-bold text-[#c89b7b] mt-1">88%</p>
        </div>
      </div>
    </div>
  );
}