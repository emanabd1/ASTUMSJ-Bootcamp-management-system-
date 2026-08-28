import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

/*
|--------------------------------------------------------------------------
| THIS IS THE ONLY SIGNUP PAGE
|--------------------------------------------------------------------------
| Both /signup and /register route here (see AppRoutes.jsx). The old
| second signup flow that used to live inside LoginPage.jsx has been
| removed so there is exactly one place applicants fill out the form.
|
| Theme: blue & white, matching the Landing Page and the Login Page.
*/

const inputClass =
  "w-full rounded-xl border border-[#B8CBE3] bg-white px-4 py-2.5 text-sm text-[#102A43] placeholder:text-[#7c93ad] focus:border-[#1E4D8C] focus:outline-none focus:ring-2 focus:ring-[#1E4D8C]/20";

const labelClass = "text-xs font-semibold text-[#315f91]";

const emptyForm = {
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
};

export default function SignupPage() {
  const [form, setForm] = useState(emptyForm);

  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [universitiesError, setUniversitiesError] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const navigate = useNavigate();

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Load the list of active universities for the dropdown. This is the
  // public endpoint, so it works before the applicant has an account.
  useEffect(() => {
    let isMounted = true;

    const loadUniversities = async () => {
      setUniversitiesLoading(true);
      setUniversitiesError("");

      try {
        const response = await axiosInstance.get("/universities/public");

        if (isMounted) {
          setUniversities(response.data.universities || []);
        }
      } catch (error) {
        if (isMounted) {
          setUniversitiesError(
            error.response?.data?.message ||
              "Could not load the list of universities."
          );
        }
      } finally {
        if (isMounted) {
          setUniversitiesLoading(false);
        }
      }
    };

    loadUniversities();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedUniversity = universities.find(
    (university) => university._id === form.university
  );

  const idLabel = selectedUniversity?.idLabel || "Student ID";

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

    if (!form.university) {
      setFeedback({
        type: "error",
        message: "Please select your university.",
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
          response.data.message ||
          "Registration submitted. Pending admin approval.",
      });

      setForm(emptyForm);

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Registration failed.",
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex w-full flex-col justify-center bg-white px-7 py-8 text-[#071a33] md:w-1/2 md:px-12">
          <h2 className="mb-2 text-3xl font-bold tracking-wide text-[#071a33]">
            Create Account
          </h2>

          <p className="mb-5 text-xs text-[#40566f]">
            Your application will be reviewed by an administrator before you
            can log in.
          </p>

          {feedback.message && (
            <p
              role="alert"
              className={`mb-4 rounded-xl border p-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                required
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className={labelClass}>Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className={inputClass}
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    update("password", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className={labelClass}>Confirm Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    update("confirmPassword", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Gender *</label>
                <select
                  required
                  value={form.gender}
                  onChange={(event) => update("gender", event.target.value)}
                  className={inputClass}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Year *</label>
                <select
                  required
                  value={form.yearOfStudy}
                  onChange={(event) =>
                    update("yearOfStudy", event.target.value)
                  }
                  className={inputClass}
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
              <label className={labelClass}>Department *</label>
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
                <label className={labelClass}>University *</label>
                <select
                  required
                  value={form.university}
                  disabled={universitiesLoading || !universities.length}
                  onChange={(event) =>
                    update("university", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">
                    {universitiesLoading
                      ? "Loading universities..."
                      : universities.length
                      ? "Select your university"
                      : "No universities available"}
                  </option>

                  {universities.map((university) => (
                    <option key={university._id} value={university._id}>
                      {university.shortName
                        ? `${university.name} (${university.shortName})`
                        : university.name}
                    </option>
                  ))}
                </select>

                {universitiesError && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {universitiesError}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>{idLabel} *</label>
                <input
                  required
                  value={form.universityIdNumber}
                  onChange={(event) =>
                    update("universityIdNumber", event.target.value)
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
              <label className={labelClass}>
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
              className="w-full rounded-xl bg-[#061426] py-3 text-sm font-semibold text-white transition hover:bg-[#1E4D8C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#40566f]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#1E4D8C] underline hover:text-[#061426]"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}