import React from "react";

const statusColor = {
  Completed: "#7fa693",
  "In Progress": "#d9ad63",
  "Not Started": "#5c4d40",
  "Needs Improvement": "#c17c74",
};

export default function ProgressChecklist({ items }) {
  if (!items?.length) {
    return (
      <p className="text-xs text-[#a39081]">
        Your mentor has not added progress records yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((p) => (
        <div
          key={p._id}
          className="flex items-start gap-3 rounded-xl border border-[#4a3b32] p-3"
        >
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: statusColor[p.status] || "#5c4d40" }}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm text-[#f5efe6]">{p.topic}</span>
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-wide"
                style={{ color: statusColor[p.status] || "#a39081" }}
              >
                {p.status}
              </span>
            </div>
            {p.note && (
              <p className="mt-1 text-xs text-[#a39081]">{p.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}