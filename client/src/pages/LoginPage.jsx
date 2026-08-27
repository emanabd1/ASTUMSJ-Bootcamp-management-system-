import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  // =========================
  // LOGIN STATE
  // =========================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // =========================
  // SIGNUP STATE
  // =========================
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("Male");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [codeforcesUrl, setCodeforcesUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [bootcampReason, setBootcampReason] = useState("");
  const [university, setUniversity] = useState("");

  // =========================
  // GENERAL STATE
  // =========================
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);

  const navigate = useNavigate();
  const { login } = useAuth();

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data.token;
      const user = res.data.user;

      if (!token || !user) {
        setMessage("Invalid login response from server.");
        return;
      }

      console.log("LOGGED IN USER:", user);
      console.log("USER ROLE:", user.role);

      // Save authentication data
      login(user, token);

      // Normalize role
      const role = user.role?.toLowerCase();

      console.log("NORMALIZED ROLE:", role);

      // =========================
      // ROLE-BASED REDIRECT
      // =========================
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
      console.error("LOGIN ERROR:", err);

      setMessage(
        err.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GOOGLE LOGIN
  // =========================
  const handleGoogleLogin = () => {
    setMessage("");

    window.location.href = `${API_URL}/auth/google`;
  };

  // =========================
  // GITHUB LOGIN
  // =========================
  const handleGithubLogin = () => {
    setMessage("");

    window.location.href = `${API_URL}/auth/github`;
  };

  // =========================
  // SIGNUP
  // =========================
  const handleFinalSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        fullName,
        email,
        password,
        confirmPassword,
        gender,
        department,
        yearOfStudy,
        leetcodeUrl,
        codeforcesUrl,
        githubUrl,
        university,
        bootcampReason,
      });

      setMessage(
        res.data.message ||
          "Registration successful. Pending admin approval."
      );
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);

      setMessage(
        err.response?.data?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#F5F8FC] font-serif">
      <div className="relative flex h-[95vh] w-[200vw] max-w-7xl overflow-hidden rounded-3xl bg-[#050B14] shadow-2xl">

        {/* =====================================================
            STATIC BACKGROUND LOGO PANELS
        ====================================================== */}

        <div className="absolute inset-0 flex">

          {/* LEFT BACKGROUND */}
          <div className="flex w-1/2 flex-col items-center justify-center bg-[#0B1F3A] p-8 text-center px-6 py-4">
            <span className="mb-2 text-4xl font-extrabold uppercase tracking-wider text-[#F5F8FC]">
              ASTUMSJ SUMMER BOOTCAMP
            </span>

            <div className="my-2">
              <div className="mx-auto flex h-120 w-120 items-center justify-center">
                <img
                  src="/logo.png"
                  alt="ASTUMSJ Logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight">
              Step Bold,
            </h1>

            <h1 className="text-4xl font-extrabold tracking-tight">
              Stay Iconic
            </h1>
          </div>

          {/* RIGHT BACKGROUND */}
          <div className="flex w-1/2 flex-col items-center justify-center bg-[#0B1F3A] p-8 text-center px-6 py-4">
            <span className="mb-2 text-4xl font-extrabold uppercase tracking-wider text-[#F5F8FC]">
              ASTUMSJ SUMMER BOOTCAMP
            </span>

            <div className="my-2">
  <             div className="mx-auto flex h-120 w-120 items-center justify-center">
                 <img
                  src="/logo.png"
                  alt="ASTUMSJ Logo"
                  className="h-full w-full object-contain"
                 />
                </div>
             </div>

            <h1 className="text-4xl font-bold text-[#F5F8FC] font-serif tracking-tight">
              Step Bold,
            </h1>

            <h1 className="text-4xl font-bold text-[#F5F8FC] tracking-tight">
              Stay Iconic
            </h1>
          </div>
        </div>

        {/* =====================================================
            SLIDING FORM OVERLAY
        ====================================================== */}

        <div
          className={`absolute top-0 z-20 flex h-full w-1/2 flex-col justify-center overflow-y-auto bg-[#F5F8FC] px-10 text-[#f5efe6] shadow-2xl transition-transform duration-700 ease-in-out ${
            isSignup
              ? "translate-x-full"
              : "translate-x-0"
          }`}
        >

          {/* ===================================================
              LOGIN
          ==================================================== */}

          {!isSignup ? (
            <div>

              <h2 className="mb-6 text-3xl font-bold tracking-wide text-[#102A43]">
                Welcome Back
              </h2>

              {/* MESSAGE */}
              {message && (
                <p className="mb-4 text-xs text-amber-400">
                  {message}
                </p>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >

                {/* ================= EMAIL ================= */}

                <div>
                  <label className="text-xs text-[#102A43]">
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full rounded-xl border border-[#B8CBE3]  px-4 py-3 text-sm focus:border-[#B8CBE3] focus:outline-none text-[#102A43]"
                    placeholder="Enter your email"
                  />
                </div>

                {/* ================= PASSWORD ================= */}

                <div>
                  <label className="text-xs text-[#102A43]">
                    Password
                  </label>

                  <div className="relative mt-1">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-transparent px-4 py-3 pr-12 text-sm focus:border-[#B8CBE3] focus:outline-none text-[#102A43]"
                      placeholder="Enter your password"
                    />

                    {/* EYE BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39081] transition hover:text-[#c89b7b]"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      title={
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
                          <circle
                            cx="12"
                            cy="12"
                            r="3"
                          />
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

                  {/* FORGOT PASSWORD */}

                  <div className="mt-2 text-right">
                    <a
                      href="/forgot-password"
                      className="text-[11px] font-semibold text-[#102A43] underline hover:text-[#102A43]"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                {/* ================= LOGIN BUTTON ================= */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#102A43] py-3 text-sm font-semibold text-[#F5F8FC] transition hover:bg-[#1E4D8C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </button>
              </form>

              {/* =================================================
                  OAUTH
              ================================================== */}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#4a3b32]" />

                <span className="text-xs font-semibold tracking-widest text-[#a39081]">
                  OR CONTINUE WITH
                </span>

                <div className="h-px flex-1 bg-[#4a3b32]" />
              </div>

              <div className="grid grid-cols-2 gap-3">

                {/* ================= GOOGLE ================= */}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-3 rounded-xl border border-[#B8CBE3] bg-[#102A43] py-3 text-sm font-semibold text-[#f5efe6] transition hover:border-[#c89b7b] hover:bg-[#1E4D8C]"
                >
                  {/* Google G */}

                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                  >
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

                {/* ================= GITHUB ================= */}

                <button
                  type="button"
                  onClick={handleGithubLogin}
                  className="flex items-center justify-center gap-3 rounded-xl border border-[#B8CBE3] bg-[#102A43] py-3 text-sm font-semibold text-[#f5efe6] transition hover:border-[#c89b7b] hover:bg-[#1E4D8C]"
                >
                  {/* GitHub Icon */}

                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.03 1.76 2.7 1.25 3.36.95.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17A10.9 10.9 0 0 1 12 8.04c.97 0 1.94.13 2.85.39 2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.12 3.04.73.8 1.17 1.82 1.17 3.08 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56A10.99 10.99 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                  </svg>

                  GitHub
                </button>
              </div>

              {/* ================= SIGNUP LINK ================= */}

              <div className="mt-6 text-center text-xs text-[#a39081]">
                {isRegistrationOpen ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setSignupStep(1);
                        setIsSignup(true);
                      }}
                      className="cursor-pointer border-none bg-transparent font-bold text-[#102A43] underline hover:text-[#1E4D8C]"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p className="italic text-zinc-500">
                    Registration is currently closed by the admin.
                  </p>
                )}
              </div>
            </div>
          ) : (

            /* =================================================
               SIGNUP
            ================================================== */

            <div>

              {/* HEADER */}

              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-wide text-[#102A43]">
                  Create Account
                </h2>

                <span className="text-xs text-[#a39081]">
                  Step {signupStep} of 2
                </span>
              </div>

              {/* MESSAGE */}

              {message && (
                <p className="mb-2 text-xs text-amber-400">
                  {message}
                </p>
              )}

              {/* =================================================
                  SIGNUP STEP 1
              ================================================== */}

              {signupStep === 1 ? (
                <div className="space-y-2.5">

                  {/* FULL NAME */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Full Name
                    </label>

                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Email
                    </label>

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="Enter your email"
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Password
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="Min 6 characters"
                    />
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="Confirm password"
                    />
                  </div>

                  {/* GENDER + YEAR */}

                  <div className="grid grid-cols-2 gap-2">

                    {/* GENDER */}

                    <div>
                      <label className="text-xs text-[#102A43]">
                        Gender
                      </label>

                      <select
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value)
                        }
                        className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      >
                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>
                      </select>
                    </div>

                    {/* YEAR */}

                    <div>
                      <label className="text-xs text-[#102A43]">
                        Year of Study
                      </label>

                      <select
                        value={yearOfStudy}
                        onChange={(e) =>
                          setYearOfStudy(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      >
                        <option value="1st Year">
                          1st Year
                        </option>

                        <option value="2nd Year">
                          2nd Year
                        </option>

                        <option value="3rd Year">
                          3rd Year
                        </option>

                        <option value="4th Year">
                          4th Year
                        </option>

                        <option value="5th Year">
                          5th Year
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Department
                    </label>

                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) =>
                        setDepartment(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-sm focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="e.g. Software Engineering"
                    />
                  </div>

                  {/* NEXT BUTTON */}

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        fullName.trim() &&
                        email.trim() &&
                        password &&
                        confirmPassword &&
                        department.trim()
                      ) {
                        if (
                          password !==
                          confirmPassword
                        ) {
                          setMessage(
                            "Passwords do not match."
                          );

                          return;
                        }

                        setMessage("");
                        setSignupStep(2);
                      } else {
                        setMessage(
                          "Please fill out all required fields on Step 1."
                        );
                      }
                    }}
                    className="mt-1 w-full rounded-xl bg-[#102A43] py-2.5 text-sm font-semibold text-[#F5F8FC] transition hover:bg-[#1E4D8C]"
                  >
                    Next: Coding Profiles & Motivation →
                  </button>
                </div>
              ) : (

                /* =================================================
                   SIGNUP STEP 2
                ================================================== */

                <form
                  onSubmit={handleFinalSignup}
                  className="space-y-2.5"
                >

                  {/* LEETCODE */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      LeetCode Profile URL
                    </label>

                    <input
                      type="url"
                      value={leetcodeUrl}
                      onChange={(e) =>
                        setLeetcodeUrl(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-xs focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="https://leetcode.com/username"
                    />
                  </div>

                  {/* CODEFORCES */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Codeforces Profile URL
                    </label>

                    <input
                      type="url"
                      value={codeforcesUrl}
                      onChange={(e) =>
                        setCodeforcesUrl(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-xs focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="https://codeforces.com/profile/username"
                    />
                  </div>

                  {/* GITHUB PROFILE */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      GitHub Profile URL
                    </label>

                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) =>
                        setGithubUrl(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-xs focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  {/* BOOTCAMP REASON */}

                  <div>
                    <label className="text-xs text-[#102A43]">
                      Why do you want to join this bootcamp? *
                    </label>

                    <textarea
                      required
                      rows="2"
                      value={bootcampReason}
                      onChange={(e) =>
                        setBootcampReason(
                          e.target.value
                        )
                      }
                      className="w-full resize-none rounded-xl border border-[#B8CBE3] bg-[#102A43]transparent px-3 py-2 text-xs focus:border-[#102A43] focus:outline-none text-[#102A43]"
                      placeholder="Briefly explain your motivation..."
                    />
                  </div>

                  {/* BACK + SUBMIT */}

                  <div className="flex gap-2 pt-1">

                    <button
                      type="button"
                      onClick={() =>
                        setSignupStep(1)
                      }
                      className="w-1/3 rounded-xl bg-[#102A43] border border-[#B8CBE3] py-2 text-xs font-semibold text-[#F5F8FC] transition hover:bg-[#1E4D8C]"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 rounded-xl bg-[#102A43] py-2 text-xs font-semibold text-[#F5F8FC] transition hover:bg-[#1E4D8C] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? "Submitting..."
                        : "Complete Signup"}
                    </button>

                  </div>
                </form>
              )}

              {/* ================= LOGIN LINK ================= */}

              <div className="mt-3 text-center text-xs text-[#102A43]">
                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setIsSignup(false);
                    setSignupStep(1);
                  }}
                  className="cursor-pointer border-none bg-transparent font-bold text-[#102A43] underline hover:text-[#1E4D8C]"
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
