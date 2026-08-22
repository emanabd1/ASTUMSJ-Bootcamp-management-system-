import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

// icon + accent color per notification type, so the list is scannable at a glance
const TYPE_STYLES = {
  deadline: { accent: "text-amber-300 bg-amber-400/10", label: "Deadline" },
  coding: { accent: "text-sky-300 bg-sky-400/10", label: "Coding" },
  assignment: { accent: "text-violet-300 bg-violet-400/10", label: "Assignment" },
  attendance: { accent: "text-emerald-300 bg-emerald-400/10", label: "Attendance" },
  announcement: { accent: "text-rose-300 bg-rose-400/10", label: "Announcement" },
  grade: { accent: "text-emerald-300 bg-emerald-400/10", label: "Grade" },
  info: { accent: "text-[#c89b7b] bg-[#c89b7b]/10", label: "Update" },
};

function typeStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.info;
}

function BellDotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-1 inline h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const r = await axiosInstance.get("/notifications");
      setItems(r.data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await axiosInstance.patch(`/notifications/${id}/read`);
  };

  const markAllRead = async () => {
    await axiosInstance.patch("/notifications/read-all");
    load();
  };

  // clicking a notification marks it read, then takes the student straight
  // to the real page it refers to (assignment, coding challenge, etc.)
  const openNotification = async (n) => {
    if (!n.read) {
      setItems((prev) =>
        prev.map((i) => (i._id === n._id ? { ...i, read: true } : i))
      );
      markRead(n._id);
    }

    if (n.link) {
      navigate(n.link);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;
  const visibleItems =
    filter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#f5efe6]">
            Notifications
          </h1>
          <p className="text-xs text-[#a39081]">
            Assignments, grades, resubmission requests and deadlines — tap
            any card to jump straight to it.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-semibold text-[#a39081] transition hover:border-[#c89b7b] hover:text-[#f5efe6]"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        {[
          { key: "all", label: "All", count: items.length },
          { key: "unread", label: "Unread", count: unreadCount },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
              filter === f.key
                ? "bg-[#c89b7b] text-[#1e1713]"
                : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 text-[9px] font-bold ${
                filter === f.key ? "bg-black/15" : "bg-[#4a3b32] text-[#a39081]"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#4a3b32] bg-[#1e1713] p-10 text-center text-sm text-[#a39081]">
          Loading notifications...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#4a3b32] bg-[#1e1713] p-10 text-center text-sm text-[#a39081]">
          <BellDotIcon />
          {filter === "unread"
            ? "You're all caught up — no unread notifications."
            : "Nothing here yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((n) => {
            const style = typeStyle(n.type);

            return (
              <button
                key={n._id}
                onClick={() => openNotification(n)}
                className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition hover:border-[#c89b7b] ${
                  n.read
                    ? "border-[#4a3b32] bg-[#1e1713]"
                    : "border-[#c89b7b] bg-[#2d231d]"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.accent}`}
                >
                  <BellDotIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                    )}
                    <b className="text-sm text-[#f5efe6]">{n.title}</b>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${style.accent}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-5 text-[#a39081]">
                    {n.message}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-[10px] text-[#6f6259]">
                      {timeAgo(n.createdAt)}
                    </span>

                    {n.link && (
                      <span className="text-[11px] font-semibold text-[#c89b7b]">
                        View details <ArrowIcon />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}