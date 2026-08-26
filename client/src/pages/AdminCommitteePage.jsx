import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const field = "w-full rounded-lg border border-[#e5eaf2] bg-white px-3 py-2 text-sm text-[#12284a] focus:border-[#d20a2e] focus:outline-none";

function timeText(value) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminCommitteePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [adminCount, setAdminCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await axiosInstance.get("/admin-committee/messages");
      setMessages(response.data.messages || []);
      setAdminCount(response.data.adminCount || 0);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load Admin Committee messages.");
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      if (editing) {
        await axiosInstance.put(`/admin-committee/messages/${editing._id}`, { message: text });
      } else {
        await axiosInstance.post("/admin-committee/messages", { message: text });
      }
      setDraft("");
      setEditing(null);
      setMessage("");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save message.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axiosInstance.delete(`/admin-committee/messages/${id}`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete message.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#d20a2e]">Administration</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#12284a]">Admin Committee</h1>
        <p className="mt-1 text-sm text-[#697386]">Private group chat • Administrators only{adminCount ? ` • ${adminCount} administrators` : ""}</p>
      </header>
      {message && <p className="rounded-xl border border-[#e5eaf2] bg-white p-3 text-sm text-red-600">{message}</p>}
      <section className="flex min-h-[min(640px,calc(100vh-250px))] flex-col rounded-2xl border border-[#e5eaf2] bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {!messages.length && <div className="rounded-xl border border-dashed border-[#e5eaf2] p-8 text-center text-sm text-[#697386]">No messages yet<br />Start the discussion with the Admin Committee.</div>}
          {messages.map((item) => {
            const mine = String(item.sender?._id) === String(user?._id);
            return <article key={item._id} className={`max-w-3xl rounded-xl border p-4 ${mine ? "ml-auto border-[#d20a2e]/30 bg-[#fff5f6]" : "border-[#e5eaf2] bg-[#f6f8fc]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <strong className="text-[#12284a]">{item.sender?.fullName || "Administrator"}</strong>
                <time className="text-[#697386]">{timeText(item.createdAt)}{item.edited ? " • edited" : ""}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-[#12284a]">{item.message}</p>
              {mine && <div className="mt-3 flex gap-3 text-xs"><button type="button" className="text-[#d20a2e]" onClick={() => { setEditing(item); setDraft(item.message); }}>Edit</button><button type="button" className="text-[#dc2626]" onClick={() => remove(item._id)}>Delete</button></div>}
            </article>;
          })}
        </div>
        <form onSubmit={submit} className="border-t border-[#e5eaf2] p-4">
          {editing && <button type="button" className="mb-2 text-xs text-[#697386]" onClick={() => { setEditing(null); setDraft(""); }}>Cancel editing</button>}
          <div className="flex gap-2"><input className={field} value={draft} maxLength={2000} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." aria-label="Write a message" /><button disabled={busy || !draft.trim()} className="rounded-lg bg-[#d20a2e] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{editing ? "Save" : "Send"}</button></div>
        </form>
      </section>
    </div>
  );
}
