import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const inputClass =
  "w-full rounded-3xl border border-[#334155] bg-transparent px-4 py-3 text-sm focus:border-[#2563eb] focus:outline-none";

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
    university: "",
    universityIdNumber: "",
  });

  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const navigate = useNavigate();

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (form.password !== form.confirmPassword) {
      setFeedback({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/register", {
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        universityIdNumber: form.universityIdNumber.trim(),
        githubUrl: form.githubUrl.trim(),
        leetcodeUrl: form.leetcodeUrl.trim(),
        codeforcesUrl: form.codeforcesUrl.trim(),
        bootcampReason: form.bootcampReason.trim(),
      });

      setFeedback({
        type: "success",
        message:
          res.data.message ||
          "Registration submitted. Pending admin approval.",
      });

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
        university: "",
        universityIdNumber: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message || "Registration failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa] p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-[#0b1f3a] shadow-2xl">

        {/* LEFT LOGO SECTION */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-[#0b1f3a] p-8 text-center text-white md:flex">

          <span className="mb-2 text-3xl font-extrabold uppercase tracking-wider text-white">
            ASTUMSJ SUMMER BOOTCAMP
          </span>

          <div className="my-2">
            <div className="mx-auto flex h-110 w-110 items-center justify-center">
              <img
                src="/logo.png"
                alt="ASTUMSJ Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-white">
            Step Bold,
          </h1>

          <h1 className="text-4xl font-bold tracking-tight text-white">
            Stay Iconic
          </h1>
        </div>

        {/* RIGHT FORM SECTION */}
        <div className="flex w-full flex-col justify-center bg-[#ffffff] px-7 py-8 text-[#0b1f3a] md:w-1/2 md:px-12">

          <h2 className="mb-2 text-3xl font-bold tracking-wide text-[#0b1f3a]">
            Create Account
          </h2>

          <p className="mb-5 text-xs text-[#64748b]">
            Your application will be reviewed by an administrator before you
            can log in.
          </p>

          {feedback.message && (
            <p
              role="alert"
              className={`mb-4 rounded-xl border p-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-700 bg-emerald-50 text-emerald-700"
                  : "border-red-700 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-xs text-[#a39081]">
                Full Name *
              </label>

              <input
                required
                value={form.fullName}
                onChange={(event) =>
                  update("fullName", event.target.value)
                }
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-xs text-[#a39081]">
                Email *
              </label>

              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  update("email", event.target.value)
                }
                className={inputClass}
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a39081]">
                  Password *
                </label>

                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    update("password", event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  Confirm Password *
                </label>

                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    update("confirmPassword", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a39081]">
                  Gender *
                </label>

                <select
                  required
                  value={form.gender}
                  onChange={(event) =>
                    update("gender", event.target.value)
                  }
                  className={`${inputClass} bg-[#16110e]`}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  Year *
                </label>

                <select
                  required
                  value={form.yearOfStudy}
                  onChange={(event) =>
                    update("yearOfStudy", event.target.value)
                  }
                  className={`${inputClass} bg-[#16110e]`}
                >
                  {[1, 2, 3, 4, 5].map((year) => (
                    <option key={year}>
                      {year}
                      {year === 1
                        ? "st"
                        : year === 2
                        ? "nd"
                        : year === 3
                        ? "rd"
                        : "th"}{" "}
                      Year
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#a39081]">
                Department *
              </label>

              <input
                required
                value={form.department}
                onChange={(event) =>
                  update("department", event.target.value)
                }
                className={inputClass}
                placeholder="e.g. Software Engineering"
              />
            </div>

            {/* UNIVERSITY + UNIVERSITY ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a39081]">
                  University *
                </label>

                <select
                  required
                  value={form.university}
                  disabled={universitiesLoading}
                  onChange={(event) =>
                    update("university", event.target.value)
                  }
                  className={`${inputClass} bg-[#16110e]`}
                >
                  <option value="">
                    {universitiesLoading
                      ? "Loading universities..."
                      : universities.length
                      ? "Select your university"
                      : "No universities available"}
                  </option>

                  {universities.map((university) => (
                    <option
                      key={university._id}
                      value={university._id}
                    >
                      {university.shortName
                        ? `${university.name} (${university.shortName})`
                        : university.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  {idLabel} *
                </label>

                <input
                  required
                  value={form.universityIdNumber}
                  onChange={(event) =>
                    update(
                      "universityIdNumber",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder={`Your ${idLabel.toLowerCase()}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="url"
                value={form.githubUrl}
                onChange={(event) =>
                  update("githubUrl", event.target.value)
                }
                className={inputClass}
                placeholder="GitHub URL"
              />

              <input
                type="url"
                value={form.leetcodeUrl}
                onChange={(event) =>
                  update("leetcodeUrl", event.target.value)
                }
                className={inputClass}
                placeholder="LeetCode URL"
              />

              <input
                type="url"
                value={form.codeforcesUrl}
                onChange={(event) =>
                  update("codeforcesUrl", event.target.value)
                }
                className={inputClass}
                placeholder="Codeforces URL"
              />
            </div>

            <div>
              <label className="text-xs text-[#a39081]">
                Why do you want to join this bootcamp? *
              </label>

              <textarea
                required
                rows="3"
                value={form.bootcampReason}
                onChange={(event) =>
                  update("bootcampReason", event.target.value)
                }
                className={`${inputClass} resize-none`}
                placeholder="Tell the admin why you want to join..."
              />
            </div>

            <button
              disabled={loading || universitiesLoading}
              className="w-full rounded-3xl bg-[#c89b7b] py-3 text-sm font-semibold text-[#1e1713] transition hover:bg-[#b08567] disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#a39081]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#c89b7b] underline hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}