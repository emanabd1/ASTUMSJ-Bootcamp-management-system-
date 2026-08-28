import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";
const roles = ["student", "mentor", "admin"];
const empty = {
  fullName: "",
  email: "",
  role: "student",
  department: "",
  gender: "Male",
  yearOfStudy: "1st Year",
  githubUrl: "",
  leetcodeUrl: "",
  codeforcesUrl: "",
  batchId: "",
};
export default function AdminUserManagement() {
  const [users, setUsers] = useState([]),
    [mentors, setMentors] = useState([]),
    [pending, setPending] = useState([]),
    [batches, setBatches] = useState([]),
    [pendingBatches, setPendingBatches] = useState({}),
    [tab, setTab] = useState("users"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [form, setForm] = useState(empty),
    [show, setShow] = useState(""),
    [msg, setMsg] = useState("");
  const load = async () => {
    try {
      const [u, m, p, b] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/users/mentors"),
        axiosInstance.get("/users/applications/pending"),
        axiosInstance.get("/batches"),
      ]);
      setUsers(u.data.users || []);
      setMentors(m.data.mentors || []);
      setPending(p.data.users || []);
      setBatches(b.data.batches || []);
    } catch (e) {
      setMsg(e.response?.data?.message || "Could not load users.");
    }
  };
  useEffect(() => {
    Promise.all([
      axiosInstance.get("/users"),
      axiosInstance.get("/users/mentors"),
      axiosInstance.get("/users/applications/pending"),
      axiosInstance.get("/batches"),
    ]).then(([userResponse, mentorResponse, pendingResponse, batchResponse]) => {
      setUsers(userResponse.data.users || []);
      setMentors(mentorResponse.data.mentors || []);
      setPending(pendingResponse.data.users || []);
      setBatches(batchResponse.data.batches || []);
    }).catch((e) => setMsg(e.response?.data?.message || "Could not load users."));
  }, []);
  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.fullName} ${u.email} ${u.role}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [users, search],
  );
  const update = async (id, data) => {
    try {
      await axiosInstance.patch(`/users/${id}`, data);
      setMsg("Updated successfully.");
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Update failed.");
    }
  };
  const assign = async (studentId, mentorId) => {
    try {
      let response;
      if (mentorId)
        response = await axiosInstance.post(`/users/${studentId}/assign-mentor`, {
          mentorId,
        });
      else response = await axiosInstance.delete(`/users/${studentId}/assign-mentor`);
      setMsg(response.data.message || "Mentor assignment updated successfully.");
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Assignment failed.");
    }
  };
  const create = async (e) => {
    e.preventDefault();
    try {
      const r = await axiosInstance.post("/users", form);
      setMsg(r.data.message);
      setShow("");
      setForm(empty);
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || "Could not create user.");
    }
  };
  const save = async (e) => {
    e.preventDefault();
    await update(selected._id, form);
    setShow("");
    setSelected(null);
  };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ ...empty, ...u });
    setShow("edit");
  };
  const openView = async (id) => {
    const r = await axiosInstance.get(`/users/${id}`);
    setSelected(r.data.user);
    setShow("view");
  };
  const remove = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    await axiosInstance.delete(`/users/${id}`);
    load();
  };
  const Row = ({ u, p = false }) => (
    <tr className="border-t border-[#4a3b32] hover:bg-[#2d231d]/40">
      <td className="p-4 font-bold">{u.fullName}</td>
      <td className="p-4 text-[#a39081]">{u.email}</td>
      <td className="p-4 uppercase text-[#c89b7b]">{u.role}</td>
      <td className="p-4">
        {u.status === "approved"
          ? u.isActive
            ? "Active"
            : "Suspended"
          : u.status}
      </td>
      <td className="p-4 text-right whitespace-nowrap">
        <button
          onClick={() => openView(u._id)}
          className="mr-2 rounded-lg bg-[#4a3b32] px-3 py-1"
        >
          View
        </button>
        {p ? (
          <>
            <select
              value={pendingBatches[u._id] || ""}
              onChange={(e) => setPendingBatches({ ...pendingBatches, [u._id]: e.target.value })}
              className="mr-2 max-w-36 rounded-lg border border-[#4a3b32] bg-[#16110e] px-2 py-1 text-xs"
            >
              <option value="">No batch</option>
              {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}
            </select>
            <button
              onClick={() =>
                update(u._id, { status: "approved", isActive: true, batchId: pendingBatches[u._id] || undefined })
              }
              className="mr-2 rounded-lg bg-emerald-700/70 px-3 py-1"
            >
              Accept
            </button>
            <button
              onClick={() =>
                update(u._id, { status: "rejected", isActive: false })
              }
              className="rounded-lg bg-rose-700/70 px-3 py-1"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => openEdit(u)}
              className="mr-2 rounded-lg bg-[#c89b7b] px-3 py-1 text-[#1e1713]"
            >
              Edit
            </button>
            <select
              value={u.isActive ? "active" : "suspended"}
              onChange={(e) =>
                update(u._id, {
                  status: "approved",
                  isActive: e.target.value === "active",
                })
              }
              className="mr-2 rounded-lg bg-[#16110e] border border-[#4a3b32] px-2 py-1"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={() => remove(u._id)}
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
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">User Management</h1>
          <p className="text-xs text-[#a39081]">
            Users, pending applications and mentor assignments.
          </p>
        </div>
        <button
          onClick={() => setShow("create")}
          className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]"
        >
          + Create User
        </button>
      </div>
      {msg && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {msg}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("users")}
          className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "users" ? "bg-[#c89b7b] text-[#1e1713]" : "bg-[#1e1713]"}`}
        >
          All Users
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "pending" ? "bg-[#c89b7b] text-[#1e1713]" : "bg-[#1e1713]"}`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("mentors")}
          className={`rounded-xl px-4 py-2 text-xs font-bold ${tab === "mentors" ? "bg-[#c89b7b] text-[#1e1713]" : "bg-[#1e1713]"}`}
        >
          Manage Mentors
        </button>
      </div>
      {tab !== "mentors" && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or role..."
          className={field}
        />
      )}{" "}
      {tab === "users" && (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] overflow-hidden">
          <div className="p-4 border-b border-[#4a3b32]">
            <h2 className="font-bold">All Users</h2>
            <p className="text-[11px] text-[#a39081]">
              Edit profile information and switch between Student, Mentor and
              Admin.
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
                {filtered.map((u) => (
                  <Row key={u._id} u={u} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "pending" && (
        <section className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] overflow-hidden">
          <div className="p-4 border-b border-[#4a3b32]">
            <h2 className="font-bold">Pending Applications</h2>
            <p className="text-[11px] text-[#a39081]">
              Review registration data. Passwords are never shown.
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
                    `${u.fullName} ${u.email}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((u) => (
                    <Row key={u._id} u={u} p />
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "mentors" && (
        <section className="space-y-4">
          <p className="text-xs text-[#a39081]">
            Choose a mentor first, then select students from the complete active
            student list. Students are stored with the selected mentor.
          </p>
          {mentors.map((m) => (
            <MentorCard
              key={m._id}
              mentor={m}
              students={users.filter(
                (u) =>
                  u.role === "student" && u.status === "approved" && u.isActive,
              )}
              assign={assign}
            />
          ))}
        </section>
      )}
      {show && (
        <div
          className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center"
          onClick={() => setShow("")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6"
          >
            {show === "view" && selected && (
              <>
                <div className="flex justify-between">
                  <h2 className="text-2xl font-bold">User Details</h2>
                  <button onClick={() => setShow("")}>✕</button>
                </div>
                <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Full Name", selected.fullName],
                    ["Email", selected.email],
                    ["Role", selected.role],
                    ["Status", selected.status],
                    ["Active", selected.isActive ? "Yes" : "No"],
                    ["Gender", selected.gender || "—"],
                    ["Department", selected.department || "—"],
                    ["Year", selected.yearOfStudy || "—"],
                    ["Mentor", selected.mentor?.fullName || "Unassigned"],
                    ["GitHub", selected.githubUrl || "—"],
                    ["LeetCode", selected.leetcodeUrl || "—"],
                    ["Codeforces", selected.codeforcesUrl || "—"],
                    ["Why Join", selected.bootcampReason || "—"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl border border-[#4a3b32] p-3"
                    >
                      <p className="text-[10px] uppercase text-[#a39081]">
                        {k}
                      </p>
                      <p className="break-words mt-1">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => openEdit(selected)}
                    className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]"
                  >
                    Edit User
                  </button>
                  {selected.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          update(selected._id, {
                            status: "approved",
                            isActive: true,
                          });
                          setShow("");
                        }}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          update(selected._id, {
                            status: "rejected",
                            isActive: false,
                          });
                          setShow("");
                        }}
                        className="rounded-xl bg-rose-700 px-4 py-2 text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
            {show === "create" && (
              <form onSubmit={create} className="space-y-3">
                <h2 className="text-2xl font-bold">Create User</h2>
                <p className="text-xs text-[#a39081]">
                  A temporary password will be generated and emailed.
                </p>
                <input
                  className={field}
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                />
                <input
                  className={field}
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <select
                  className={field}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select
                  className={field}
                  value={form.batchId || ""}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                >
                  <option value="">No batch</option>
                  {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}
                </select>
                <input
                  className={field}
                  placeholder="Department"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                />
                <button className="w-full rounded-xl bg-[#c89b7b] py-3 font-bold text-[#1e1713]">
                  Create
                </button>
              </form>
            )}
            {show === "edit" && selected && (
              <form onSubmit={save} className="space-y-3">
                <div className="flex justify-between">
                  <h2 className="text-2xl font-bold">Edit User</h2>
                  <button type="button" onClick={() => setShow("")}>
                    ✕
                  </button>
                </div>
                {[
                  ["fullName", "Full name"],
                  ["email", "Email"],
                  ["department", "Department"],
                  ["githubUrl", "GitHub URL"],
                  ["leetcodeUrl", "LeetCode URL"],
                  ["codeforcesUrl", "Codeforces URL"],
                ].map(([k, l]) => (
                  <input
                    key={k}
                    className={field}
                    placeholder={l}
                    value={form[k] || ""}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                ))}
                <select
                  className={field}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
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
                  {[
                    "1st Year",
                    "2nd Year",
                    "3rd Year",
                    "4th Year",
                    "5th Year",
                  ].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
                <button className="w-full rounded-xl bg-[#c89b7b] py-3 font-bold text-[#1e1713]">
                  Save Changes
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function MentorCard({ mentor, students, assign }) {
  const [selected, setSelected] = useState(
    students.filter((s) => s.mentor?._id === mentor._id).map((s) => s._id),
  );
  const toggle = (id) =>
    setSelected((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  const save = async () => {
    for (const s of students) {
      const should = selected.includes(s._id);
      const has = s.mentor?._id === mentor._id;
      if (should && !has) await assign(s._id, mentor._id);
      if (!should && has) await assign(s._id, "");
    }
  };
  return (
    <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="font-bold">{mentor.fullName}</h2>
          <p className="text-xs text-[#a39081]">{mentor.email}</p>
        </div>
        <button
          onClick={save}
          className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]"
        >
          Save Students
        </button>
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-2">
        {students.map((s) => (
          <label
            key={s._id}
            className="flex items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-xs"
          >
            <input
              type="checkbox"
              checked={selected.includes(s._id)}
              onChange={() => toggle(s._id)}
            />
            <span>
              <b>{s.fullName}</b>
              <br />
              <span className="text-[#a39081]">
                {s.email} · Current: {s.mentor?.fullName || "Unassigned"}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
