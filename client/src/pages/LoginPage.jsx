import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("Male");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("1st Year");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [codeforcesUrl, setCodeforcesUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [bootcampReason, setBootcampReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);

  const navigate = useNavigate();

  // FIXED
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
        bootcampReason,
      });

      setMessage(
        res.data.message ||
          "Registration successful. Pending admin approval."
      );
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#c89b7b] font-serif overflow-hidden">
      <div className="relative flex h-[90vh] w-[85vw] max-w-5xl rounded-3xl bg-[#1e1713] shadow-2xl overflow-hidden">

        {/* ================= STATIC BACKGROUND LOGO PANELS ================= */}

        <div className="absolute inset-0 flex">

          <div className="flex w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-8 text-center text-[#1e1713]">
            <span className="mb-2 text-xs font-bold tracking-widest uppercase">
              ASTUMSJ SUMMER BOOTCAMP
            </span>

            <div className="my-2">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#1e1713] shadow-inner overflow-hidden bg-white">
                <img
                  src="/logo.png"
                  alt="ASTUMSJ Logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight">
              Step Bold,
            </h1>

            <h1 className="text-2xl font-extrabold tracking-tight">
              Stay Iconic
            </h1>
          </div>

          <div className="flex w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-8 text-center text-[#1e1713]">
            <span className="mb-2 text-xs font-bold tracking-widest uppercase">
              ASTUMSJ SUMMER BOOTCAMP
            </span>

            <div className="my-2">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#1e1713] shadow-inner overflow-hidden bg-white">
                <img
                  src="/logo.png"
                  alt="ASTUMSJ Logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight">
              Step Bold,
            </h1>

            <h1 className="text-2xl font-extrabold tracking-tight">
              Stay Iconic
            </h1>
          </div>

        </div>

        {/* ================= SLIDING FORM OVERLAY ================= */}

        <div
          className={`absolute top-0 h-full w-1/2 bg-[#1e1713] flex flex-col justify-center px-10 text-[#f5efe6] transition-transform duration-700 ease-in-out z-20 shadow-2xl overflow-y-auto ${
            isSignup ? "translate-x-full" : "translate-x-0"
          }`}
        >

          {!isSignup ? (

            /* =========================
               LOGIN FORM
            ========================= */

            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-wide">
                Welcome Back
              </h2>

              {message && (
                <p className="mb-4 text-xs text-amber-400">
                  {message}
                </p>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-4"
              >

                <div>
                  <label className="text-xs text-[#a39081]">
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#a39081]">
                    Password
                  </label>

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none"
                    placeholder="Enter your password"
                  />
                  <div className="mt-2 text-right">
                    <a href="/forgot-password" className="text-[11px] font-semibold text-[#c89b7b] underline hover:text-white">Forgot password?</a>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#c89b7b] py-3 text-sm font-semibold text-[#1e1713] transition hover:bg-[#b08567]"
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </button>

              </form>

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
                      className="font-bold text-[#c89b7b] underline hover:text-white bg-transparent border-none cursor-pointer"
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

            /* =========================
               SIGNUP FORM
            ========================= */

            <div>

              <div className="flex justify-between items-center mb-3">

                <h2 className="text-xl font-bold tracking-wide">
                  Create Account
                </h2>

                <span className="text-xs text-[#a39081]">
                  Step {signupStep} of 2
                </span>

              </div>

              {message && (
                <p className="mb-2 text-xs text-amber-400">
                  {message}
                </p>
              )}

              {signupStep === 1 ? (

                <div className="space-y-2.5">

                  <div>
                    <label className="text-xs text-[#a39081]">
                      Full Name
                    </label>

                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a39081]">
                      Email
                    </label>

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a39081]">
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
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                      placeholder="Min 6 characters"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a39081]">Confirm Password</label>
                    <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none" placeholder="Confirm password" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <div>
                      <label className="text-xs text-[#a39081]">
                        Gender
                      </label>

                      <select
                        value={gender}
                        onChange={(e) =>
                          setGender(e.target.value)
                        }
                        className="w-full rounded-xl border border-[#4a3b32] bg-[#1e1713] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none"
                      >
                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#a39081]">
                        Year of Study
                      </label>

                      <select
                        value={yearOfStudy}
                        onChange={(e) =>
                          setYearOfStudy(e.target.value)
                        }
                        className="w-full rounded-xl border border-[#4a3b32] bg-[#1e1713] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none"
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

                  <div>
                    <label className="text-xs text-[#a39081]">
                      Department
                    </label>

                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) =>
                        setDepartment(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                      placeholder="e.g. Software Engineering"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        fullName &&
                        email &&
                        password &&
                        department
                      ) {
                        setSignupStep(2);
                      } else {
                        setMessage(
                          "Please fill out all required fields on Step 1."
                        );
                      }
                    }}
                    className="w-full rounded-xl bg-[#c89b7b] py-2.5 text-sm font-semibold text-[#1e1713] transition hover:bg-[#b08567] mt-1"
                  >
                    Next: Coding Profiles & Motivation →
                  </button>

                </div>

              ) : (

                <form
                  onSubmit={handleFinalSignup}
                  className="space-y-2.5"
                >

                  <div>
                    <label className="text-xs text-[#a39081]">
                      LeetCode Profile URL
                    </label>

                    <input
                      type="url"
                      value={leetcodeUrl}
                      onChange={(e) =>
                        setLeetcodeUrl(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-xs focus:border-[#c89b7b] focus:outline-none"
                      placeholder="https://leetcode.com/username"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a39081]">
                      Codeforces Profile URL
                    </label>

                    <input
                      type="url"
                      value={codeforcesUrl}
                      onChange={(e) =>
                        setCodeforcesUrl(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-xs focus:border-[#c89b7b] focus:outline-none"
                      placeholder="https://codeforces.com/profile/username"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a39081]">
                      GitHub Profile URL
                    </label>

                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) =>
                        setGithubUrl(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-xs focus:border-[#c89b7b] focus:outline-none"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#a39081]">
                      Why do you want to join this bootcamp? *
                    </label>

                    <textarea
                      required
                      rows="2"
                      value={bootcampReason}
                      onChange={(e) =>
                        setBootcampReason(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-xs focus:border-[#c89b7b] focus:outline-none resize-none"
                      placeholder="Briefly explain your motivation..."
                    ></textarea>
                  </div>

                  <div className="flex gap-2 pt-1">

                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="w-1/3 rounded-xl border border-[#4a3b32] py-2 text-xs font-semibold text-[#a39081] transition hover:bg-[#2d231d]"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 rounded-xl bg-[#c89b7b] py-2 text-xs font-semibold text-[#1e1713] transition hover:bg-[#b08567]"
                    >
                      {loading
                        ? "Submitting..."
                        : "Complete Signup"}
                    </button>

                  </div>

                </form>
              )}

              <div className="mt-3 text-center text-xs text-[#a39081]">

                Already have an account?{" "}

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setIsSignup(false);
                    setSignupStep(1);
                  }}
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