import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const card = "rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5";
const emptyStats = { assignments: 0, submissions: 0, graded: 0, attendance: 0, progress: 0 };

function Metric({ label, value, detail }) {
  return <div className={card}><p className="text-xs uppercase tracking-widest text-[#a39081]">{label}</p><p className="mt-3 text-3xl font-extrabold text-[#f5efe6]">{value}</p><p className="mt-1 text-xs text-[#c89b7b]">{detail}</p></div>;
}

function Badge({ icon, title, description, earned }) {
  return <article className={`${card} ${earned ? "border-[#c89b7b]" : "opacity-55"}`}><div className="flex items-start gap-3"><span className="text-3xl" aria-hidden="true">{icon}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-[#a39081]">{description}</p><p className="mt-3 text-[10px] uppercase tracking-widest text-[#c89b7b]">{earned ? "Earned" : "In progress"}</p></div></div></article>;
}

export default function InsightsPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  const [tab, setTab] = useState("overview");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState("");
  const exportPdf = async () => { const response = await axiosInstance.get("/reports/pdf", { responseType: "blob" }); const url = URL.createObjectURL(response.data); const link = document.createElement("a"); link.href = url; link.download = `astumsj-${role}-report.pdf`; link.click(); URL.revokeObjectURL(url); };

  useEffect(() => {
    const requests = [axiosInstance.get("/sessions"), axiosInstance.get("/coding/leaderboard"), axiosInstance.get("/assignments"), axiosInstance.get("/announcements")];
    if (role === "admin") requests.push(axiosInstance.get("/users/stats"));
    if (role === "mentor") requests.push(axiosInstance.get("/mentors/dashboard"));
    if (role === "student") requests.push(axiosInstance.get("/students/dashboard"), axiosInstance.get("/coding/stats"), axiosInstance.get("/students/achievements"));
    Promise.all(requests).then((responses) => {
      setSessions(responses[0].data.sessions || []);
      setLeaderboard(responses[1].data.leaderboard || []);
      setAssignments(responses[2].data.assignments || []);
      setAnnouncements(responses[3].data.announcements || []);
      if (role === "admin") setData({ stats: responses[4].data.stats || emptyStats });
      if (role === "mentor") setData({ dashboard: responses[4].data.dashboard || {} });
      if (role === "student") {
        setData({ dashboard: responses[4].data.dashboard || {}, coding: responses[5].data.stats?.[user._id] || {} });
        setAchievements(responses[6].data.achievements || []);
      }
    }).catch((requestError) => setError(requestError.response?.data?.message || "Could not load insights."));
  }, [role, user?._id]);

  const studentDashboard = data?.dashboard;
  const studentCoding = data?.coding || {};
  const studentProgress = studentDashboard?.totalTopics ? Math.round((studentDashboard.completedTopics / studentDashboard.totalTopics) * 100) : 0;
  const studentActivities = Object.values(studentCoding).reduce((total, item) => total + (item?.count || 0), 0);
  const mentorStudents = data?.dashboard?.assignedStudents || [];
  const mentorAverageAttendance = mentorStudents.length ? Math.round(mentorStudents.reduce((total, item) => total + item.attendancePercentage, 0) / mentorStudents.length) : 0;
  const calendarItems = useMemo(() => [
    ...sessions.map((item) => ({ date: item.startsAt, title: item.title, type: "Session" })),
    ...assignments.map((item) => ({ date: item.deadline, title: item.title, type: "Task" })),
    ...announcements.map((item) => ({ date: item.publishDate, title: item.title, type: "Announcement" })),
  ].filter((item) => item.date), [sessions, assignments, announcements]);
  const calendarStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarDays = Array.from({ length: new Date(calendarStart.getFullYear(), calendarStart.getMonth() + 1, 0).getDate() }, (_, index) => index + 1);
  const leadingDays = Array.from({ length: calendarStart.getDay() }, () => null);

  if (error) return <p className="rounded-xl border border-rose-900 bg-[#1e1713] p-4 text-rose-300">{error}</p>;
  if (!data) return <p className="text-[#a39081]">Loading insights...</p>;

  return <div className="space-y-7 print:bg-white print:text-black">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#c89b7b]">Performance center</p><h1 className="mt-2 text-3xl font-extrabold">Reports & analytics</h1><p className="mt-1 text-sm text-[#a39081]">Your {role} view of progress, activity, achievements, and scheduled learning.</p></div><button type="button" onClick={exportPdf} className="rounded-lg bg-[#c89b7b] px-4 py-2 text-sm font-bold text-[#1e1713] print:hidden">Export PDF</button></header>
    <nav className="flex flex-wrap gap-2 border-b border-[#4a3b32] pb-3 print:hidden">{["overview", "leaderboard", "calendar", ...(role === "student" ? ["badges"] : [])].map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm capitalize ${tab === item ? "bg-[#c89b7b] font-bold text-[#1e1713]" : "text-[#a39081] hover:bg-[#2d231d]"}`}>{item}</button>)}</nav>

    {tab === "overview" && <div className="space-y-6">
      {role === "admin" && <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Students" value={data.stats.students || 0} detail="active accounts" /><Metric label="Mentors" value={data.stats.mentors || 0} detail="active accounts" /><Metric label="Batches" value={data.stats.batches || 0} detail="organized cohorts" /><Metric label="Attendance" value={`${data.stats.attendancePercentage || 0}%`} detail="overall rate" /></section><section className={card}><h2 className="text-xl font-bold">Bootcamp health</h2><p className="mt-2 text-sm text-[#a39081]">{data.stats.assignments || 0} assignments and {data.stats.submissions || 0} submissions are currently tracked. {data.stats.pendingGrading || 0} submissions await grading.</p></section></>}
      {role === "mentor" && <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Assigned learners" value={mentorStudents.length} detail="active students" /><Metric label="Average attendance" value={`${mentorAverageAttendance}%`} detail="assigned learners" /><Metric label="Needs review" value={data.dashboard.pendingGrading?.length || 0} detail="pending submissions" /><Metric label="At risk" value={data.dashboard.atRiskStudents?.length || 0} detail="learners to support" /></section><section className={card}><h2 className="text-xl font-bold">Mentor report</h2><p className="mt-2 text-sm text-[#a39081]">Use these signals to prioritize feedback, attendance follow-up, and support for your assigned learners.</p></section></>}
      {role === "student" && <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Attendance" value={`${studentDashboard.attendancePercentage || 0}%`} detail="your sessions" /><Metric label="Progress" value={`${studentProgress}%`} detail={`${studentDashboard.completedTopics || 0}/${studentDashboard.totalTopics || 0} topics`} /><Metric label="Average grade" value={`${studentDashboard.averageGrade || 0}%`} detail="graded work" /><Metric label="Coding activity" value={studentActivities} detail="recorded activities" /></section><section className={card}><h2 className="text-xl font-bold">Personal report</h2><p className="mt-2 text-sm text-[#a39081]">Keep building consistent habits: attend sessions, submit before deadlines, and use mentor feedback to improve your next attempt.</p></section></>}
    </div>}

    {tab === "leaderboard" && <section className="space-y-4"><div><h2 className="text-xl font-bold">Coding leaderboard</h2><p className="mt-1 text-sm text-[#a39081]">Ranked by recorded coding activities. Only display-safe names and totals are shown.</p></div>{leaderboard.map((item, index) => <div key={item._id} className={`${card} flex items-center gap-4`}><span className="w-8 text-center text-xl font-extrabold text-[#c89b7b]">{index + 1}</span><div className="flex-1"><p className="font-bold">{item.fullName}</p><p className="text-xs text-[#a39081]">{item.platforms} platforms active</p></div><p className="text-2xl font-extrabold text-[#d8b493]">{item.activities}</p></div>)}{!leaderboard.length && <p className={card}>No coding activity has been recorded yet.</p>}</section>}

    {tab === "calendar" && <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Learning calendar</h2><p className="mt-1 text-sm text-[#a39081]">Sessions, task deadlines, and announcements for {calendarStart.toLocaleDateString(undefined, { month: "long", year: "numeric" })}.</p></div><div className="flex gap-2"><button type="button" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border border-[#4a3b32] px-3 py-2 text-sm text-[#d8b493] hover:bg-[#2d231d]" aria-label="Previous month">Previous</button><button type="button" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border border-[#4a3b32] px-3 py-2 text-sm text-[#d8b493] hover:bg-[#2d231d]" aria-label="Next month">Next</button></div></div><div className={`${card} overflow-x-auto`}><div className="grid min-w-[560px] grid-cols-7 gap-2 text-center text-xs text-[#a39081]">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <p key={day} className="pb-2 font-bold">{day}</p>)}{[...leadingDays, ...calendarDays].map((day, index) => { const date = day ? new Date(calendarStart.getFullYear(), calendarStart.getMonth(), day) : null; const items = date ? calendarItems.filter((item) => new Date(item.date).toDateString() === date.toDateString()) : []; return <div key={`${day || "empty"}-${index}`} className={`min-h-24 rounded-lg border p-2 text-left ${day ? "border-[#4a3b32] bg-[#16110e]" : "border-transparent"}`}>{day && <><p className="font-bold text-[#d8b493]">{day}</p><div className="mt-1 space-y-1">{items.map((item) => <p key={`${item.type}-${item.title}`} className="truncate rounded bg-[#2d231d] px-1 py-0.5 text-[10px] text-[#c89b7b]" title={`${item.type}: ${item.title}`}><b>{item.type}:</b> {item.title}</p>)}</div></>}</div>; })}</div></div></section>}

    {tab === "badges" && role === "student" && <section className="space-y-4"><div><h2 className="text-xl font-bold">Achievement badges</h2><p className="mt-1 text-sm text-[#a39081]">Achievements calculated from your recorded bootcamp activity.</p></div><div className="grid gap-4 md:grid-cols-2">{achievements.map((badge) => <Badge key={badge.title} {...badge} />)}</div></section>}
  </div>;
}
