// client/src/pages/MentorAnnouncements.jsx
import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

export default function MentorAnnouncements() {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/announcements");
      setAnnouncements(response.data?.announcements || []);
    } catch (err) {
      console.error("Error loading announcements:", err);
      setError(err.response?.data?.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setPosting(true);
      setError("");

      // Mentors are only allowed to target "students" or "batch"
      // (the backend rejects "all" / "mentors" for the mentor role).
      await axiosInstance.post("/announcements", {
        title: title.trim(),
        content: message.trim(),
        targetAudience: "students",
      });

      setTitle("");
      setMessage("");
      await loadAnnouncements();
    } catch (err) {
      console.error("Error posting announcement:", err);
      setError(err.response?.data?.message || "Unable to post announcement.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    try {
      setError("");
      await axiosInstance.delete(`/announcements/${id}`);
      await loadAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError(err.response?.data?.message || "Unable to delete announcement.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Announcements</h1>
        <p className="text-xs text-[#a39081]">Post announcements and broadcast updates to your students</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-700 bg-red-950/40 px-5 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#c89b7b]">Post New Announcement</h2>
        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#a39081] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter announcement title..."
              className="w-full bg-[#2d231d] border border-[#4a3b32] rounded-lg px-4 py-2 text-xs text-[#f5efe6] focus:outline-none focus:border-[#c89b7b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#a39081] mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows="3"
              className="w-full bg-[#2d231d] border border-[#4a3b32] rounded-lg px-4 py-2 text-xs text-[#f5efe6] focus:outline-none focus:border-[#c89b7b]"
            />
          </div>
          <button
            type="submit"
            disabled={posting}
            className="px-4 py-2 bg-[#c89b7b] text-[#1e1713] font-bold rounded-lg hover:bg-[#b58868] transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {posting ? "Publishing..." : "Publish Announcement"}
          </button>
        </form>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#c89b7b]">Recent Broadcasts</h2>

        {loading ? (
          <p className="text-xs text-[#a39081]">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-xs text-[#a39081]">No announcements posted yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item._id} className="bg-[#2d231d] border border-[#4a3b32] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-[#f5efe6]">{item.title}</h3>
                  <span className="text-[10px] text-[#a39081]">{formatDate(item.publishDate)}</span>
                </div>
                <p className="text-xs text-[#a39081]">{item.content}</p>
                <div className="flex justify-between items-center text-[10px] text-[#66564b]">
                  <span>
                    {item.targetAudience}
                    {item.batch?.name ? ` · ${item.batch.name}` : ""}
                  </span>
                  {String(item.author?._id) === String(user?._id) && (
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-400 hover:text-red-300 font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}