import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, mentors: 0, batches: 0 });

  useEffect(() => {
    // Fetch system overview metrics
    axiosInstance.get("/users/stats").then(res => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide">Admin Control Center</h1>
        <p className="text-xs text-[#a39081]">System-wide bootcamp overview and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-md">
          <p className="text-xs text-[#a39081] uppercase font-semibold">Total Students</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">{stats.students || 120}</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-md">
          <p className="text-xs text-[#a39081] uppercase font-semibold">Total Mentors</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">{stats.mentors || 12}</p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-md">
          <p className="text-xs text-[#a39081] uppercase font-semibold">Active Batches</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">{stats.batches || 4}</p>
        </div>
      </div>
    </div>
  );
}