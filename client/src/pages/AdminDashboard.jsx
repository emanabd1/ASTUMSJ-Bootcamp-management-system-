import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, mentors: 0, batches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live system overview metrics from the database
    axiosInstance.get("/users/stats")
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats", err);
        setLoading(false);
      });
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
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">
            {loading ? "..." : (stats.students ?? 0)}
          </p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-md">
          <p className="text-xs text-[#a39081] uppercase font-semibold">Total Mentors</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">
            {loading ? "..." : (stats.mentors ?? 0)}
          </p>
        </div>
        <div className="bg-[#1e1713] border border-[#4a3b32] p-6 rounded-2xl shadow-md">
          <p className="text-xs text-[#a39081] uppercase font-semibold">Active Batches</p>
          <p className="text-3xl font-bold text-[#c89b7b] mt-2">
            {loading ? "..." : (stats.batches ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}