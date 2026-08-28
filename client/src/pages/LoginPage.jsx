import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
| This page used to also contain a full second "Sign Up" flow (a sliding
| panel with its own 2-step form) that duplicated SignupPage.jsx. That
| flow never had a working university/university-ID field, so submitting
| it always failed. It has been removed — "Sign up" now links to the one
| real signup page at /signup, so there is only one place to register.
*/

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    let isMounted = true;

    axiosInstance
      .get("/settings/registration-status")
      .then((response) => {
        if (isMounted && typeof response.data.isOpen === "boolean") {
          setIsRegistrationOpen(response.data.isOpen);
        }
      })
      .catch(() => {
        // If the check fails, default to allowing sign-up rather than
        // silently blocking applicants.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await axiosInstance.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const token = res.data.token;
      const user = res.data.user;

      if (!token || !user) {
        setMessage("Invalid login response from server.");
        return;
      }

      login(user, token);

      const role = user.role?.toLowerCase();

      switch (role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;

        case "mentor":
          navigate("/mentor/dashboard", { replace: true });
          break;

        case "student":
          navigate("/student/dashboard", { replace: true });
          break;

        default:
          setMessage(
            `Login successful, but the account role "${user.role}" is not recognized.`
          );
          break;
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setMessage("");
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    setMessage("");
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff] p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* LEFT BRAND PANEL */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-[#061426] p-8 text-center text-white md:flex">
          <span className="mb-2 text-3xl font-extrabold uppercase tracking-wider">
            ASTUMSJ Summer Bootcamp
          </span>

          <div className="my-4 flex h-40 w-40 items-center justify-center">
            <img
              src="/logo.png"
              alt="ASTUMSJ Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight">
            Step Bold,
          </h1>

          <h1 className="text-4xl font-bold tracking-tight text-[#b9d7ff]">
            Stay Iconic
          </h1>

          <p className="mt-6 max-w-xs text-sm text-[#b9d7ff]">
            Driven by Faith, Empowered by Knowledge.
          </p>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="flex w-full flex-col justify-center bg-white px-7 py-10 text-[#071a33] md:w-1/2 md:px-12">
          <h2 className="mb-6 text-3xl font-bold tracking-wide text-[#071a33]">
            Welcome Back
          </h2>

          {message && (
            <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700">
              {message}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#315f91]">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#B8CBE3] bg-white px-4 py-3 text-sm text-[#102A43] focus:border-[#1E4D8C] focus:outline-none focus:ring-2 focus:ring-[#1E4D8C]/20"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#315f91]">
                Password
              </label>

              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#B8CBE3] bg-white px-4 py-3 pr-12 text-sm text-[#102A43] focus:border-[#1E4D8C] focus:outline-none focus:ring-2 focus:ring-[#1E4D8C]/20"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#40566f] transition hover:text-[#1E4D8C]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
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

              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-[#1E4D8C] underline hover:text-[#061426]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#061426] py-3 text-sm font-semibold text-white transition hover:bg-[#1E4D8C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#B8CBE3]" />
            <span className="text-xs font-semibold tracking-widest text-[#40566f]">
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-[#B8CBE3]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 rounded-xl border border-[#B8CBE3] bg-white py-3 text-sm font-semibold text-[#102A43] transition hover:border-[#1E4D8C] hover:bg-[#f4f8ff]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M21.35 12.23c0-.78-.07-1.54-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.85-1.7 2.9-4.2 2.9-7.42Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.65 0 4.87-.88 6.5-2.35l-3.15-2.45c-.88.59-2 .94-3.35.94-2.57 0-4.75-1.73-5.53-4.06H3.21v2.53A9.82 9.82 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.47 14.08A5.9 5.9 0 0 1 6.15 12c0-.72.12-1.42.32-2.08V7.39H3.21A9.99 9.99 0 0 0 2.15 12c0 1.61.39 3.12 1.06 4.61l3.26-2.53Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.86c1.53 0 2.9.53 3.98 1.57l2.98-2.98C16.87 2.79 14.65 2 12 2a9.82 9.82 0 0 0-8.79 5.39l3.26 2.53C7.25 7.59 9.43 5.86 12 5.86Z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-3 rounded-xl border border-[#B8CBE3] bg-white py-3 text-sm font-semibold text-[#102A43] transition hover:border-[#1E4D8C] hover:bg-[#f4f8ff]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.03 1.76 2.7 1.25 3.36.95.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17A10.9 10.9 0 0 1 12 8.04c.97 0 1.94.13 2.85.39 2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.12 3.04.73.8 1.17 1.82 1.17 3.08 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56A10.99 10.99 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
              GitHub
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-[#40566f]">
            {isRegistrationOpen ? (
              <p>
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-bold text-[#1E4D8C] underline hover:text-[#061426]"
                >
                  Sign up
                </Link>
              </p>
            ) : (
              <p className="italic text-[#40566f]">
                Registration is currently closed by the admin.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}