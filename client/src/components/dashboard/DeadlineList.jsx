import React from "react";

function urgency(deadline) {
  const diff = new Date(deadline).getTime() - Date.now();
  const hours = diff / 3600000;
  if (hours < 0) return { color: "#c17c74", label: "Overdue" };
  if (hours < 48) return { color: "#d9ad63", label: "Due soon" };
  return { color: "#7fa693", label: "Upcoming" };
}

export default function DeadlineList({ items }) {
  if (!items?.length) {
    return <p className="text-xs text-[#a39081]">No upcoming deadlines.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((x) => {
        const u = urgency(x.assignment.deadline);
        return (
          <div
            key={x.assignment._id}
            className="flex items-center gap-3 rounded-xl border border-[#4a3b32] p-3"
            style={{ borderLeft: `3px solid ${u.color}` }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#f5efe6]">
                {x.assignment.title}
              </p>
              <p className="mt-0.5 text-xs text-[#a39081]">
                Due {new Date(x.assignment.deadline).toLocaleString()} ·{" "}
                {x.submission?.status === "redo"
                  ? "Resubmission requested"
                  : "Not submitted"}
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide"
              style={{ color: u.color, backgroundColor: `${u.color}1a` }}
            >
              {u.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}