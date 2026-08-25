import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const field = "w-full rounded-lg border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6]";
const emptyHighlight = { name: "", detail: "", category: "alumni", cohort: "", achievement: "" };
const emptyBadge = { title: "", description: "", icon: "*", metric: "submissions", threshold: 1 };

export default function AdminCommunityPage() {
  const [highlights, setHighlights] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [highlight, setHighlight] = useState(emptyHighlight);
  const [badge, setBadge] = useState(emptyBadge);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [communityResponse, achievementResponse] = await Promise.all([axiosInstance.get("/community"), axiosInstance.get("/achievements")]);
      setHighlights(communityResponse.data.highlights || []);
      setAchievements(achievementResponse.data.achievements || []);
    } catch (error) { setMessage(error.response?.data?.message || "Could not load community settings."); }
  };
  useEffect(() => {
    Promise.all([axiosInstance.get("/community"), axiosInstance.get("/achievements")]).then(([communityResponse, achievementResponse]) => {
      setHighlights(communityResponse.data.highlights || []);
      setAchievements(achievementResponse.data.achievements || []);
    }).catch((error) => setMessage(error.response?.data?.message || "Could not load community settings."));
  }, []);

  const createHighlight = async (event) => { event.preventDefault(); try { await axiosInstance.post("/community", highlight); setHighlight(emptyHighlight); setMessage("Community highlight added."); load(); } catch (error) { setMessage(error.response?.data?.message || "Could not add highlight."); } };
  const createBadge = async (event) => { event.preventDefault(); try { await axiosInstance.post("/achievements", { ...badge, threshold: Number(badge.threshold) }); setBadge(emptyBadge); setMessage("Achievement definition added."); load(); } catch (error) { setMessage(error.response?.data?.message || "Could not add achievement."); } };
  const remove = async (path, id) => { if (!window.confirm("Delete this item?")) return; try { await axiosInstance.delete(`${path}/${id}`); setMessage("Item deleted."); load(); } catch (error) { setMessage(error.response?.data?.message || "Could not delete item."); } };

  return <div className="space-y-7"><header><p className="text-xs uppercase tracking-widest text-[#c89b7b]">Admin settings</p><h1 className="mt-2 text-3xl font-extrabold">Community & achievements</h1><p className="mt-1 text-sm text-[#a39081]">Publish approved alumni highlights, Hall of Fame records, and configurable student badges.</p></header>{message && <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-300">{message}</p>}<div className="grid gap-6 xl:grid-cols-2"><form onSubmit={createHighlight} className="space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"><h2 className="text-xl font-bold">Add community highlight</h2><input className={field} placeholder="Name" value={highlight.name} onChange={(event) => setHighlight({ ...highlight, name: event.target.value })} required /><textarea className={field} placeholder="Public description" value={highlight.detail} onChange={(event) => setHighlight({ ...highlight, detail: event.target.value })} required /><select className={field} value={highlight.category} onChange={(event) => setHighlight({ ...highlight, category: event.target.value })}><option value="alumni">Alumni</option><option value="hall_of_fame">Hall of Fame</option></select><input className={field} placeholder="Cohort (optional)" value={highlight.cohort} onChange={(event) => setHighlight({ ...highlight, cohort: event.target.value })} /><input className={field} placeholder="Achievement (optional)" value={highlight.achievement} onChange={(event) => setHighlight({ ...highlight, achievement: event.target.value })} /><button className="rounded-lg bg-[#c89b7b] px-4 py-2 text-sm font-bold text-[#1e1713]">Publish highlight</button></form><form onSubmit={createBadge} className="space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"><h2 className="text-xl font-bold">Define achievement badge</h2><input className={field} placeholder="Badge title" value={badge.title} onChange={(event) => setBadge({ ...badge, title: event.target.value })} required /><textarea className={field} placeholder="Badge description" value={badge.description} onChange={(event) => setBadge({ ...badge, description: event.target.value })} required /><input className={field} maxLength="4" placeholder="Icon" value={badge.icon} onChange={(event) => setBadge({ ...badge, icon: event.target.value })} /><select className={field} value={badge.metric} onChange={(event) => setBadge({ ...badge, metric: event.target.value })}><option value="submissions">Submission count</option><option value="completed_topics_ratio">Completed topic ratio</option><option value="coding_activities">Coding activity count</option><option value="attendance_percentage">Attendance percentage</option></select><input className={field} type="number" min="0" step="0.01" placeholder="Threshold" value={badge.threshold} onChange={(event) => setBadge({ ...badge, threshold: event.target.value })} required /><button className="rounded-lg bg-[#c89b7b] px-4 py-2 text-sm font-bold text-[#1e1713]">Create badge</button></form></div><div className="grid gap-6 xl:grid-cols-2"><section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"><h2 className="text-xl font-bold">Published highlights</h2><div className="mt-4 space-y-2">{highlights.map((item) => <div key={item._id} className="flex items-start justify-between gap-3 border-b border-[#4a3b32] py-3"><div><p className="font-bold">{item.name}</p><p className="text-xs text-[#a39081]">{item.category === "hall_of_fame" ? "Hall of Fame" : "Alumni"} · {item.detail}</p></div><button type="button" onClick={() => remove("/community", item._id)} className="text-xs text-rose-300">Delete</button></div>)}</div></section><section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"><h2 className="text-xl font-bold">Achievement definitions</h2><div className="mt-4 space-y-2">{achievements.map((item) => <div key={item._id} className="flex items-start justify-between gap-3 border-b border-[#4a3b32] py-3"><div><p className="font-bold">{item.icon} {item.title}</p><p className="text-xs text-[#a39081]">{item.metric} ≥ {item.threshold}</p></div><button type="button" onClick={() => remove("/achievements", item._id)} className="text-xs text-rose-300">Delete</button></div>)}</div></section></div></div>;
}
