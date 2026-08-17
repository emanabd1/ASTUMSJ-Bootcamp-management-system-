import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const input =
  "w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const r = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(r.data.message);
      setSent(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#c89b7b] font-serif">
      <div className="w-[90vw] max-w-md rounded-3xl bg-[#1e1713] p-8 text-[#f5efe6] shadow-2xl">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="mt-2 text-xs text-[#a39081]">
          Enter your email and we will send a one-time verification code.
        </p>
        {message && (
          <p className="mt-4 rounded-xl bg-[#16110e] p-3 text-sm text-amber-400">
            {message}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
            placeholder="Email address"
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-bold text-[#1e1713]"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
        {sent && (
          <button
            onClick={() =>
              navigate(`/reset-password?email=${encodeURIComponent(email)}`)
            }
            className="mt-3 w-full rounded-xl border border-[#4a3b32] py-3 text-sm"
          >
            Enter OTP
          </button>
        )}
        <a
          href="/login"
          className="mt-5 block text-center text-xs text-[#c89b7b] underline"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
}