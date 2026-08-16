import React from "react";

export default function MentorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide">Mentor Management View</h1>
        <p className="text-xs text-[#a39081]">Monitor assigned students, grades, and pending submissions</p>
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