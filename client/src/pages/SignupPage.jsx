import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const inputClass = "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-4 py-3 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none placeholder:text-[#a39081]";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "Male",
    department: "",
    yearOfStudy: "1st Year",
    githubUrl: "",
    leetcodeUrl: "",
    codeforcesUrl: "",
    bootcampReason: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/register`, form);
      setMessage(res.data.message || "Registration submitted. Pending admin approval.");
      setForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        gender: "Male",
        department: "",
        yearOfStudy: "1st Year",
        githubUrl: "",
        leetcodeUrl: "",
        codeforcesUrl: "",
        bootcampReason: "",
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#c89b7b] font-serif overflow-auto py-6">
      <div className="flex min-h-[85vh] w-[90vw] max-w-6xl rounded-3xl bg-[#1e1713] shadow-2xl overflow-hidden border border-[#4a3b32]">
        <div className="hidden md:flex w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-10 text-center text-[#1e1713]">
          <span className="mb-4 text-xs font-bold tracking-widest uppercase">ASTUMSJ SUMMER BOOTCAMP</span>
          <div className="my-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#1e1713] shadow-inner overflow-hidden bg-white">
            <img src="/logo.png" alt="ASTUMSJ Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Step Bold,</h1>
          <h1 className="text-4xl font-extrabold tracking-tight">Stay Iconic</h1>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center px-7 md:px-12 py-8 text-[#f5efe6] max-h-[90vh] overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-3xl font-bold tracking-wide">Create Account</h2>
            <p className="text-xs text-[#a39081] mt-1">
              Your application will be reviewed by an administrator before you can log in.
            </p>
          </div>

          {message && (
            <p className="mb-4 rounded-xl border border-[#4a3b32] bg-[#16110e] p-3 text-xs text-amber-400">
              {message}
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-xs text-[#a39081] mb-1 block">Full Name *</label>
              <input
                required
                value={form.fullName}
                onChange={e => update("fullName", e.target.value)}
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-xs text-[#a39081] mb-1 block">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                className={inputClass}
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a39081] mb-1 block">Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  className={inputClass}
                  placeholder="Min 6 chars"
                />
              </div>
              <div>
                <label className="text-xs text-[#a39081] mb-1 block">Confirm Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => update("confirmPassword", e.target.value)}
                  className={inputClass}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a39081] mb-1 block">Gender *</label>
                <select
                  required
                  value={form.gender}
                  onChange={e => update("gender", e.target.value)}
                  className={inputClass}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#a39081] mb-1 block">Year *</label>
                <select
                  required
                  value={form.yearOfStudy}
                  onChange={e => update("yearOfStudy", e.target.value)}
                  className={inputClass}
                >
                  {[1, 2, 3, 4, 5].map(y => (
                    <option key={y} value={`${y}${y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year`}>
                      {y}{y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#a39081] mb-1 block">Department *</label>
              <input
                required
                value={form.department}
                onChange={e => update("department", e.target.value)}
                className={inputClass}
                placeholder="e.g. Software Engineering"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#a39081] block">Coding Profiles (Optional)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={e => update("githubUrl", e.target.value)}
                  className={inputClass}
                  placeholder="GitHub URL"
                />
                <input
                  type="url"
                  value={form.leetcodeUrl}
                  onChange={e => update("leetcodeUrl", e.target.value)}
                  className={inputClass}
                  placeholder="LeetCode URL"
                />
                <input
                  type="url"
                  value={form.codeforcesUrl}
                  onChange={e => update("codeforcesUrl", e.target.value)}
                  className={inputClass}
                  placeholder="Codeforces URL"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#a39081] mb-1 block">Why do you want to join this bootcamp? *</label>
              <textarea
                required
                rows="3"
                value={form.bootcampReason}
                onChange={e => update("bootcampReason", e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Tell the admin why you want to join..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-bold text-[#1e1713] transition hover:bg-[#b08567] disabled:opacity-60 mt-2"
            >
              {loading ? "Submitting Application..." : "Submit Application"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#a39081]">
            Already have an account?{" "}
            <a href="/login" className="font-bold text-[#c89b7b] underline hover:text-white">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}