import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const inputStyle = "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-4 py-3 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none placeholder:text-[#a39081]";

export default function SettingsPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const r = await axiosInstance.post("/auth/change-password", form);
      setMessage(r.data.message || "Password successfully changed!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to change password. Please check your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 text-[#f5efe6]">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-xs text-[#a39081] mt-1">
          Manage your account security and preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6 shadow-xl">
        <h2 className="font-bold text-lg text-[#f5efe6]">Change Password</h2>
        <p className="text-xs text-[#a39081] mt-0.5">
          Ensure your account is using a secure password to stay safe.
        </p>

        {message && (
          <p className="mt-4 rounded-xl border border-[#4a3b32] bg-[#16110e] p-3 text-xs text-amber-400">
            {message}
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {[
            ["currentPassword", "Current password"],
            ["newPassword", "New password"],
            ["confirmPassword", "Confirm new password"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-[#a39081] mb-1 block">
                {label}
              </label>
              <input
                required
                minLength={6}
                type="password"
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
                placeholder={`Enter ${label.toLowerCase()}`}
                className={inputStyle}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#c89b7b] px-6 py-3 text-xs font-bold text-[#1e1713] transition hover:bg-[#b08567] mt-2"
          >
            {loading ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}