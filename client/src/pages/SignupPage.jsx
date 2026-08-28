import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const inputClass = "w-full rounded-3xl border border-[#4a3b32] bg-transparent px-4 py-3 text-sm focus:border-[#c89b7b] focus:outline-none";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "", gender: "Male",
    department: "", yearOfStudy: "1st Year", githubUrl: "", leetcodeUrl: "", codeforcesUrl: "", bootcampReason: "",
    university: "", universityIdNumber: "",
  });
  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const navigate = useNavigate();
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    axiosInstance
      .get("/universities/public")
      .then((res) => setUniversities(res.data.universities || []))
      .catch((err) =>
        setFeedback({
          type: "error",
          message:
            err.response?.data?.message ||
            "Could not load universities. Please refresh and try again.",
        })
      )
      .finally(() => setUniversitiesLoading(false));
  }, []);

  const selectedUniversity = universities.find((u) => u._id === form.university);
  const idLabel = selectedUniversity?.idLabel || "University ID";

  const handleSignup = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (form.password !== form.confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/register", {
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
        message: res.data.message || "Registration submitted. Pending admin approval.",
      });
      setForm({ fullName: "", email: "", password: "", confirmPassword: "", gender: "Male", department: "", yearOfStudy: "1st Year", githubUrl: "", leetcodeUrl: "", codeforcesUrl: "", bootcampReason: "", university: "", universityIdNumber: "" });
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setFeedback({ type: "error", message: err.response?.data?.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="flex min-h-screen items-center justify-center bg-[#c89b7b] p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl bg-[#1e1713]">
        
        {/* left BACKGROUND / LOGO SECTION */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-[#c89b7b] p-8 text-center text-[#1e1713] md:flex">
          <span className="mb-2 text-xl font-extrabold uppercase tracking-wider text-[#1e1713]">
            ASTUMSJ SUMMER BOOTCAMP
          </span>

          <div className="my-2">
            <div className="mx-auto flex h-48 w-48 items-center justify-center">
              <img
                src="/logo.png"
                alt="ASTUMSJ Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold font-serif tracking-tight text-[#1e1713]">
            Step Bold,
          </h1>
          <h1 className="text-4xl font-bold tracking-tight text-[#1e1713]">
            Stay Iconic
          </h1>
        </div>
        <div className="flex w-full flex-col justify-center px-7 py-8 text-[#f5efe6] md:w-1/2 md:px-12">
          <h2 className="mb-2 text-3xl font-bold tracking-wide">Create Account</h2>
          <p className="mb-5 text-xs text-[#a39081]">Your application will be reviewed by an administrator before you can log in.</p>
          {feedback.message && <p role="alert" className={`mb-4 rounded-xl border p-3 text-sm ${feedback.type === "success" ? "border-emerald-700 bg-emerald-950 text-emerald-300" : "border-red-800 bg-red-950 text-red-300"}`}>{feedback.message}</p>}
          <form onSubmit={handleSignup} className="space-y-3">
            <div><label className="text-xs text-[#a39081]">Full Name *</label><input required value={form.fullName} onChange={e => update("fullName", e.target.value)} className={inputClass} placeholder="Enter your full name" /></div>
            <div><label className="text-xs text-[#a39081]">Email *</label><input required type="email" value={form.email} onChange={e => update("email", e.target.value)} className={inputClass} placeholder="Enter your email" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-[#a39081]">Password *</label><input required minLength={6} type="password" value={form.password} onChange={e => update("password", e.target.value)} className={inputClass} /></div>
              <div><label className="text-xs text-[#a39081]">Confirm Password *</label><input required minLength={6} type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-[#a39081]">Gender *</label><select required value={form.gender} onChange={e => update("gender", e.target.value)} className={`${inputClass} bg-[#16110e]`}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div><label className="text-xs text-[#a39081]">Year *</label><select required value={form.yearOfStudy} onChange={e => update("yearOfStudy", e.target.value)} className={`${inputClass} bg-[#16110e]`}>{[1,2,3,4,5].map(y => <option key={y}>{y}{y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year</option>)}</select></div>
            </div>
            <div><label className="text-xs text-[#a39081]">Department *</label><input required value={form.department} onChange={e => update("department", e.target.value)} className={inputClass} placeholder="e.g. Software Engineering" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#a39081]">University *</label>
                <select required value={form.university} onChange={e => update("university", e.target.value)} className={`${inputClass} bg-[#16110e]`}>
                  <option value="" disabled>
                    {universitiesLoading
                      ? "Loading universities..."
                      : universities.length
                        ? "Select your university"
                        : "No universities available"}
                  </option>
                  {universities.map(u => <option key={u._id} value={u._id}>{u.shortName ? `${u.name} (${u.shortName})` : u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#a39081]">{idLabel} *</label>
                <input required value={form.universityIdNumber} onChange={e => update("universityIdNumber", e.target.value)} className={inputClass} placeholder={`Your ${idLabel.toLowerCase()}`} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="url" value={form.githubUrl} onChange={e => update("githubUrl", e.target.value)} className={inputClass} placeholder="GitHub URL" />
              <input type="url" value={form.leetcodeUrl} onChange={e => update("leetcodeUrl", e.target.value)} className={inputClass} placeholder="LeetCode URL" />
              <input type="url" value={form.codeforcesUrl} onChange={e => update("codeforcesUrl", e.target.value)} className={inputClass} placeholder="Codeforces URL" />
            </div>
            <div><label className="text-xs text-[#a39081]">Why do you want to join this bootcamp? *</label><textarea required rows="3" value={form.bootcampReason} onChange={e => update("bootcampReason", e.target.value)} className={`${inputClass} resize-none`} placeholder="Tell the admin why you want to join..." /></div>
            <button disabled={loading} className="w-full rounded-3xl bg-[#c89b7b] py-3 text-sm font-semibold text-[#1e1713] transition hover:bg-[#b08567] disabled:opacity-60">{loading ? "Submitting..." : "Submit Application"}</button>
          </form>
          <div className="mt-5 text-center text-xs text-[#a39081]">Already have an account? <Link to="/login" className="font-bold text-[#c89b7b] underline hover:text-white">Login</Link></div>
        </div>
      </div>
    </div>
  );
}
