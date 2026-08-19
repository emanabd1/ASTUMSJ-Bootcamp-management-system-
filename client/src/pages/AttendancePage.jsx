import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axiosInstance.get("/attendance/my-attendance");
        setAttendance(response.data || []);
      } catch (error) {
        console.error("Failed to load attendance", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const totalSessions = attendance.length;
  const presentCount = attendance.filter((a) => a.status === "Present").length;
  const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  return (
    <div className="p-6 text-[#f5efe6]">
      <h1 className="text-2xl font-bold mb-4">My Attendance</h1>

      {/* Summary Card */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-xs text-[#a39081]">Total Sessions</p>
          <p className="text-2xl font-bold">{totalSessions}</p>
        </div>
        <div className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-xs text-[#a39081]">Sessions Attended</p>
          <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-xs text-[#a39081]">Attendance Rate</p>
          <p className="text-2xl font-bold text-[#c89b7b]">{percentage}%</p>
        </div>
      </div>

      {/* Details Table */}
      <div className="overflow-x-auto rounded-xl border border-[#4a3b32] bg-[#1e1713]">
        <table className="w-full text-left text-sm text-[#f5efe6]">
          <thead className="border-b border-[#4a3b32] bg-[#2d231d] text-xs uppercase text-[#a39081]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-[#a39081]">
                  Loading attendance records...
                </td>
              </tr>
            ) : attendance.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-[#a39081]">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              attendance.map((record, index) => (
                <tr key={record._id || index} className="border-b border-[#4a3b32]/50 hover:bg-[#2d231d]/50">
                  <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        record.status === "Present"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : record.status === "Late"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#a39081]">{record.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}