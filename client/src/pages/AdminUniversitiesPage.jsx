import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import BarCompare from "../components/dashboard/BarCompare";

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";

const PALETTE = [
  "#c89b7b",
  "#7ba8c8",
  "#8fc87b",
  "#c87ba0",
  "#c8a37b",
  "#a87bc8",
  "#c87b7b",
  "#7bc8be",
];

const empty = {
  name: "",
  shortName: "",
  city: "",
  idLabel: "Student ID",
  color: PALETTE[0],
  status: "active",
  notes: "",
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "U";

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [show, setShow] =
    useState("");

  const [selected, setSelected] =
    useState(null);

  const [form, setForm] =
    useState(empty);

  const [msg, setMsg] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const load = async () => {
    setLoading(true);

    try {
      const response =
        await axiosInstance.get(
          "/universities"
        );

      setUniversities(
        response.data.universities ||
          []
      );

      setMsg("");
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not load universities."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      universities
        .filter(
          (university) =>
            statusFilter === "all" ||
            university.status ===
              statusFilter
        )
        .filter((university) =>
          `${university.name} ${university.shortName} ${university.city}`
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
        ),
    [
      universities,
      search,
      statusFilter,
    ]
  );

  const stats = useMemo(() => {
    const totalStudents =
      universities.reduce(
        (sum, university) =>
          sum +
          Number(
            university.studentCount || 0
          ),
        0
      );

    const active =
      universities.filter(
        (university) =>
          university.status ===
          "active"
      ).length;

    const top = [
      ...universities,
    ].sort(
      (a, b) =>
        Number(b.studentCount || 0) -
        Number(a.studentCount || 0)
    )[0];

    return {
      total: universities.length,
      active,
      totalStudents,
      top,
    };
  }, [universities]);

  const chartItems = useMemo(
    () =>
      [...universities]
        .sort(
          (a, b) =>
            Number(
              b.studentCount || 0
            ) -
            Number(
              a.studentCount || 0
            )
        )
        .slice(0, 6)
        .map((university) => ({
          label:
            university.shortName ||
            university.name,
          value:
            Number(
              university.studentCount ||
                0
            ),
          color:
            university.color ||
            "#c89b7b",
        })),
    [universities]
  );

  const openCreate = () => {
    setForm(empty);
    setSelected(null);
    setMsg("");
    setShow("form");
  };

  const openEdit = (university) => {
    setForm({
      name: university.name,
      shortName:
        university.shortName || "",
      city: university.city || "",
      idLabel:
        university.idLabel ||
        "Student ID",
      color:
        university.color ||
        PALETTE[0],
      status:
        university.status ||
        "active",
      notes:
        university.notes || "",
    });

    setSelected(university);
    setMsg("");
    setShow("form");
  };

  const save = async (event) => {
    event.preventDefault();

    setMsg("");

    try {
      if (selected) {
        await axiosInstance.patch(
          `/universities/${selected._id}`,
          form
        );
      } else {
        await axiosInstance.post(
          "/universities",
          form
        );
      }

      setShow("");
      setSelected(null);

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not save university."
      );
    }
  };

  const toggleStatus = async (
    university
  ) => {
    try {
      await axiosInstance.patch(
        `/universities/${university._id}`,
        {
          status:
            university.status ===
            "active"
              ? "inactive"
              : "active",
        }
      );

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not update status."
      );
    }
  };

  const remove = async (
    university
  ) => {
    if (
      !confirm(
        `Delete "${university.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/universities/${university._id}`
      );

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not delete university."
      );
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            Universities
          </h1>

          <p className="text-xs text-[#a39081]">
            Manage university categories
            used during registration.
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
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {msg}
        </p>
      )}

      {/* TOP COUNTS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
            Universities
          </p>

          <p className="mt-1 text-3xl font-extrabold">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
            Active
          </p>

          <p className="mt-1 text-3xl font-extrabold">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
            Students Linked
          </p>

          <p className="mt-1 text-3xl font-extrabold">
            {stats.totalStudents}
          </p>
        </div>

        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-4">
          <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
            Top University
          </p>

          <p className="mt-1 text-lg font-extrabold">
            {stats.top?.shortName ||
              stats.top?.name ||
              "—"}
          </p>
        </div>
      </div>

      {chartItems.length > 0 && (
        <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#a39081]">
            Student Distribution by University
          </h2>

          <BarCompare
            items={chartItems}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search name, code or city..."
          className={`${field} max-w-xs`}
        />

        <div className="flex gap-2">
          {[
            "all",
            "active",
            "inactive",
          ].map((status) => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(
                  status
                )
              }
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize ${
                statusFilter === status
                  ? "bg-[#c89b7b] text-[#1e1713]"
                  : "bg-[#16110e] text-[#a39081]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#a39081]">
          Loading universities...
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4a3b32] p-10 text-center text-sm text-[#a39081]">
          No universities match your
          filters yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(
            (university) => (
              <div
                key={
                  university._id
                }
                className="flex flex-col justify-between rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-[#1e1713]"
                        style={{
                          backgroundColor:
                            university.color ||
                            "#c89b7b",
                        }}
                      >
                        {initials(
                          university.shortName ||
                            university.name
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold leading-tight">
                          {
                            university.name
                          }
                        </h3>

                        <p className="text-[11px] text-[#a39081]">
                          {university.city ||
                            "No city set"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        university.status ===
                        "active"
                          ? "bg-emerald-900/60 text-emerald-300"
                          : "bg-[#2d231d] text-[#a39081]"
                      }`}
                    >
                      {
                        university.status
                      }
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-[#a39081]">
                        Students
                      </p>

                      <p className="text-lg font-extrabold">
                        {Number(
                          university.studentCount ||
                            0
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#a39081]">
                        ID Label
                      </p>

                      <p className="font-semibold">
                        {university.idLabel ||
                          "Student ID"}
                      </p>
                    </div>
                  </div>

                  {university.notes && (
                    <p className="mt-3 text-xs text-[#a39081]">
                      {
                        university.notes
                      }
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      openEdit(
                        university
                      )
                    }
                    className="rounded-lg bg-[#c89b7b] px-3 py-1.5 text-xs font-bold text-[#1e1713]"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      toggleStatus(
                        university
                      )
                    }
                    className="rounded-lg bg-[#4a3b32] px-3 py-1.5 text-xs font-bold"
                  >
                    {university.status ===
                    "active"
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    onClick={() =>
                      remove(
                        university
                      )
                    }
                    className="rounded-lg bg-rose-700/70 px-3 py-1.5 text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {show === "form" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() =>
            setShow("")
          }
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6"
          >
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">
                {selected
                  ? "Edit University"
                  : "Add University"}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShow("")
                }
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={save}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="text-xs text-[#a39081]">
                  University Name *
                </label>

                <input
                  required
                  className={field}
                  placeholder="e.g. Adama Science and Technology University"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target
                        .value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a39081]">
                    Short Code
                  </label>

                  <input
                    className={field}
                    placeholder="e.g. ASTU"
                    value={
                      form.shortName
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        shortName:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs text-[#a39081]">
                    City
                  </label>

                  <input
                    className={field}
                    placeholder="e.g. Adama"
                    value={form.city}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        city: event.target
                          .value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  Registration ID Label
                </label>

                <input
                  className={field}
                  placeholder="e.g. Student ID, Matric No."
                  value={
                    form.idLabel
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      idLabel:
                        event.target
                          .value,
                    })
                  }
                />

                <p className="mt-1 text-[10px] text-[#a39081]">
                  This becomes the ID field
                  label on registration.
                </p>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  Badge Color
                </label>

                <div className="mt-1 flex flex-wrap gap-2">
                  {PALETTE.map(
                    (color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() =>
                          setForm({
                            ...form,
                            color,
                          })
                        }
                        className={`h-7 w-7 rounded-full border-2 ${
                          form.color ===
                          color
                            ? "border-[#f5efe6]"
                            : "border-transparent"
                        }`}
                        style={{
                          backgroundColor:
                            color,
                        }}
                        aria-label={
                          color
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  Status
                </label>

                <select
                  className={field}
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="active">
                    Active — visible on
                    registration
                  </option>

                  <option value="inactive">
                    Inactive — hidden from
                    registration
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  Admin Notes
                </label>

                <textarea
                  rows="2"
                  className={`${field} resize-none`}
                  placeholder="Optional internal notes..."
                  value={
                    form.notes
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes:
                        event.target
                          .value,
                    })
                  }
                />
              </div>

              {msg && (
                <p className="text-xs text-rose-400">
                  {msg}
                </p>
              )}

              <button className="w-full rounded-xl bg-[#c89b7b] py-3 font-bold text-[#1e1713]">
                {selected
                  ? "Save Changes"
                  : "Create University"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}