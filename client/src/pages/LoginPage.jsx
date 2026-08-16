import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

  // Controls the sliding state: false = Login View (form on left), true = Signup View (form on right)
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings/registration-status`);
      setIsRegistrationOpen(res.data.isOpen ?? true);
    } catch (err) {
      setIsRegistrationOpen(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setMessage("Login successful!");
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="relative flex h-[85vh] w-[80vw] max-w-5xl rounded-3xl bg-[#1e1713] shadow-2xl overflow-hidden">
        
        {/* ================= STATIC BACKGROUND PANELS (Logos) ================= */}
        <div className="absolute inset-0 flex">
          {/* Left Side Logo Background */}
          <div className="flex w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-10 text-center text-[#1e1713]">
            <span className="mb-4 text-xs font-bold tracking-widest uppercase">ASTUMSJ SUMMER BOOTCAMP</span>
            <div className="my-4">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#1e1713] shadow-inner overflow-hidden bg-white">
                <img src="/logo.png" alt="ASTUMSJ Logo" className="h-full w-full object-cover" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Step Bold,</h1>
            <h1 className="text-3xl font-extrabold tracking-tight">Stay Iconic</h1>
          </div>

          {/* Right Side Logo Background */}
          <div className="flex w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-10 text-center text-[#1e1713]">
            <span className="mb-4 text-xs font-bold tracking-widest uppercase">ASTUMSJ SUMMER BOOTCAMP</span>
            <div className="my-4">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#1e1713] shadow-inner overflow-hidden bg-white">
                <img src="/logo.png" alt="ASTUMSJ Logo" className="h-full w-full object-cover" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Step Bold,</h1>
            <h1 className="text-3xl font-extrabold tracking-tight">Stay Iconic</h1>
          </div>
        </div>

        {/* ================= SLIDING FORM OVERLAY ================= */}
        <div
          className={`absolute top-0 h-full w-1/2 bg-[#1e1713] flex flex-col justify-center px-12 text-[#f5efe6] transition-transform duration-700 ease-in-out z-20 shadow-2xl ${
            isSignup ? "translate-x-full" : "translate-x-0"
          }`}
        >
          {!isSignup ? (
            // -------- LOGIN FORM --------
            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-wide">Welcome Back</h2>
              {message && <p className="mb-4 text-sm text-amber-400">{message}</p>}

              <form onSubmit={handleLogin} className="space-y-4">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-semibold text-[#1e1713] transition hover:bg-[#b08567]"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-[#a39081]">
                {isRegistrationOpen ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMessage(""); setIsSignup(true); }}
                      className="font-bold text-[#c89b7b] underline hover:text-white bg-transparent border-none cursor-pointer"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p className="italic text-zinc-500">Registration is currently closed by the admin.</p>
                )}
              </div>
            </div>
          ) : (
            // -------- SIGNUP FORM --------
            <div>
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
                <button
                  type="button"
                  onClick={() => { setMessage(""); setIsSignup(false); }}
                  className="font-bold text-[#c89b7b] underline hover:text-white bg-transparent border-none cursor-pointer"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}