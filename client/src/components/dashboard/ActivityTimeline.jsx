import React from "react";

const typeColor = {
  user: "#7fa693",
  assignment: "#c89b7b",
  submission: "#d9ad63",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityTimeline({ items }) {
  if (!items?.length) {
    return <p className="text-xs text-[#a39081]">No recent activity.</p>;
  }

  return (
    <ol className="relative space-y-5 pl-5">
      <span className="absolute left-[3px] top-1 bottom-1 w-px bg-[#4a3b32]" />
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span
            className="absolute -left-5 top-1 h-2 w-2 rounded-full ring-4 ring-[#1e1713]"
            style={{ backgroundColor: typeColor[item.type] || "#c89b7b" }}
          />
          <p className="text-sm leading-snug text-[#f5efe6]">{item.text}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-[#a39081]">
            {timeAgo(item.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}