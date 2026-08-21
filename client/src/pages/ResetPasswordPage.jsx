import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const input =
    "w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm text-[#f5efe6] placeholder-[#a39081] focus:border-[#c89b7b] focus:outline-none";

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        email: email.trim(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });

      setMessage(
        res.data.message || "Password reset successfully."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Password reset failed. Please check your OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center overflow-auto bg-[#c89b7b] px-4 py-8 font-serif">
      <div className="w-full max-w-lg rounded-3xl bg-[#1e1713] p-10 text-[#f5efe6] shadow-2xl">
        <h1 className="mb-8 text-3xl font-bold tracking-wide">
          Enter OTP
        </h1>

        {message && (
          <p className="mb-5 rounded-xl border border-[#4a3b32] bg-[#16110e] p-3 text-sm text-amber-400">
            {message}
          </p>
        )}

        <form
          onSubmit={handleResetPassword}
          className="space-y-4"
        >
          <div>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              placeholder="Email"
            />
          </div>

          <div>
            <input
              required
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={input}
              placeholder="Enter OTP"
              maxLength={6}
            />
          </div>

          <div className="relative">
            <input
              required
              minLength={6}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${input} pr-12`}
              placeholder="New password"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39081] transition hover:text-[#c89b7b]"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17.3 17.3 0 0 1-3.1 4.2" />
                  <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8" />
                </svg>
              )}
            </button>
          </div>

          <div className="relative">
            <input
              required
              minLength={6}
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className={`${input} pr-12`}
              placeholder="Confirm new password"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39081] transition hover:text-[#c89b7b]"
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showConfirmPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17.3 17.3 0 0 1-3.1 4.2" />
                  <path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-bold text-[#1e1713] transition hover:bg-[#b08567] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}