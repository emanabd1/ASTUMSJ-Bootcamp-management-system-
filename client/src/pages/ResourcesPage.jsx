import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const CP_RESOURCES = [
  {
    resourceKey: "blind-75",
    platform: "LeetCode",
    title: "Blind 75",
    tag: "Core Patterns",
    url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions",
  },
  {
    resourceKey: "neetcode-150",
    platform: "LeetCode",
    title: "NeetCode 150",
    tag: "Core Patterns",
    url: "https://neetcode.io/practice",
  },
  {
    resourceKey: "top-interview-150",
    platform: "LeetCode",
    title: "Top Interview 150",
    tag: "Interview Prep",
    url: "https://leetcode.com/studyplan/top-interview-150/",
  },
  {
    resourceKey: "cf-div2-problemset",
    platform: "Codeforces",
    title: "Div 2 Problemset",
    tag: "Contest Practice",
    url: "https://codeforces.com/problemset?tags=div2",
  },
  {
    resourceKey: "a2oj-ladders",
    platform: "Codeforces",
    title: "A2OJ Ladders",
    tag: "Rating Ladder",
    url: "https://a2oj.com/ladders",
  },
  {
    resourceKey: "cf-edu",
    platform: "Codeforces",
    title: "Codeforces EDU",
    tag: "Algorithms Course",
    url: "https://codeforces.com/edu/courses",
  },
];

const DEV_RESOURCES = [
  {
    week: "Week 1",
    title: "HTML & CSS Foundations",
    topics: ["HTML / CSS"],
    items: [
      {
        title: "Kevin Powell — CSS Channel",
        url: "https://www.youtube.com/@KevinPowell",
        type: "Video",
      },
      {
        title: "freeCodeCamp — Responsive Web Design",
        url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
        type: "Course",
      },
    ],
  },
  {
    week: "Week 2",
    title: "JavaScript Fundamentals",
    topics: ["JavaScript"],
    items: [
      {
        title: "Namaste JavaScript — Akshay Saini",
        url: "https://www.youtube.com/@akshaymarch7",
        type: "Video",
      },
      {
        title: "JavaScript.info",
        url: "https://javascript.info/",
        type: "Notes",
      },
    ],
  },
  {
    week: "Week 3",
    title: "React",
    topics: ["React"],
    items: [
      {
        title: "React Official Docs",
        url: "https://react.dev/learn",
        type: "Notes",
      },
      {
        title: "Net Ninja — React Playlist",
        url: "https://www.youtube.com/@NetNinja",
        type: "Video",
      },
    ],
  },
  {
    week: "Week 4",
    title: "Backend Development",
    topics: ["Node.js", "Express"],
    items: [
      {
        title: "Traversy Media — Node Crash Course",
        url: "https://www.youtube.com/@TraversyMedia",
        type: "Video",
      },
      {
        title: "Express Official Docs",
        url: "https://expressjs.com/",
        type: "Notes",
      },
    ],
  },
  {
    week: "Week 5",
    title: "Database",
    topics: ["MongoDB"],
    items: [
      {
        title: "MongoDB Official University",
        url: "https://learn.mongodb.com/",
        type: "Course",
      },
    ],
  },
  {
    week: "Week 6",
    title: "Git & GitHub",
    topics: ["Git", "GitHub"],
    items: [
      {
        title: "Git & GitHub Crash Course — freeCodeCamp",
        url: "https://www.youtube.com/@freecodecamp",
        type: "Video",
      },
    ],
  },
];

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] placeholder:text-[#6f6259] focus:border-[#c89b7b] focus:outline-none";

const PLATFORM_FILTERS = ["All", "LeetCode", "Codeforces", "Unsolved"];

// small style map for dev resource type tags
const TYPE_STYLES = {
  Video: "bg-red-400/10 text-red-300",
  Notes: "bg-sky-400/10 text-sky-300",
  Course: "bg-emerald-400/10 text-emerald-300",
};

// how each filter pill is accented when active
const FILTER_ACCENTS = {
  All: "bg-[#c89b7b] text-[#1e1713]",
  LeetCode: "bg-[#ffa116] text-[#1e1713]",
  Codeforces: "bg-[#5b8bf7] text-[#0e1420]",
  Unsolved: "bg-rose-400 text-[#1e1713]",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

// render a raw minute count as "45 min" or "1h 20m"
function formatDuration(mins) {
  if (mins === null || mins === undefined || mins === "") return null;

  const total = Number(mins);

  if (Number.isNaN(total) || total < 0) return null;

  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const rest = total % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function StopwatchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9 2h6" />
      <path d="M12 2v2" />
    </svg>
  );
}

function LeetCodeMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 4 9 12l6 8" />
      <path d="M5 12h4" />
    </svg>
  );
}

function CodeforcesMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <rect x="3" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function PlatformMark({ platform }) {
  if (platform === "LeetCode") return <LeetCodeMark />;
  if (platform === "Codeforces") return <CodeforcesMark />;
  return null;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1 inline h-3 w-3"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

// normalize API platform values ("leetcode") to the display labels used
// by the static resource list ("LeetCode") so the same filter works on both.
function normalizePlatform(p) {
  if (!p) return "";

  const lower = p.toLowerCase();

  if (lower === "leetcode") return "LeetCode";
  if (lower === "codeforces") return "Codeforces";

  return p;
}

function CpTab({ user }) {
  const [stats, setStats] = useState({});
  const [challenges, setChallenges] = useState([]);
  const [resourceSubs, setResourceSubs] = useState({});
  const [platformFilter, setPlatformFilter] = useState("All");

  const [solutionLinks, setSolutionLinks] = useState({});
  const [timeSpent, setTimeSpent] = useState({});
  const [attempts, setAttempts] = useState({});

  const [submittingId, setSubmittingId] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [s, c, r] = await Promise.all([
        axiosInstance.get("/coding/stats"),
        axiosInstance.get("/coding/challenges"),
        axiosInstance.get("/coding/resource-submissions"),
      ]);

      setStats(s.data.stats || {});
      setChallenges(c.data.challenges || []);
      setResourceSubs(r.data.submissions || {});
    } catch (e) {
      setMsg(
        e.response?.data?.message || "Could not load coding data."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitSolution = async (item) => {
    const existingSubmission = item.mySubmission;

    const url =
      solutionLinks[item.key] !== undefined
        ? solutionLinks[item.key].trim()
        : existingSubmission?.url?.trim();

    const minutes =
      timeSpent[item.key] !== undefined
        ? timeSpent[item.key]
        : existingSubmission?.timeSpentMinutes ?? "";

    const attemptValue =
      attempts[item.key] !== undefined
        ? attempts[item.key]
        : existingSubmission?.attempts ?? 1;

    if (!url) {
      setMsg("Please enter your solution link first.");
      return;
    }

    if (
      attemptValue === "" ||
      Number.isNaN(Number(attemptValue)) ||
      Number(attemptValue) < 1 ||
      !Number.isInteger(Number(attemptValue))
    ) {
      setMsg(
        "Attempts must be a whole number greater than or equal to 1."
      );
      return;
    }

    if (
      minutes !== "" &&
      minutes !== null &&
      minutes !== undefined &&
      (Number.isNaN(Number(minutes)) || Number(minutes) < 0)
    ) {
      setMsg("Time taken must be 0 or greater.");
      return;
    }

    setSubmittingId(item.key);
    setMsg("");

    try {
      await axiosInstance.post("/coding/activity", {
        platform: item.platform?.toLowerCase(),
        url,
        note: `Solution submitted for: ${item.title}`,

        challenge:
          item.kind === "challenge" ? item._id : undefined,

        resourceKey:
          item.kind === "resource"
            ? item.resourceKey
            : undefined,

        timeSpentMinutes:
          minutes !== "" &&
          minutes !== null &&
          minutes !== undefined
            ? Number(minutes)
            : null,

        attempts: Number(attemptValue),
      });

      setMsg(
        existingSubmission
          ? "Submission updated successfully."
          : "Solution submitted successfully."
      );

      await load();
    } catch (e) {
      setMsg(
        e.response?.data?.message ||
          "Could not save solution."
      );
    } finally {
      setSubmittingId("");
    }
  };

  // merge static practice-sheet links + unsolved API challenges into one list,
  // filterable by the same platform buttons — every item, whether it's a
  // fixed sheet or an assigned problem, carries its own submission state
  const combinedItems = [
    ...CP_RESOURCES.map((r) => ({
      kind: "resource",
      key: `resource-${r.resourceKey}`,
      resourceKey: r.resourceKey,
      platform: r.platform,
      title: r.title,
      tag: r.tag,
      link: r.url,
      mySubmission: resourceSubs[r.resourceKey] || null,
    })),

    ...challenges.map((c) => ({
      kind: "challenge",
      key: `challenge-${c._id}`,
      _id: c._id,
      platform: normalizePlatform(c.platform),
      title: c.title,
      tag: "Assigned",
      description: c.description,
      link: c.problemUrl,
      mySubmission: c.mySubmission || null,
    })),
  ];

  const filteredItems = combinedItems.filter((item) => {
    if (platformFilter === "All") return true;

    if (platformFilter === "Unsolved") {
      return !item.mySubmission;
    }

    return item.platform === platformFilter;
  });

  const filterCounts = {
    All: combinedItems.length,

    LeetCode: combinedItems.filter(
      (i) => i.platform === "LeetCode"
    ).length,

    Codeforces: combinedItems.filter(
      (i) => i.platform === "Codeforces"
    ).length,

    Unsolved: combinedItems.filter(
      (i) => !i.mySubmission
    ).length,
  };

  const assignedCount = challenges.length;

  const solvedCount = challenges.filter(
    (c) => c.mySubmission
  ).length;

  const solvedPct = assignedCount
    ? Math.round((solvedCount / assignedCount) * 100)
    : 0;

  return (
    <div className="space-y-7">
      {msg && (
        <div className="flex items-center justify-between rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          <span>{msg}</span>

          <button
            onClick={() => setMsg("")}
            className="ml-4 text-[#a39081] hover:text-[#f5efe6]"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {["leetcode", "codeforces"].map((platform) => (
          <div
            key={platform}
            className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"
          >
            <p className="text-xs uppercase text-[#a39081]">
              {platform}
            </p>

            <p className="mt-2 text-3xl font-bold text-[#c89b7b]">
              {stats[user?._id]?.[platform]?.streak || 0} days
            </p>

            <p className="mt-1 text-xs text-[#a39081]">
              {stats[user?._id]?.[platform]?.count || 0} recorded activities
            </p>
          </div>
        ))}

        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-[#a39081]">
              Assigned Problems
            </p>

            <span className="rounded-full bg-[#c89b7b]/10 px-2 py-0.5 text-[10px] font-bold text-[#c89b7b]">
              {solvedPct}%
            </span>
          </div>

          <p className="mt-2 text-3xl font-bold text-[#c89b7b]">
            {solvedCount}

            <span className="text-base font-semibold text-[#a39081]">
              {" "}
              / {assignedCount}
            </span>
          </p>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#16110e]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c89b7b] to-emerald-400 transition-all"
              style={{ width: `${solvedPct}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-[#a39081]">
            {assignedCount - solvedCount > 0
              ? `${assignedCount - solvedCount} still unsolved`
              : "All caught up 🎉"}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-[#f5efe6]">
              Practice Sheets
            </h2>

            <p className="mt-1 text-xs text-[#a39081]">
              Every sheet and assigned problem has its own submission
              slot — drop your solution link, log the time it took, and
              track how many attempts you've made.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PLATFORM_FILTERS.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setPlatformFilter(platform)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                  platformFilter === platform
                    ? FILTER_ACCENTS[platform]
                    : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
                }`}
              >
                {platform !== "All" &&
                  platform !== "Unsolved" && (
                    <PlatformMark platform={platform} />
                  )}

                {platform}

                <span
                  className={`rounded-full px-1.5 text-[9px] font-bold ${
                    platformFilter === platform
                      ? "bg-black/15"
                      : "bg-[#4a3b32] text-[#a39081]"
                  }`}
                >
                  {filterCounts[platform]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#4a3b32] p-8 text-center text-sm text-[#a39081]">
            Nothing here for this platform yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const submission = item.mySubmission;

              const duration = formatDuration(
                submission?.timeSpentMinutes
              );

              return (
                <div
                  key={item.key}
                  className={`flex flex-col justify-between gap-4 rounded-xl border bg-[#16110e] p-4 lg:flex-row lg:items-start ${
                    !submission
                      ? "border-rose-400/30"
                      : "border-[#4a3b32]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-[#c89b7b]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#c89b7b]">
                        <PlatformMark platform={item.platform} />
                        {item.platform}
                      </span>

                      <h3 className="font-bold text-[#f5efe6]">
                        {item.title}
                      </h3>

                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          submission
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-rose-400/10 text-rose-300"
                        }`}
                      >
                        {submission ? <CheckIcon /> : null}

                        {submission
                          ? "Submitted"
                          : "Unsolved"}
                      </span>

                      {submission && (
                        <>
                          <span className="flex items-center gap-1 rounded-full bg-[#4a3b32] px-2 py-0.5 text-[10px] font-bold text-[#a39081]">
                            <RefreshIcon />

                            {submission.attempts || 1} attempt
                            {(submission.attempts || 1) === 1
                              ? ""
                              : "s"}
                          </span>

                          {duration && (
                            <span className="flex items-center gap-1 rounded-full bg-[#4a3b32] px-2 py-0.5 text-[10px] font-bold text-[#a39081]">
                              <StopwatchIcon />
                              {duration}
                            </span>
                          )}
                        </>
                      )}

                      <span className="text-[10px] uppercase tracking-wide text-[#a39081]">
                        {item.tag}
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-2 text-xs leading-5 text-[#a39081]">
                        {item.description}
                      </p>
                    )}

                    {submission && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-[#4a3b32] bg-[#1e1713] px-2.5 py-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-[#a39081]">
                          <ClockIcon />

                          Last submitted{" "}
                          {timeAgo(submission.completedAt)}
                        </span>

                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-[11px] font-semibold text-[#c89b7b] hover:underline"
                        >
                          {submission.url}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2 lg:w-[380px]">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#c89b7b] hover:underline"
                      >
                        Open Question <ArrowIcon />
                      </a>
                    )}

                    {/* SOLUTION LINK */}
                    <input
                      type="url"
                      className={field}
                      placeholder={
                        submission
                          ? "Edit solution link"
                          : "Paste your solution link (e.g. GitHub)"
                      }
                      value={
                        solutionLinks[item.key] !== undefined
                          ? solutionLinks[item.key]
                          : submission?.url || ""
                      }
                      onChange={(e) =>
                        setSolutionLinks((prev) => ({
                          ...prev,
                          [item.key]: e.target.value,
                        }))
                      }
                    />

                    {/* TIME TAKEN */}
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a39081]">
                        <StopwatchIcon />
                      </div>

                      <input
                        type="number"
                        min="0"
                        className={`${field} pl-9`}
                        placeholder="Time taken (minutes)"
                        value={
                          timeSpent[item.key] !== undefined
                            ? timeSpent[item.key]
                            : submission?.timeSpentMinutes ?? ""
                        }
                        onChange={(e) =>
                          setTimeSpent((prev) => ({
                            ...prev,
                            [item.key]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* NUMBER OF ATTEMPTS */}
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a39081]">
                        <RefreshIcon />
                      </div>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        className={`${field} pl-9`}
                        placeholder="Number of attempts"
                        value={
                          attempts[item.key] !== undefined
                            ? attempts[item.key]
                            : submission?.attempts ?? ""
                        }
                        onChange={(e) =>
                          setAttempts((prev) => ({
                            ...prev,
                            [item.key]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* SUBMIT / EDIT */}
                    <button
                      type="button"
                      disabled={submittingId === item.key}
                      onClick={() => submitSolution(item)}
                      className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingId === item.key
                        ? submission
                          ? "Saving..."
                          : "Submitting..."
                        : submission
                        ? "Edit"
                        : "Submit Solution"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function DevTab() {
  const [search, setSearch] = useState("");

  const filteredResources = DEV_RESOURCES.filter((section) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      section.week.toLowerCase().includes(query) ||
      section.title.toLowerCase().includes(query) ||
      section.topics.some((topic) =>
        topic.toLowerCase().includes(query)
      ) ||
      section.items.some((item) =>
        item.title.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a39081]">
          <SearchIcon />
        </div>

        <input
          className={`${field} pl-10`}
          placeholder="Search resources, topics, or weeks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredResources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4a3b32] bg-[#1e1713] p-10 text-center text-sm text-[#a39081]">
          No resources found.
        </div>
      ) : (
        filteredResources.map((section) => {
          const query = search.toLowerCase().trim();

          const items =
            !query ||
            section.week.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query) ||
            section.topics.some((topic) =>
              topic.toLowerCase().includes(query)
            )
              ? section.items
              : section.items.filter((item) =>
                  item.title.toLowerCase().includes(query)
                );

          return (
            <section
              key={section.week}
              className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#c89b7b] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1e1713]">
                  {section.week}
                </span>

                <div>
                  <h2 className="font-bold text-[#f5efe6]">
                    {section.title}
                  </h2>

                  <p className="mt-1 text-xs text-[#a39081]">
                    {section.topics.join(" • ")}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <a
                    key={item.title}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#4a3b32] p-4 text-sm text-[#f5efe6] transition hover:border-[#c89b7b] hover:bg-[#16110e]"
                  >
                    <span className="flex items-center">
                      {item.title}

                      <ArrowIcon />
                    </span>

                    {item.type && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          TYPE_STYLES[item.type] ||
                          "bg-[#a39081]/10 text-[#a39081]"
                        }`}
                      >
                        {item.type}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("cp");

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-[#f5efe6]">
          Resources
        </h1>

        <p className="text-xs text-[#a39081]">
          Competitive programming practice and week-by-week development
          resources.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { key: "cp", label: "CP" },
          { key: "dev", label: "Dev" },
        ].map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              tab === tabItem.key
                ? "bg-[#c89b7b] text-[#1e1713]"
                : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "cp" ? (
        <CpTab user={user} />
      ) : (
        <DevTab />
      )}
    </div>
  );
}