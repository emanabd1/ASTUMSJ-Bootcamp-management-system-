import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const input = "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-4 py-3 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none placeholder:text-[#a39081]";

export default function ResetPasswordPage() {
  const query = new URLSearchParams(useLocation().search);
  const [email, setEmail] = useState(query.get("email") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const r = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        password,
        confirmPassword,
      });

      setMessage(r.data.message || "Password successfully reset!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Reset failed. Please check your OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#c89b7b] font-serif overflow-hidden">
      <div className="w-[90vw] max-w-md rounded-3xl bg-[#1e1713] p-8 text-[#f5efe6] shadow-2xl border border-[#4a3b32]">
        <div className="mb-6">
          <span className="text-xs font-bold tracking-widest uppercase text-[#c89b7b]">
            ASTUMSJ SUMMER BOOTCAMP
          </span>
          <h1 className="text-2xl font-bold tracking-wide mt-1">
            Reset Password
          </h1>
          <p className="text-xs text-[#a39081] mt-1">
            Enter the 6-digit OTP sent to your email along with your new password.
          </p>
        </div>

        {message && (
          <p className="mb-4 rounded-xl border border-[#4a3b32] bg-[#16110e] p-3 text-xs text-amber-400">
            {message}
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-[#a39081] mb-1 block">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="text-xs text-[#a39081] mb-1 block">6-Digit OTP</label>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className={input + " tracking-widest text-center text-lg font-bold"}
              placeholder="••••••"
            />
          </div>

          <div>
            <label className="text-xs text-[#a39081] mb-1 block">New Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="text-xs text-[#a39081] mb-1 block">Confirm New Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={input}
              placeholder="Confirm password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-bold text-[#1e1713] transition hover:bg-[#b08567] mt-2"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#a39081]">
          Remembered your password?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-bold text-[#c89b7b] underline hover:text-white bg-transparent border-none cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}