import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const emptyForm = {
  fullName: "",
  email: "",
  role: "student",
  department: "",
  gender: "Male",
  yearOfStudy: "1st Year",
};

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";
const roleOptions = ["student", "mentor", "admin"];

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, m, p] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/users/mentors"),
        axiosInstance.get("/users/applications/pending"),
      ]);
      setUsers(u.data.users || []);
      setMentors(m.data.mentors || []);
      setPending(p.data.users || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.fullName} ${u.email} ${u.role}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [users, search]
  );

  const active = filtered.filter((u) => u.status === "approved");

  const updateUser = async (id, data) => {
    try {
      await axiosInstance.patch(`/users/${id}`, data);
      setMessage("User updated successfully.");
      await fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Update failed.");
    }
  };

  const updateStatus = (id, status, isActive) =>
    updateUser(id, { status, isActive });

  const assign = async (studentId, mentorId) => {
    try {
      if (mentorId)
        await axiosInstance.post(`/users/${studentId}/assign-mentor`, {
          mentorId,
        });
      else await axiosInstance.delete(`/users/${studentId}/assign-mentor`);
      await fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Assignment failed.");
    }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await axiosInstance.post("/users", form);
      setMessage(r.data.message);
      setShowCreate(false);
      setForm(emptyForm);
      await fetchData();
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not create user.");
    }
  };

  const openEdit = (u) => {
    setForm({
      fullName: u.fullName || "",
      email: u.email || "",
      role: u.role || "student",
      department: u.department || "",
      gender: u.gender || "Male",
      yearOfStudy: u.yearOfStudy || "1st Year",
      githubUrl: u.githubUrl || "",
      leetcodeUrl: u.leetcodeUrl || "",
      codeforcesUrl: u.codeforcesUrl || "",
    });
    setSelected(u);
    setShowEdit(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await updateUser(selected._id, form);
    setShowEdit(false);
    setSelected(null);
  };

  const openDetails = async (id) => {
    try {
      const r = await axiosInstance.get(`/users/${id}`);
      setSelected(r.data.user);
    } catch {
      alert("Could not load user details.");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      await fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed.");
    }
  };

  const UserRow = ({ user, pendingRow = false }) => (
    <tr className="border-t border-[#4a3b32] hover:bg-[#2d231d]/40">
      <td className="p-4 font-bold">{user.fullName}</td>
      <td className="p-4 text-[#a39081]">{user.email}</td>
      <td className="p-4 uppercase text-[#c89b7b]">{user.role}</td>
      <td className="p-4">
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
            user.status === "approved" && user.isActive
              ? "bg-emerald-900/40 text-emerald-300"
              : user.status === "rejected"
              ? "bg-rose-900/40 text-rose-300"
              : "bg-amber-900/40 text-amber-300"
          }`}
        >
          {user.status === "approved"
            ? user.isActive
              ? "Active"
              : "Suspended"
            : user.status || "Pending"}
        </span>
      </td>
      <td className="p-4 text-right whitespace-nowrap">
        <button
          onClick={() => openDetails(user._id)}
          className="mr-2 rounded-lg bg-[#4a3b32] px-3 py-1"
        >
          View
        </button>
        {pendingRow ? (
          <>
            <button
              onClick={() => updateStatus(user._id, "approved", true)}
              className="mr-2 rounded-lg bg-emerald-700/70 px-3 py-1"
            >
              Accept
            </button>
            <button
              onClick={() => updateStatus(user._id, "rejected", false)}
              className="rounded-lg bg-rose-700/70 px-3 py-1"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => openEdit(user)}
              className="mr-2 rounded-lg bg-[#c89b7b] px-3 py-1 text-[#1e1713]"
            >
              Edit
            </button>
            <select
              value={user.isActive ? "active" : "suspended"}
              onChange={(e) =>
                updateStatus(user._id, "approved", e.target.value === "active")
              }
              className="mr-2 rounded-lg bg-[#16110e] border border-[#4a3b32] px-2 py-1"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() => deleteUser(user._id)}
              className="rounded-lg bg-rose-700/70 px-3 py-1"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">User Management</h1>
          <p className="text-xs text-[#a39081]">
            Manage users, roles, applications and mentor assignments.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]"
        >
          + Create User
        </button>
      </div>

      {message && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`rounded-xl px-4 py-2 text-xs font-bold ${
            tab === "users"
              ? "bg-[#c89b7b] text-[#1e1713]"
              : "bg-[#1e1713] text-[#a39081]"
          }`}
        >
          All Users ({active.length})
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`rounded-xl px-4 py-2 text-xs font-bold ${
            tab === "pending"
              ? "bg-[#c89b7b] text-[#1e1713]"
              : "bg-[#1e1713] text-[#a39081]"
          }`}
        >
          Pending Applications ({pending.length})
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email or role..."
        className={field}
      />

      {loading ? (
        <p className="text-[#a39081]">Loading...</p>
      ) : tab === "users" ? (
        <>
          <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] overflow-hidden">
            <div className="border-b border-[#4a3b32] p-4">
              <h2 className="font-bold">All Users</h2>
              <p className="text-[11px] text-[#a39081]">
                Edit profile details and switch Student / Mentor / Admin roles.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#16110e] text-[#a39081]">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">State</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((u) => (
                    <UserRow key={u._id} user={u} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] overflow-hidden">
            <div className="border-b border-[#4a3b32] p-4">
              <h2 className="font-bold">Assign Students to Mentors</h2>
              <p className="text-[11px] text-[#a39081]">
                Mentors can only manage students assigned to them.
              </p>
            </div>
            <div className="divide-y divide-[#4a3b32]">
              {active
                .filter((u) => u.role === "student")
                .map((s) => (
                  <div
                    key={s._id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs"
                  >
                    <div>
                      <b>{s.fullName}</b>
                      <p className="text-[#a39081]">{s.email}</p>
                    </div>
                    <select
                      value={s.mentor?._id || ""}
                      onChange={(e) => assign(s._id, e.target.value)}
                      className={field + " max-w-xs"}
                    >
                      <option value="">Unassigned</option>
                      {mentors.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] overflow-hidden">
          <div className="border-b border-[#4a3b32] p-4">
            <h2 className="font-bold">Pending Applications</h2>
            <p className="text-[11px] text-[#a39081]">
              Review registration information. Passwords are never returned by the API.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16110e] text-[#a39081]">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending
                  .filter((u) =>
                    `${u.fullName} ${u.email} ${u.role}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((u) => (
                    <UserRow key={u._id} user={u} pendingRow />
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && !showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6 text-[#f5efe6]"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-bold">User Details</h2>
                <p className="text-xs text-[#a39081]">
                  Password is intentionally never displayed.
                </p>
              </div>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                ["Full Name", selected.fullName],
                ["Email", selected.email],
                ["Role", selected.role],
                ["Status", selected.status || "pending"],
                ["Active", selected.isActive ? "Yes" : "No"],
                ["Gender", selected.gender || "—"],
                ["Department", selected.department || "—"],
                ["Year", selected.yearOfStudy || "—"],
                ["Mentor", selected.mentor?.fullName || "Unassigned"],
                ["GitHub", selected.githubUrl || "—"],
                ["LeetCode", selected.leetcodeUrl || "—"],
                ["Codeforces", selected.codeforcesUrl || "—"],
                ["Why join", selected.bootcampReason || "—"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-[#4a3b32] bg-[#16110e] p-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#a39081]">
                    {k}
                  </p>
                  <p className="mt-1 break-words">{v}</p>
                </div>
              ))}
            </div>
            {selected.status === "pending" && (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    updateStatus(selected._id, "approved", true);
                    setSelected(null);
                  }}
                  className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    updateStatus(selected._id, "rejected", false);
                    setSelected(null);
                  }}
                  className="rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showEdit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-xl rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6 text-[#f5efe6]"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button type="button" onClick={() => setShowEdit(false)}>
                ✕
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                required
                placeholder="Full name"
                className={field}
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
              />
              <input
                required
                type="email"
                placeholder="Email"
                className={field}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <select
                className={field}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <input
                placeholder="Department"
                className={field}
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
              <select
                className={field}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <select
                className={field}
                value={form.yearOfStudy}
                onChange={(e) =>
                  setForm({ ...form, yearOfStudy: e.target.value })
                }
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y}>
                    {y}
                    {y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year
                  </option>
                ))}
              </select>
              <input
                placeholder="GitHub URL"
                className={field}
                value={form.githubUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, githubUrl: e.target.value })
                }
              />
              <input
                placeholder="LeetCode URL"
                className={field}
                value={form.leetcodeUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, leetcodeUrl: e.target.value })
                }
              />
              <input
                placeholder="Codeforces URL"
                className={field}
                value={form.codeforcesUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, codeforcesUrl: e.target.value })
                }
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={create}
            className="w-full max-w-lg rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6 text-[#f5efe6]"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Create User</h2>
              <button type="button" onClick={() => setShowCreate(false)}>
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-[#a39081]">
              A temporary password is generated and emailed automatically.
            </p>
            <div className="mt-5 space-y-3">
              <input
                required
                placeholder="Full name"
                className={field}
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
              />
              <input
                required
                type="email"
                placeholder="Email"
                className={field}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={field}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Department"
                  className={field}
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={field}
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <select
                  className={field}
                  value={form.yearOfStudy}
                  onChange={(e) =>
                    setForm({ ...form, yearOfStudy: e.target.value })
                  }
                >
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y}>
                      {y}
                      {y === 1 ? "st" : y === 2 ? "nd" : y === 3 ? "rd" : "th"} Year
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]">
                Create & Email Credentials
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}