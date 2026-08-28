import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import BarCompare from "../components/dashboard/BarCompare";

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";

const PALETTE = ["#c89b7b", "#7ba8c8", "#8fc87b", "#c87ba0", "#c8a37b", "#a87bc8", "#c87b7b", "#7bc8be"];

const empty = { name: "", shortName: "", city: "", idLabel: "Student ID", color: PALETTE[0], status: "active", notes: "" };

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [show, setShow] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    axiosInstance
      .get("/universities")
      .then((res) => setUniversities(res.data.universities || []))
      .catch((e) => setMsg(e.response?.data?.message || "Could not load universities."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () =>
      universities
        .filter((u) => statusFilter === "all" || u.status === statusFilter)
        .filter((u) => `${u.name} ${u.shortName} ${u.city}`.toLowerCase().includes(search.toLowerCase())),
    [universities, search, statusFilter]
  );

  const stats = useMemo(() => {
    const totalStudents = universities.reduce((sum, u) => sum + (u.studentCount || 0), 0);
    const active = universities.filter((u) => u.status === "active").length;
    const top = [...universities].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))[0];
    return { total: universities.length, active, totalStudents, top };
  }, [universities]);

  const chartItems = useMemo(
    () =>
      [...universities]
        .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
        .slice(0, 6)
        .map((u) => ({ label: u.shortName || u.name, value: u.studentCount || 0, color: u.color || "#c89b7b" })),
    [universities]
  );

  const openCreate = () => {
    setForm(empty);
    setSelected(null);
    setMsg("");
    setShow("form");
  };

  const openEdit = (u) => {
    setForm({
      name: u.name,
      shortName: u.shortName || "",
      city: u.city || "",
      idLabel: u.idLabel || "Student ID",
      color: u.color || PALETTE[0],
      status: u.status,
      notes: u.notes || "",
    });
    setSelected(u);
    setMsg("");
    setShow("form");
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await axiosInstance.patch(`/universities/${selected._id}`, form);
      } else {
        await axiosInstance.post("/universities", form);
      }
      setShow("");
      setSelected(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not save university.");
    }
  };

  const toggleStatus = async (u) => {
    try {
      await axiosInstance.patch(`/universities/${u._id}`, {
        status: u.status === "active" ? "inactive" : "active",
      });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not update status.");
    }
  };

  const remove = async (u) => {
    if (!confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/universities/${u._id}`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not delete university.");
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Universities</h1>
          <p className="text-xs text-[#a39081]">
            Manage the university categories applicants choose from at registration.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] transition hover:bg-[#b08567]"
        >
          + Add University
        </button>
      </div>

      {msg && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">{msg}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Universities", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Students Linked", value: stats.totalStudents },
          { label: "Top University", value: stats.top?.shortName || stats.top?.name || "—", small: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[#a39081]">{s.label}</p>
            <p className={`mt-1 font-extrabold ${s.small ? "text-lg" : "text-3xl"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {chartItems.length > 0 && (
        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#a39081]">
            Student Distribution by University
          </h2>
          <BarCompare items={chartItems} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, code or city..."
          className={`${field} max-w-xs`}
        />
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize ${statusFilter === s ? "bg-[#c89b7b] text-[#1e1713]" : "bg-[#16110e] text-[#a39081]"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#a39081]">Loading universities...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4a3b32] p-10 text-center text-sm text-[#a39081]">
          No universities match your filters yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <div
              key={u._id}
              className="flex flex-col justify-between rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-[#1e1713]"
                      style={{ backgroundColor: u.color || "#c89b7b" }}
                    >
                      {initials(u.shortName || u.name)}
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight">{u.name}</h3>
                      <p className="text-[11px] text-[#a39081]">{u.city || "No city set"}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      u.status === "active" ? "bg-emerald-900/60 text-emerald-300" : "bg-[#2d231d] text-[#a39081]"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs">
                  <div>
                    <p className="text-[#a39081]">Students</p>
                    <p className="text-lg font-extrabold">{u.studentCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[#a39081]">ID Label</p>
                    <p className="font-semibold">{u.idLabel || "Student ID"}</p>
                  </div>
                </div>

                {u.notes && <p className="mt-3 text-xs text-[#a39081]">{u.notes}</p>}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => openEdit(u)}
                  className="rounded-lg bg-[#c89b7b] px-3 py-1.5 text-xs font-bold text-[#1e1713]"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleStatus(u)}
                  className="rounded-lg bg-[#4a3b32] px-3 py-1.5 text-xs font-bold"
                >
                  {u.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => remove(u)}
                  className="rounded-lg bg-rose-700/70 px-3 py-1.5 text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show === "form" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShow("")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6"
          >
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">{selected ? "Edit University" : "Add University"}</h2>
              <button type="button" onClick={() => setShow("")}>
                ✕
              </button>
            </div>

            <form onSubmit={save} className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-[#a39081]">University Name *</label>
                <input
                  required
                  className={field}
                  placeholder="e.g. Adama Science and Technology University"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a39081]">Short Code</label>
                  <input
                    className={field}
                    placeholder="e.g. ASTU"
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a39081]">City</label>
                  <input
                    className={field}
                    placeholder="e.g. Adama"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">Registration ID Label</label>
                <input
                  className={field}
                  placeholder="e.g. Student ID, Matric No."
                  value={form.idLabel}
                  onChange={(e) => setForm({ ...form, idLabel: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-[#a39081]">
                  Shown as the ID field label on the registration page for this university.
                </p>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">Badge Color</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {PALETTE.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-7 w-7 rounded-full border-2 ${form.color === c ? "border-[#f5efe6]" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">Status</label>
                <select
                  className={field}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active — visible on registration</option>
                  <option value="inactive">Inactive — hidden from registration</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">Admin Notes</label>
                <textarea
                  rows="2"
                  className={`${field} resize-none`}
                  placeholder="Optional internal notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {msg && <p className="text-xs text-rose-400">{msg}</p>}

              <button className="w-full rounded-xl bg-[#c89b7b] py-3 font-bold text-[#1e1713]">
                {selected ? "Save Changes" : "Create University"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
