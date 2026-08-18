import React from "react";

const statusColor = {
  Present: "#7fa693",
  Late: "#d9ad63",
  Excused: "#8b6ba8",
  Absent: "#c17c74",
};

export default function AttendanceStrip({ records, limit = 30 }) {
  if (!records?.length) {
    return <p className="text-xs text-[#a39081]">No attendance recorded yet.</p>;
  }

  const recent = [...records].slice(0, limit).reverse();

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {recent.map((r) => (
          <span
            key={r._id}
            title={`${new Date(r.date).toLocaleDateString()} · ${r.status}`}
            className="h-4 w-4 rounded-[4px]"
            style={{ backgroundColor: statusColor[r.status] || "#4a3b32" }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(statusColor).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] text-[#a39081]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}