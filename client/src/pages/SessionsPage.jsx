import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const field = "w-full rounded-lg border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";
const emptyForm = { title: "", description: "", meetLink: "", startsAt: "", endsAt: "", batchId: "" };

export default function SessionsPage() {
  const { user } = useAuth(); const navigate = useNavigate(); const [sessions, setSessions] = useState([]); const [batches, setBatches] = useState([]); const [showCreate, setShowCreate] = useState(false); const [form, setForm] = useState(emptyForm); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const canCreate = user?.role === "admin";

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => { Promise.all([axiosInstance.get("/sessions", { params: { _t: Date.now() } }), canCreate ? axiosInstance.get("/batches", { params: { _t: Date.now() } }) : Promise.resolve({ data: { batches: [] } })]).then(([sessionResponse, batchResponse]) => { setSessions(sessionResponse.data.sessions || []); setBatches(batchResponse.data.batches || []); }).catch((error) => setMessage(error.response?.data?.message || "Could not load sessions.")); }, [canCreate]);
  const deleteSession = async (session) => { if (!window.confirm(`Delete "${session.title}"? Its tasks and attendance will also be deleted.`)) return; try { await axiosInstance.delete(`/sessions/${session._id}`); setSessions((current) => current.filter((item) => item._id !== session._id)); setMessage("Session deleted successfully."); } catch (error) { setMessage(error.response?.data?.message || "Could not delete session."); } };
  const createSession = async (event) => { event.preventDefault(); if (busy) return; setBusy(true); setMessage("Creating session..."); try {
    const created = await axiosInstance.post("/sessions", form);
    setShowCreate(false);
    setForm(emptyForm);
    if (created.data?.session) {
      setSessions((current) => [created.data.session, ...current.filter((item) => item._id !== created.data.session._id)]);
    }
    // Refresh as well so the list is immediately consistent with the database.
    const response = await axiosInstance.get("/sessions", { params: { _t: Date.now() } });
    setSessions(response.data.sessions || []);
    setMessage("Session created. Students and mentors were notified.");
  } catch (error) { setMessage(error.response?.data?.message || "Could not create session."); } finally { setBusy(false); } };
  return <div className="space-y-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#c89b7b]">Live learning</p><h1 className="text-3xl font-extrabold">Sessions</h1><p className="mt-1 text-sm text-[#a39081]">Select a session to view its resources, tasks, feedback and attendance.</p></div>{canCreate && <button onClick={() => setShowCreate(true)} className="rounded-lg bg-[#c89b7b] px-4 py-3 text-sm font-bold text-[#1e1713]">+ Create session</button>}</header>{message && <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-300">{message}</p>}<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{sessions.map((session) => <article key={session._id} onClick={() => navigate(`/sessions/${session._id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate(`/sessions/${session._id}`); }} role="button" tabIndex={0} className="min-h-44 cursor-pointer rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#c89b7b]"><div className="flex items-start justify-between gap-3"><h2 className="font-bold">{session.title}</h2><span className="text-xs text-[#c89b7b]">{session.batch?.name}</span></div><p className="mt-4 line-clamp-3 text-sm text-[#d8c5b7]">{session.description || "No description."}</p><div className="mt-4 flex items-end justify-between gap-3"><p className="text-xs text-[#a39081]">{new Date(session.startsAt).toLocaleString()} - {new Date(session.endsAt).toLocaleString()}</p>{canCreate && <button type="button" onClick={(event) => { event.stopPropagation(); deleteSession(session); }} className="shrink-0 rounded-lg bg-rose-700/70 px-3 py-1.5 text-xs font-bold text-white">Delete</button>}</div></article>)}</section>{!sessions.length && <div className="rounded-2xl border border-dashed border-[#4a3b32] p-12 text-center text-sm text-[#a39081]">No sessions are available.</div>}{showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><form onSubmit={createSession} className="w-full max-w-2xl space-y-4 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6"><div className="flex justify-between"><h2 className="text-2xl font-bold">Create session</h2><button type="button" onClick={() => setShowCreate(false)}>Close</button></div><div className="grid gap-3 md:grid-cols-2"><input className={field} placeholder="Session title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/><select className={field} required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}><option value="">Select batch</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}</select><textarea className={field} placeholder="Session description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/><input className={field} placeholder="Google Meet link" type="url" pattern="https://meet.google.com/.*" required value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })}/><label className="text-xs text-[#a39081]">Start date and time<input className={field} type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}/></label><label className="text-xs text-[#a39081]">End date and time<input className={field} type="datetime-local" required value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}/></label></div><button className="rounded-lg bg-[#c89b7b] px-4 py-2 font-bold text-[#1e1713]">Create and notify</button></form></div>}</div>;
}
