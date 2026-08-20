import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  EDIT THESE — hardcoded until a backend "resources" module exists.  */
/*  Add/remove rows freely; the table/sections just render this data.  */
/* ------------------------------------------------------------------ */

const CP_RESOURCES = [
  { platform: "LeetCode", title: "Blind 75", tag: "Core Patterns", url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions" },
  { platform: "LeetCode", title: "NeetCode 150", tag: "Core Patterns", url: "https://neetcode.io/practice" },
  { platform: "LeetCode", title: "Top Interview 150", tag: "Interview Prep", url: "https://leetcode.com/studyplan/top-interview-150/" },
  { platform: "Codeforces", title: "Div 2 Problemset", tag: "Contest Practice", url: "https://codeforces.com/problemset?tags=div2" },
  { platform: "Codeforces", title: "A2OJ Ladders", tag: "Rating Ladder", url: "https://a2oj.com/ladders" },
  { platform: "Codeforces", title: "Codeforces EDU", tag: "Algorithms Course", url: "https://codeforces.com/edu/courses" },
];

const DEV_RESOURCES = [
  {
    topic: "HTML / CSS",
    items: [
      { title: "Kevin Powell — CSS Channel", url: "https://www.youtube.com/@KevinPowell" },
      { title: "freeCodeCamp — Responsive Web Design", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/" },
    ],
  },
  {
    topic: "JavaScript",
    items: [
      { title: "Namaste JavaScript — Akshay Saini", url: "https://www.youtube.com/@akshaymarch7" },
      { title: "JavaScript.info", url: "https://javascript.info/" },
    ],
  },
  {
    topic: "React",
    items: [
      { title: "React Official Docs", url: "https://react.dev/learn" },
      { title: "Net Ninja — React Playlist", url: "https://www.youtube.com/@NetNinja" },
    ],
  },
  {
    topic: "Node.js / Express",
    items: [
      { title: "Traversy Media — Node Crash Course", url: "https://www.youtube.com/@TraversyMedia" },
      { title: "Express Official Docs", url: "https://expressjs.com/" },
    ],
  },
  {
    topic: "MongoDB",
    items: [
      { title: "MongoDB Official University", url: "https://learn.mongodb.com/" },
    ],
  },
  {
    topic: "Git / GitHub",
    items: [
      { title: "Git & GitHub Crash Course — freeCodeCamp", url: "https://www.youtube.com/@freecodecamp" },
    ],
  },
];

/* ------------------------------------------------------------------ */

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";

const PLATFORM_FILTERS = ["All", "LeetCode", "Codeforces"];

function CpTab({ user }) {
  const [stats, setStats] = useState({});
  const [challenges, setChallenges] = useState([]);
  const [activity, setActivity] = useState({ platform: "leetcode", url: "", note: "" });
  const [msg, setMsg] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");

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

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/coding/activity", activity);
      setMsg("Coding activity recorded.");
      setActivity({ ...activity, url: "", note: "" });
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Could not record activity.");
    }
  };

  const filteredResources =
    platformFilter === "All"
      ? CP_RESOURCES
      : CP_RESOURCES.filter((r) => r.platform === platformFilter);

  return (
    <div className="space-y-7">
      {msg && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {msg}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {["leetcode", "codeforces", "github"].map((p) => (
          <div key={p} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
            <p className="text-xs uppercase text-[#a39081]">{p}</p>
            <p className="text-3xl font-bold text-[#c89b7b]">
              {stats[user?._id]?.[p]?.streak || 0} days
            </p>
            <p className="text-xs text-[#a39081]">
              {stats[user?._id]?.[p]?.count || 0} recorded activities
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <h2 className="font-bold text-[#f5efe6]">Record Completed Problem / Activity</h2>
        <select
          className={field}
          value={activity.platform}
          onChange={(e) => setActivity({ ...activity, platform: e.target.value })}
        >
          <option value="leetcode">LeetCode</option>
          <option value="codeforces">Codeforces</option>
          <option value="github">GitHub</option>
        </select>
        <input
          className={field}
          placeholder="Problem / commit / repository URL"
          value={activity.url}
          onChange={(e) => setActivity({ ...activity, url: e.target.value })}
        />
        <textarea
          className={field}
          placeholder="Notes (optional)"
          value={activity.note}
          onChange={(e) => setActivity({ ...activity, note: e.target.value })}
        />
        <button className="rounded-xl bg-[#c89b7b] px-5 py-2 text-xs font-bold text-[#1e1713]">
          Record Activity
        </button>
      </form>

      {challenges.length > 0 && (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-bold text-[#f5efe6]">Assigned Problems</h2>
          <div className="mt-4 space-y-3">
            {challenges.map((c) => (
              <div key={c._id} className="rounded-xl border border-[#4a3b32] p-4">
                <b className="text-[#f5efe6]">{c.title}</b>
                <span className="ml-2 text-[10px] uppercase text-[#c89b7b]">{c.platform}</span>
                <p className="text-xs text-[#a39081]">{c.description}</p>
                {c.problemUrl && (
                  <a href={c.problemUrl} target="_blank" rel="noreferrer" className="text-xs text-[#c89b7b]">
                    Open problem
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-[#f5efe6]">Practice Sheets</h2>
          <div className="flex gap-1.5">
            {PLATFORM_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                  platformFilter === p
                    ? "bg-[#c89b7b] text-[#1e1713]"
                    : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
                }`}
              >
                {p}
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
              {filteredResources.map((r) => (
                <tr key={r.title} className="border-b border-[#4a3b32] last:border-0">
                  <td className="px-4 py-2.5 text-[#c89b7b]">{r.platform}</td>
                  <td className="px-4 py-2.5 text-[#f5efe6]">{r.title}</td>
                  <td className="px-4 py-2.5 text-xs text-[#a39081]">{r.tag}</td>
                  <td className="px-4 py-2.5 text-right">
                    
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#c89b7b] hover:underline"
                    >
                      Open ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DevTab() {
  return (
    <div className="space-y-6">
      {DEV_RESOURCES.map((section) => (
        <section key={section.topic} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="mb-4 font-bold text-[#f5efe6]">{section.topic}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              
                key={item.title}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#4a3b32] p-4 text-sm text-[#f5efe6] transition hover:border-[#c89b7b] hover:bg-[#16110e]"
              >
                {item.title}
                <span className="ml-2 text-xs text-[#c89b7b]">↗</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("cp");

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-[#f5efe6]">Resources</h1>
        <p className="text-xs text-[#a39081]">
          Competitive programming practice and dev-track learning materials, all in one place.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { key: "cp", label: "CP" },
          { key: "dev", label: "Dev" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              tab === t.key
                ? "bg-[#c89b7b] text-[#1e1713]"
                : "border border-[#4a3b32] text-[#a39081] hover:text-[#f5efe6]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cp" ? <CpTab user={user} /> : <DevTab />}
    </div>
  );
}