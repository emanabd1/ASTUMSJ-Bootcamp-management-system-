import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        fullName,
        email,
        password
      });
      setMessage(res.data.message || "Registration successful. Pending admin approval.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#c89b7b] font-serif overflow-hidden">
      <div className="flex h-[85vh] w-[80vw] max-w-5xl rounded-3xl bg-[#1e1713] shadow-2xl overflow-hidden">
        
        {/* Left Side: Branding / Logo Card */}
        <div className="flex w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-10 text-center text-[#1e1713]">
          <span className="mb-4 text-xs font-bold tracking-widest uppercase">ASTUMSJ SUMMER BOOTCAMP</span>
          <div className="my-6">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#1e1713] shadow-inner text-2xl font-bold">
              LOGO
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Step Bold,</h1>
          <h1 className="text-4xl font-extrabold tracking-tight">Stay Iconic</h1>
        </div>

        {/* Right Side: Signup Form based on Backend Model */}
        <div className="flex w-1/2 flex-col justify-center px-12 text-[#f5efe6]">
          <h2 className="mb-6 text-3xl font-bold tracking-wide">Create Account</h2>

          {message && <p className="mb-4 text-sm text-amber-400">{message}</p>}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs text-[#a39081]">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="text-xs text-[#a39081]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="text-xs text-[#a39081]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none"
                placeholder="Create a password (min 6 chars)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-semibold text-[#1e1713] transition hover:bg-[#b08567]"
            >
              {loading ? "Submitting..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#a39081]">
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