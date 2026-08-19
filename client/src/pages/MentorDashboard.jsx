import React from "react";

export default function MentorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Mentor Management View</h1>
        <p className="text-xs text-[#a39081]">Monitor assigned students, grades, and pending submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 space-y-2">
          <span className="text-xs text-[#a39081] font-semibold">Assigned Students</span>
          <h3 className="text-2xl font-extrabold text-[#c89b7b]">12</h3>
          <p className="text-[10px] text-green-400">+2 new this month</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 space-y-2">
          <span className="text-xs text-[#a39081] font-semibold">Pending Gradings</span>
          <h3 className="text-2xl font-extrabold text-[#c89b7b]">3</h3>
          <p className="text-[10px] text-yellow-400">Requires attention</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-5 space-y-2">
          <span className="text-xs text-[#a39081] font-semibold">Average Attendance</span>
          <h3 className="text-2xl font-extrabold text-[#c89b7b]">92%</h3>
          <p className="text-[10px] text-green-400">Above target</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-[#c89b7b]">Pending Assignment Submissions</h2>
          <p className="text-xs text-[#a39081]">No immediate submissions pending grading validation.</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-[#c89b7b]">At-Risk Students Watchlist</h2>
          <p className="text-xs text-[#a39081]">Students tracking below 75% attendance limits.</p>
        </div>
      </div>
    </div>
  );
}