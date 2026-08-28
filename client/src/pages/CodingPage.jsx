import { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const field = "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";
const platforms = ["leetcode", "codeforces", "github"];
const emptyForm = { title: "", platform: "leetcode", problemUrl: "", description: "", dueDate: "", assignedStudents: [] };
const emptyActivity = { platform: "leetcode", url: "", note: "", challenge: "" };

const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not submitted";

export default function CodingPage() {
  const { user } = useAuth();
  const [studentSummary, setStudentSummary] = useState([]);
  const [stats, setStats] = useState({});
  const [challenges, setChallenges] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [activity, setActivity] = useState(emptyActivity);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [statsResponse, challengesResponse] = await Promise.all([
        axiosInstance.get("/coding/stats"),
        axiosInstance.get("/coding/challenges"),
      ]);
      setStats(statsResponse.data.stats || {});
      setStudentSummary(statsResponse.data.students || []);
      setChallenges(challengesResponse.data.challenges || []);
      if (user?.role === "admin") {
        const studentsResponse = await axiosInstance.get("/users?role=student");
        setStudents(studentsResponse.data.users || []);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load coding data.");
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const mentorTotals = useMemo(() => platforms.map((platform) => {
    const values = Object.values(stats).map((studentStats) => studentStats[platform] || {});
    return {
      platform,
      count: values.reduce((total, value) => total + (value.count || 0), 0),
      streak: values.reduce((longest, value) => Math.max(longest, value.streak || 0), 0),
    };
  }), [stats]);

  const createChallenge = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.post("/coding/challenges", form);
      setForm(emptyForm);
      setMessage("Challenge assigned.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create challenge.");
    }
  };

  const submitActivity = async (event) => {
    event.preventDefault();
    try {
      await axiosInstance.post("/coding/activity", activity);
      setActivity(emptyActivity);
      setMessage("Coding activity recorded.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not record activity.");
    }
  };

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-3xl font-extrabold">Coding Practice</h1>
        <p className="text-xs text-[#a39081]">
          {user?.role === "mentor" ? "Monitor assigned challenges and your students' coding progress." : "Track LeetCode, Codeforces and GitHub activity, streaks and assigned problems."}
        </p>
      </header>

      {message && <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">{message}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        {platforms.map((platform) => {
          const value = user?.role === "mentor" ? mentorTotals.find((item) => item.platform === platform) : stats[user?._id]?.[platform];
          return (
            <div key={platform} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
              <p className="text-xs uppercase text-[#a39081]">{platform}</p>
              <p className="mt-2 text-3xl font-bold text-[#c89b7b]">{value?.count || 0}</p>
              <p className="text-xs text-[#a39081]">activities, {value?.streak || 0} day streak</p>
            </div>
          );
        })}
      </section>

      {user?.role === "mentor" && (
        <section className="overflow-x-auto rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
          <h2 className="font-bold">Student Coding Progress</h2>
          <table className="mt-4 w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[#4a3b32] text-xs uppercase text-[#a39081]">
              <tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Solved</th><th className="px-3 py-3">GitHub streak</th><th className="px-3 py-3">LeetCode streak</th><th className="px-3 py-3">Codeforces streak</th></tr>
            </thead>
            <tbody>
              {studentSummary.map((student) => <tr key={student._id} className="border-b border-[#4a3b32] last:border-0"><td className="px-3 py-4 font-semibold">{student.fullName}</td><td className="px-3 py-4 text-[#c89b7b]">{student.solvedChallenges} / {student.totalChallenges}</td><td className="px-3 py-4">{student.stats?.github?.streak || 0} days</td><td className="px-3 py-4">{student.stats?.leetcode?.streak || 0} days</td><td className="px-3 py-4">{student.stats?.codeforces?.streak || 0} days</td></tr>)}
            </tbody>
          </table>
          {studentSummary.length === 0 && <p className="mt-4 text-sm text-[#a39081]">No assigned students found.</p>}
        </section>
      )}

      {user?.role === "student" && (
        <form onSubmit={submitActivity} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 space-y-3">
          <h2 className="font-bold">Record Completed Problem / Activity</h2>
          <select className={field} value={activity.platform} onChange={(event) => setActivity({ ...activity, platform: event.target.value })}>
            <option value="leetcode">LeetCode</option><option value="codeforces">Codeforces</option><option value="github">GitHub</option>
          </select>
          <input className={field} placeholder="Problem / commit / repository URL" value={activity.url} onChange={(event) => setActivity({ ...activity, url: event.target.value })} />
          <textarea className={field} placeholder="Notes (optional)" value={activity.note} onChange={(event) => setActivity({ ...activity, note: event.target.value })} />
          <button className="rounded-xl bg-[#c89b7b] px-5 py-2 text-xs font-bold text-[#1e1713]">Record Activity</button>
        </form>
      )}

      {user?.role === "admin" && (
        <form onSubmit={createChallenge} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 space-y-3">
          <h2 className="font-bold">Assign Coding Problem</h2>
          <input className={field} placeholder="Challenge title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <select className={field} value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}><option value="leetcode">LeetCode</option><option value="codeforces">Codeforces</option><option value="github">GitHub</option></select>
          <input className={field} placeholder="Problem URL" value={form.problemUrl} onChange={(event) => setForm({ ...form, problemUrl: event.target.value })} />
          <textarea className={field} placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <select multiple className={`${field} h-32`} value={form.assignedStudents} onChange={(event) => setForm({ ...form, assignedStudents: [...event.target.selectedOptions].map((option) => option.value) })} required>
            {students.map((student) => <option key={student._id} value={student._id}>{student.fullName} - {student.email}</option>)}
          </select>
          <button className="rounded-xl bg-[#c89b7b] px-5 py-2 text-xs font-bold text-[#1e1713]">Assign Problem</button>
        </form>
      )}

      <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6">
        <h2 className="font-bold">{user?.role === "mentor" ? "Assigned Problems and Student Submissions" : "Assigned Problems"}</h2>
        <div className="mt-4 space-y-3">
          {challenges.map((challenge) => (
            <article key={challenge._id} className="rounded-xl border border-[#4a3b32] p-4">
              <div className="flex flex-wrap items-center gap-2"><b>{challenge.title}</b><span className="rounded-full bg-[#c89b7b]/10 px-2 py-1 text-[10px] uppercase text-[#c89b7b]">{challenge.platform}</span></div>
              <p className="mt-1 text-xs text-[#a39081]">{challenge.description || "No description provided."}</p>
              {challenge.problemUrl && <a href={challenge.problemUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[#c89b7b]">Open problem</a>}
              {user?.role === "mentor" && <div className="mt-3 space-y-2 border-t border-[#4a3b32] pt-3">
                {(challenge.submissions || []).length === 0 ? <p className="text-xs text-amber-400">No student submissions yet.</p> : challenge.submissions.map((submission) => <div key={`${challenge._id}-${submission.student?._id}`} className="rounded-lg bg-[#16110e] p-3 text-xs"><div className="flex flex-wrap justify-between gap-2"><b>{submission.student?.fullName || "Student"}</b><span className="text-[#a39081]">{formatDate(submission.completedAt)}</span></div><p className="mt-1 text-[#a39081]">Attempts: {submission.attempts} | Time: {submission.timeSpentMinutes ?? "Not recorded"} minutes</p>{submission.url && <a href={submission.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-[#c89b7b]">{submission.url}</a>}</div>)}</div>}
            </article>
          ))}
          {challenges.length === 0 && <p className="text-sm text-[#a39081]">No coding challenges assigned yet.</p>}
        </div>
      </section>
    </div>
  );
}
