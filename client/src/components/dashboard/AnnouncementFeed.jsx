import React from "react";

export default function AnnouncementFeed({ items }) {
  if (!items?.length) {
    return <p className="text-xs text-[#a39081]">No announcements yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((a) => (
        <div key={a._id} className="rounded-xl border border-[#4a3b32] p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-[#f5efe6]">{a.title}</p>
            <span className="shrink-0 font-mono text-[10px] text-[#a39081]">
              {new Date(a.publishDate).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#a39081]">
            {a.content}
          </p>
        </div>
      ))}
    </div>
  );
}