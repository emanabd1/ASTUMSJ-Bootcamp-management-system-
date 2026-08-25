import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const STATUS_COLOR = {
  Completed: "#7fa693",
  "In Progress": "#d9ad63",
  "Not Started": "#5c4d40",
  "Needs Improvement": "#c17c74",
};

const STATUS_ICON = {
  Completed: "✓",
  "In Progress": "→",
  "Not Started": "•",
  "Needs Improvement": "!",
};

const FILTERS = [
  "All",
  "Completed",
  "In Progress",
  "Needs Improvement",
  "Not Started",
];

export default function StudentProgressPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const threadEndRef = useRef(null);

  useEffect(() => {
    axiosInstance
      .get("/progress")
      .then((r) => setRecords(r.data.progress || []))
      .catch((e) =>
        setError(e.response?.data?.message || "Could not load your progress.")
      );
  }, []);

  // Came here from a clickable item on the dashboard checklist — jump
  // straight into that topic's detail view.
  useEffect(() => {
    if (!records || !location.state?.focusTopic) return;
    const match = records.find((r) => r.topic === location.state.focusTopic);
    if (match) setSelected(match);
  }, [records, location.state]);

  // Deep link from a notification: /student/progress?progressId=...&openComments=1
  // Jump straight to the topic the notification was about.
  useEffect(() => {
    const progressId = searchParams.get("progressId");
    if (!progressId || !records) return;

    const match = records.find((r) => r._id === progressId);
    if (match) setSelected(match);

    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, searchParams]);

  useEffect(() => {
    setCommentText("");
  }, [selected?._id]);

  // If the modal opened because of a "new reply" notification, scroll
  // straight to the newest message in the thread.
  useEffect(() => {
    if (selected) {
      threadEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [selected?._id, selected?.comments?.length]);

  // Escape closes the modal too, not just the X button / backdrop click.
  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelected(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const summary = useMemo(() => {
    if (!records) return null;
    const total = records.length;
    const completed = records.filter((r) => r.status === "Completed").length;
    const inProgress = records.filter((r) => r.status === "In Progress").length;
    const needsImprovement = records.filter(
      (r) => r.status === "Needs Improvement"
    ).length;
    const avgPercentage = total
      ? Math.round(
          records.reduce((sum, r) => sum + Number(r.percentage || 0), 0) /
            total
        )
      : 0;

    return { total, completed, inProgress, needsImprovement, avgPercentage };
  }, [records]);

  const filtered = useMemo(() => {
    if (!records) return [];
    const sorted = [...records].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    if (filter === "All") return sorted;
    return sorted.filter((r) => r.status === filter);
  }, [records, filter]);

  const handlePostComment = async () => {
    const text = commentText.trim();
    if (!text || !selected?._id) return;

    try {
      setPostingComment(true);
      const res = await axiosInstance.post(
        `/progress/${selected._id}/comments`,
        { text }
      );

      const updated = res.data?.progress;
      setCommentText("");

      if (updated) {
        setSelected(updated);
        setRecords((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r))
        );
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      setError(
        err.response?.data?.message || "Failed to post your reply."
      );
    } finally {
      setPostingComment(false);
    }
  };

  if (error)
    return (
      <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">
        {error}
      </p>
    );
  if (!records)
    return <p className="text-[#a39081]">Loading your progress...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#f5efe6]">
          My Progress
        </h1>
        <p className="mt-1 text-xs text-[#a39081]">
          Every topic your mentor is tracking for you. Tap a card for the
          full detail — percentage, status, and their notes.
        </p>
      </div>

      {records.length === 0 ? (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-10 text-center">
          <p className="text-sm text-[#a39081]">
            Your mentor hasn't started tracking your progress yet. Check back
            soon.
          </p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#c89b7b]">
                {summary.avgPercentage}%
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                Overall Progress
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_COLOR.Completed }}
              >
                {summary.completed}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                Completed
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_COLOR["In Progress"] }}
              >
                {summary.inProgress}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                In Progress
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: STATUS_COLOR["Needs Improvement"] }}
              >
                {summary.needsImprovement}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                Needs Improvement
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#f5efe6]">
                  Topics
                </h2>
                <p className="text-xs text-[#a39081]">
                  Sorted by most recently updated.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                      filter === status
                        ? "bg-[#c89b7b] text-[#1e1713]"
                        : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-xs text-[#a39081]">
                No topics match this filter.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setSelected(p)}
                    className="group flex items-start gap-3 rounded-xl border border-[#4a3b32] p-4 text-left transition hover:border-[#c89b7b] hover:bg-[#241c17]"
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#1e1713]"
                      style={{
                        backgroundColor: STATUS_COLOR[p.status] || "#5c4d40",
                      }}
                    >
                      {STATUS_ICON[p.status] || "•"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-serif text-sm font-bold text-[#f5efe6]">
                          {p.topic}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#c89b7b]">
                          {p.percentage}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#2a2118]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${p.percentage}%`,
                            backgroundColor:
                              STATUS_COLOR[p.status] || "#5c4d40",
                          }}
                        />
                      </div>

                      {p.note && (
                        <p className="mt-2 line-clamp-2 text-xs text-[#a39081]">
                          {p.note}
                        </p>
                      )}

                      <p className="mt-2 text-[10px] uppercase tracking-wide text-[#7c6d5f] group-hover:text-[#c89b7b]">
                        View details →
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 text-[#f5efe6]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 mb-5 flex items-start justify-between gap-3 bg-[#1e1713] pb-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
                  Topic
                </p>
                <h2 className="font-serif text-2xl font-bold">
                  {selected.topic}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="shrink-0 rounded-full border border-[#4a3b32] px-2.5 py-1 text-xs text-[#a39081] transition hover:border-[#c89b7b] hover:text-[#f5efe6]"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 flex items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[#2a2118]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${
                      STATUS_COLOR[selected.status] || "#5c4d40"
                    } ${selected.percentage * 3.6}deg, #2a2118 0deg)`,
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 6px))",
                    WebkitMask:
                      "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 6px))",
                  }}
                />
                <span className="font-mono text-lg font-bold">
                  {selected.percentage}%
                </span>
              </div>

              <div>
                <span
                  className="inline-block rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1e1713]"
                  style={{
                    backgroundColor: STATUS_COLOR[selected.status] || "#5c4d40",
                  }}
                >
                  {selected.status}
                </span>
                <p className="mt-2 text-xs text-[#a39081]">
                  {selected.mentor?.fullName
                    ? `Tracked by ${selected.mentor.fullName}`
                    : "Tracked by your mentor"}
                </p>
                <p className="mt-1 text-xs text-[#7c6d5f]">
                  Last updated{" "}
                  {selected.updatedAt
                    ? new Date(selected.updatedAt).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" }
                      )
                    : "recently"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-wide text-[#a39081]">
                Mentor's Notes
              </p>
              <div className="rounded-xl border border-[#4a3b32] bg-[#241c17] p-4 text-sm text-[#e5dccf]">
                {selected.note ? (
                  selected.note
                ) : (
                  <span className="text-[#7c6d5f]">
                    No notes left for this topic yet.
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-1.5 text-[10px] uppercase tracking-wide text-[#a39081]">
                Discussion
              </p>

              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[#4a3b32] bg-[#241c17] p-3">
                {selected.comments?.length ? (
                  selected.comments.map((c, idx) => (
                    <div
                      key={c._id || idx}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        c.authorRole === "student"
                          ? "bg-[#c89b7b]/10 text-[#f5efe6]"
                          : "bg-[#2a2118] text-[#e5dccf]"
                      }`}
                    >
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="font-bold">
                          {c.authorRole === "student"
                            ? "You"
                            : c.author?.fullName || "Your mentor"}
                        </span>
                        <span className="text-[10px] text-[#7c6d5f]">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#7c6d5f]">
                    No replies yet. Ask your mentor a question about this
                    topic.
                  </p>
                )}
                <div ref={threadEndRef} />
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 rounded-lg border border-[#4a3b32] bg-[#241c17] px-3 py-2 text-sm text-[#f5efe6] outline-none placeholder:text-[#7c6d5f]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={postingComment || !commentText.trim()}
                  className="rounded-lg bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] hover:bg-[#d8ae8b] disabled:opacity-50"
                >
                  {postingComment ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}