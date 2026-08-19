// client/src/pages/MentorAnnouncements.jsx
import React, { useState } from "react";

export default function MentorAnnouncements() {
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: "Bootcamp Orientation", date: "August 18, 2026", message: "Welcome all mentors and students to the new session." },
    { id: 2, title: "Submission Deadline", date: "August 20, 2026", message: "Please make sure to submit your React router assignments on time." },
  ]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handlePost = (e) => {
    e.preventDefault();
    if (!title || !message) return;
    const newAnnouncement = {
      id: announcements.length + 1,
      title,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      message,
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-wide text-[#f5efe6]">Announcements</h1>
        <p className="text-xs text-[#a39081]">Post announcements and broadcast updates to your students</p>
      </div>

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
            className="px-4 py-2 bg-[#c89b7b] text-[#1e1713] font-bold rounded-lg hover:bg-[#b58868] transition text-xs"
          >
            Publish Announcement
          </button>
        </form>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#c89b7b]">Recent Broadcasts</h2>
        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item.id} className="bg-[#2d231d] border border-[#4a3b32] rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#f5efe6]">{item.title}</h3>
                <span className="text-[10px] text-[#a39081]">{item.date}</span>
              </div>
              <p className="text-xs text-[#a39081]">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}