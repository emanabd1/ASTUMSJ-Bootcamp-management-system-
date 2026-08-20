import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const CP_RESOURCES = [
  {
    platform: "LeetCode",
    title: "Blind 75",
    tag: "Core Patterns",
    url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions",
  },
  {
    platform: "LeetCode",
    title: "NeetCode 150",
    tag: "Core Patterns",
    url: "https://neetcode.io/practice",
  },
  {
    platform: "LeetCode",
    title: "Top Interview 150",
    tag: "Interview Prep",
    url: "https://leetcode.com/studyplan/top-interview-150/",
  },
  {
    platform: "Codeforces",
    title: "Div 2 Problemset",
    tag: "Contest Practice",
    url: "https://codeforces.com/problemset?tags=div2",
  },
  {
    platform: "Codeforces",
    title: "A2OJ Ladders",
    tag: "Rating Ladder",
    url: "https://a2oj.com/ladders",
  },
  {
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
      },
      {
        title: "freeCodeCamp — Responsive Web Design",
        url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
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
      },
      {
        title: "JavaScript.info",
        url: "https://javascript.info/",
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
      },
      {
        title: "Net Ninja — React Playlist",
        url: "https://www.youtube.com/@NetNinja",
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
      },
      {
        title: "Express Official Docs",
        url: "https://expressjs.com/",
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
      },
    ],
  },
];

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] placeholder:text-[#6f6259] focus:border-[#c89b7b] focus:outline-none";

const PLATFORM_FILTERS = ["All", "LeetCode", "Codeforces"];

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

function CpTab({ user }) {
  const [stats, setStats] = useState({});
  const [challenges, setChallenges] = useState([]);
  const [cpTab, setCpTab] = useState("practice");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [solutionLinks, setSolutionLinks] = useState({});
  const [submittingId, setSubmittingId] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        axiosInstance.get("/coding/stats"),
        axiosInstance.get("/coding/challenges"),
      ]);

      setStats(s.data.stats || {});
      setChallenges(c.data.challenges || []);
    } catch (e) {
      setMsg(e.response?.data?.message || "Could not load coding data.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitSolution = async (challenge) => {
    const url = solutionLinks[challenge._id]?.trim();

    if (!url) {
      setMsg("Please enter your solution link first.");
      return;
    }

    setSubmittingId(challenge._id);

    try {
      await axiosInstance.post("/coding/activity", {
        platform: challenge.platform?.toLowerCase(),
        url,
        note: `Solution submitted for: ${challenge.title}`,
      });

      setSolutionLinks((prev) => ({
        ...prev,
        [challenge._id]: "",
      }));

      setMsg("Solution link submitted successfully.");
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Could not submit solution.");
    } finally {
      setSubmittingId("");
    }
  };

  const filteredResources =
    platformFilter === "All"
      ? CP_RESOURCES
      : CP_RESOURCES.filter(
          (resource) => resource.platform === platformFilter
        );

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

      <div className="grid gap-4 md:grid-cols-2">
        {["leetcode", "codeforces"].map((platform) => (
          <div
            key={platform}
            className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"
          >
            <p className="text-xs uppercase text-[#a39081]">{platform}</p>

            <p className="mt-2 text-3xl font-bold text-[#c89b7b]">
              {stats[user?._id]?.[platform]?.streak || 0} days
            </p>

            <p className="mt-1 text-xs text-[#a39081]">
              {stats[user?._id]?.[platform]?.count || 0} recorded activities
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "practice", label: "Practice Sheets" },
          { key: "unsolved", label: "Unsolved Questions" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setCpTab(item.key)}
            className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              cpTab === item.key
                ? "bg-[#c89b7b] text-[#1e1713]"
                : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {cpTab === "practice" && (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[#f5efe6]">Practice Sheets</h2>
              <p className="mt-1 text-xs text-[#a39081]">
                Choose a platform and start practicing.
              </p>
            </div>

            <div className="flex gap-1.5">
              {PLATFORM_FILTERS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setPlatformFilter(platform)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                    platformFilter === platform
                      ? "bg-[#c89b7b] text-[#1e1713]"
                      : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#4a3b32]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#4a3b32] bg-[#16110e] text-[10px] uppercase tracking-wide text-[#a39081]">
                  <th className="px-4 py-2.5">Platform</th>
                  <th className="px-4 py-2.5">Sheet / Resource</th>
                  <th className="px-4 py-2.5">Tag</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>

              <tbody>
                {filteredResources.map((resource) => (
                  <tr
                    key={resource.title}
                    className="border-b border-[#4a3b32] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-[#c89b7b]">
                      {resource.platform}
                    </td>

                    <td className="px-4 py-2.5 text-[#f5efe6]">
                      {resource.title}
                    </td>

                    <td className="px-4 py-2.5 text-xs text-[#a39081]">
                      {resource.tag}
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#c89b7b] hover:underline"
                      >
                        Open <ArrowIcon />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {cpTab === "unsolved" && (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <div className="mb-5">
            <h2 className="font-bold text-[#f5efe6]">Unsolved Questions</h2>
            <p className="mt-1 text-xs text-[#a39081]">
              Open the question and submit your solution link beside it.
            </p>
          </div>

          {challenges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#4a3b32] p-8 text-center text-sm text-[#a39081]">
              No unsolved questions assigned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge._id}
                  className="rounded-xl border border-[#4a3b32] bg-[#16110e] p-4"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#f5efe6]">
                          {challenge.title}
                        </h3>

                        <span className="rounded-full bg-[#c89b7b]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#c89b7b]">
                          {challenge.platform}
                        </span>
                      </div>

                      {challenge.description && (
                        <p className="mt-2 text-xs leading-5 text-[#a39081]">
                          {challenge.description}
                        </p>
                      )}

                      {challenge.problemUrl && (
                        <a
                          href={challenge.problemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-xs font-semibold text-[#c89b7b] hover:underline"
                        >
                          Open Question <ArrowIcon />
                        </a>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-[380px]">
                      <input
                        type="url"
                        className={field}
                        placeholder="Paste your solution link"
                        value={solutionLinks[challenge._id] || ""}
                        onChange={(e) =>
                          setSolutionLinks((prev) => ({
                            ...prev,
                            [challenge._id]: e.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        disabled={submittingId === challenge._id}
                        onClick={() => submitSolution(challenge)}
                        className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingId === challenge._id
                          ? "Submitting..."
                          : "Submit Solution"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
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
      section.topics.some((topic) => topic.toLowerCase().includes(query)) ||
      section.items.some((item) =>
        item.title.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon />

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
                    className="rounded-xl border border-[#4a3b32] p-4 text-sm text-[#f5efe6] transition hover:border-[#c89b7b] hover:bg-[#16110e]"
                  >
                    {item.title}
                    <ArrowIcon />
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

      {tab === "cp" ? <CpTab user={user} /> : <DevTab />}
    </div>
  );
}