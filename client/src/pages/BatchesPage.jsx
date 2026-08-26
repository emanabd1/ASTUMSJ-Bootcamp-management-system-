import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

/* ---------- shared styles ---------- */

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";

const panel =
  "rounded-2xl border border-[#4a3b32] bg-[#1e1713]";

const STATUS_STYLES = {
  upcoming:
    "bg-amber-500/15 text-amber-400 border-amber-500/30",

  active:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",

  completed:
    "bg-[#4a3b32]/40 text-[#a39081] border-[#4a3b32]",
};

const AVATAR_HUES = [
  "#c89b7b",
  "#8fb8a8",
  "#c78ba0",
  "#8aa6c8",
  "#c9a44c",
  "#a08bc7",
];

const hueFor = (id = "") => {
  let h = 0;

  for (let i = 0; i < id.length; i++) {
    h =
      (h * 31 + id.charCodeAt(i)) %
      AVATAR_HUES.length;
  }

  return AVATAR_HUES[h];
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) => part[0]?.toUpperCase() || ""
    )
    .join("") || "?";

function Avatar({ person, size = 8 }) {
  const px =
    size === 8
      ? "h-8 w-8 text-[11px]"
      : "h-6 w-6 text-[10px]";

  return (
    <div
      title={person.fullName}
      className={`flex ${px} shrink-0 items-center justify-center rounded-full border-2 border-[#1e1713] font-bold text-[#1e1713]`}
      style={{
        backgroundColor: hueFor(person._id),
      }}
    >
      {initials(person.fullName)}
    </div>
  );
}

/* ---------- icons ---------- */

const IconSearch = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconClose = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IconPencil = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const IconTrash = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
  </svg>
);

const IconUsers = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCap = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="m22 10-10-5L2 10l10 5 10-5Z" />
    <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
  </svg>
);

const IconPlus = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconChevron = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconCheck = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    {...p}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconAlert = (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...p}
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const emptyBatchForm = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "upcoming",
};

const emptyGroupForm = {
  name: "",
  description: "",
};

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);

  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [groupsByBatch, setGroupsByBatch] = useState({});

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [batchSearch, setBatchSearch] = useState("");

  const [expandedBatch, setExpandedBatch] =
    useState(null);

  const [creatingBatch, setCreatingBatch] =
    useState(false);

  const [batchForm, setBatchForm] =
    useState(emptyBatchForm);

  const [creatingBatchBusy, setCreatingBatchBusy] =
    useState(false);

  const [editingBatch, setEditingBatch] =
    useState(null);

  const [editBatchForm, setEditBatchForm] =
    useState(emptyBatchForm);

  const [creatingGroupFor, setCreatingGroupFor] =
    useState(null);

  const [groupForm, setGroupForm] =
    useState(emptyGroupForm);

  const [creatingGroupBusy, setCreatingGroupBusy] =
    useState(false);

  const [editingGroup, setEditingGroup] =
    useState(null);

  const [editGroupForm, setEditGroupForm] =
    useState(emptyGroupForm);

  const [rosterGroup, setRosterGroup] =
    useState(null);

  const [rosterMentorIds, setRosterMentorIds] =
    useState([]);

  const [rosterStudentIds, setRosterStudentIds] =
    useState([]);

  const [rosterTab, setRosterTab] =
    useState("mentors");

  const [rosterSearch, setRosterSearch] =
    useState("");

  const [rosterBusy, setRosterBusy] =
    useState(false);

  const flash = (type, text) => {
    setMessage({
      type,
      text,
    });

    window.clearTimeout(flash._t);

    flash._t = window.setTimeout(
      () => setMessage(null),
      4500
    );
  };

  /* =====================================================
     LOAD
  ===================================================== */

  const load = async () => {
    try {
      const [
        batchesResponse,
        studentsResponse,
        mentorsResponse,
      ] = await Promise.all([
        axiosInstance.get("/batches"),
        axiosInstance.get(
          "/users?role=student&status=approved"
        ),
        axiosInstance.get("/users/mentors"),
      ]);

      setBatches(
        batchesResponse.data.batches || []
      );

      setStudents(
        studentsResponse.data.users || []
      );

      setMentors(
        mentorsResponse.data.mentors || []
      );
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not load batches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =====================================================
     LOAD GROUPS FOR ONE BATCH
  ===================================================== */

  const loadGroups = async (batchId) => {
    try {
      const response = await axiosInstance.get(
        `/batches/${batchId}/groups`
      );

      setGroupsByBatch((prev) => ({
        ...prev,
        [batchId]: response.data.groups || [],
      }));
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not load groups."
      );
    }
  };

  const toggleBatch = async (batchId) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      return;
    }

    setExpandedBatch(batchId);

    if (!groupsByBatch[batchId]) {
      await loadGroups(batchId);
    }
  };

  /* =====================================================
     BATCHES
  ===================================================== */

  const submitBatch = async (e) => {
    e.preventDefault();

    setCreatingBatchBusy(true);

    try {
      if (editingBatch) {
        await axiosInstance.patch(
          `/batches/${editingBatch._id}`,
          editBatchForm
        );

        flash(
          "success",
          "Batch details updated."
        );

        setEditingBatch(null);
      } else {
        await axiosInstance.post(
          "/batches",
          batchForm
        );

        flash(
          "success",
          `“${batchForm.name}” batch created.`
        );

        setCreatingBatch(false);
      }

      setBatchForm(emptyBatchForm);
      setEditBatchForm(emptyBatchForm);

      await load();
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not save batch."
      );
    } finally {
      setCreatingBatchBusy(false);
    }
  };

  const openEditBatch = (batch) => {
    setEditingBatch(batch);

    setEditBatchForm({
      name: batch.name,
      description: batch.description || "",
      startDate:
        batch.startDate?.slice(0, 10) || "",
      endDate:
        batch.endDate?.slice(0, 10) || "",
      status: batch.status || "upcoming",
    });
  };

  const removeBatch = async (batch) => {
    if (
      !confirm(
        `Delete “${batch.name}”? All groups inside this batch will also be deleted.`
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/batches/${batch._id}`
      );

      flash(
        "success",
        "Batch and its groups deleted."
      );

      if (expandedBatch === batch._id) {
        setExpandedBatch(null);
      }

      setGroupsByBatch((prev) => {
        const next = {
          ...prev,
        };

        delete next[batch._id];

        return next;
      });

      await load();
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Delete failed."
      );
    }
  };

  /* =====================================================
     GROUPS
  ===================================================== */

  const openCreateGroup = (batchId) => {
    setCreatingGroupFor(batchId);

    setGroupForm(emptyGroupForm);
  };

  const submitGroup = async (e) => {
    e.preventDefault();

    setCreatingGroupBusy(true);

    try {
      await axiosInstance.post(
        `/batches/${creatingGroupFor}/groups`,
        groupForm
      );

      flash(
        "success",
        `“${groupForm.name}” group created.`
      );

      setGroupForm(emptyGroupForm);
      setCreatingGroupFor(null);

      await loadGroups(creatingGroupFor);
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not create group."
      );
    } finally {
      setCreatingGroupBusy(false);
    }
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);

    setEditGroupForm({
      name: group.name,
      description: group.description || "",
    });
  };

  const submitEditGroup = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.patch(
        `/batches/${editingGroup.batch._id}/groups/${editingGroup._id}`,
        editGroupForm
      );

      flash(
        "success",
        "Group details updated."
      );

      setEditingGroup(null);

      await loadGroups(
        editingGroup.batch._id
      );
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not update group."
      );
    }
  };

  const removeGroup = async (group) => {
    if (
      !confirm(
        `Delete “${group.name}”?`
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/batches/${group.batch._id}/groups/${group._id}`
      );

      flash(
        "success",
        "Group deleted."
      );

      await loadGroups(group.batch._id);
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not delete group."
      );
    }
  };

  /* =====================================================
     ROSTER
  ===================================================== */

  const openRoster = (group) => {
    setRosterGroup(group);

    setRosterTab("mentors");

    setRosterSearch("");

    setRosterMentorIds(
      (group.mentors || []).map((item) =>
        typeof item === "string"
          ? item
          : item?._id
      )
    );

    setRosterStudentIds(
      (group.students || []).map((item) =>
        typeof item === "string"
          ? item
          : item?._id
      )
    );
  };

  const closeRoster = () => {
    setRosterGroup(null);
    setRosterSearch("");
  };

  const toggleMentor = (id) => {
    setRosterMentorIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleStudent = (id) => {
    setRosterStudentIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const rosterDirty = useMemo(() => {
    if (!rosterGroup) return false;

    const originalMentors = new Set(
      (rosterGroup.mentors || []).map((item) =>
        typeof item === "string"
          ? item
          : item?._id
      )
    );

    const originalStudents = new Set(
      (rosterGroup.students || []).map((item) =>
        typeof item === "string"
          ? item
          : item?._id
      )
    );

    const sameSet = (a, b) =>
      a.size === b.size &&
      [...a].every((id) => b.has(id));

    return (
      !sameSet(
        originalMentors,
        new Set(rosterMentorIds)
      ) ||
      !sameSet(
        originalStudents,
        new Set(rosterStudentIds)
      )
    );
  }, [
    rosterGroup,
    rosterMentorIds,
    rosterStudentIds,
  ]);

  const saveRoster = async () => {
    if (!rosterGroup) return;

    setRosterBusy(true);

    try {
      await axiosInstance.patch(
        `/batches/${rosterGroup.batch._id}/groups/${rosterGroup._id}/mentors`,
        {
          mentorIds: rosterMentorIds,
        }
      );

      await axiosInstance.patch(
        `/batches/${rosterGroup.batch._id}/groups/${rosterGroup._id}/students`,
        {
          studentIds: rosterStudentIds,
        }
      );

      flash(
        "success",
        `Roster saved for “${rosterGroup.name}”.`
      );

      const batchId = rosterGroup.batch._id;

      closeRoster();

      await loadGroups(batchId);
      await load();
    } catch (e) {
      flash(
        "error",
        e.response?.data?.message ||
          "Could not save group roster."
      );
    } finally {
      setRosterBusy(false);
    }
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const visibleBatches = useMemo(() => {
    const query =
      batchSearch.trim().toLowerCase();

    if (!query) return batches;

    return batches.filter((batch) =>
      `${batch.name} ${batch.description || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [batches, batchSearch]);

  const rosterQuery =
    rosterSearch.trim().toLowerCase();

  const selectedMentors = rosterGroup
    ? rosterMentorIds
        .map((id) =>
          mentors.find(
            (mentor) => mentor._id === id
          )
        )
        .filter(Boolean)
    : [];

  const selectedStudents = rosterGroup
    ? rosterStudentIds
        .map((id) =>
          students.find(
            (student) => student._id === id
          )
        )
        .filter(Boolean)
    : [];

  const mentorCandidates = mentors.filter(
    (mentor) =>
      !rosterMentorIds.includes(mentor._id) &&
      `${mentor.fullName} ${mentor.email}`
        .toLowerCase()
        .includes(rosterQuery)
  );

  const studentCandidates = students.filter(
    (student) =>
      !rosterStudentIds.includes(student._id) &&
      `${student.fullName} ${student.email} ${student.department || ""}`
        .toLowerCase()
        .includes(rosterQuery)
  );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="space-y-7">
      {/* HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#f5efe6]">
            Batches & Groups
          </h1>

          <p className="mt-1 text-xs text-[#a39081]">
            Manage yearly bootcamp batches and the
            mentoring groups inside them.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreatingBatch(
              (current) => !current
            );

            setEditingBatch(null);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer"
        >
          <IconPlus
            className="h-3.5 w-3.5"
            strokeWidth={2.5}
          />

          {creatingBatch
            ? "Close"
            : "New Batch"}
        </button>
      </div>

      {/* MESSAGE */}

      {message && (
        <p
          className={`rounded-xl border p-3 text-sm ${
            message.type === "error"
              ? "border-rose-700/40 bg-rose-950/30 text-rose-300"
              : "border-emerald-700/40 bg-emerald-950/30 text-emerald-300"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* CREATE BATCH */}

      {creatingBatch && !editingBatch && (
        <form
          onSubmit={submitBatch}
          className={`${panel} grid gap-3 p-5 md:grid-cols-4`}
        >
          <input
            className={field}
            placeholder="Batch name (e.g. 2026 Bootcamp)"
            value={batchForm.name}
            onChange={(e) =>
              setBatchForm({
                ...batchForm,
                name: e.target.value,
              })
            }
            required
          />

          <input
            className={field}
            placeholder="Description (optional)"
            value={batchForm.description}
            onChange={(e) =>
              setBatchForm({
                ...batchForm,
                description: e.target.value,
              })
            }
          />

          <input
            className={field}
            type="date"
            value={batchForm.startDate}
            onChange={(e) =>
              setBatchForm({
                ...batchForm,
                startDate: e.target.value,
              })
            }
            required
          />

          <input
            className={field}
            type="date"
            value={batchForm.endDate}
            onChange={(e) =>
              setBatchForm({
                ...batchForm,
                endDate: e.target.value,
              })
            }
            required
          />

          <select
            className={field}
            value={batchForm.status}
            onChange={(e) =>
              setBatchForm({
                ...batchForm,
                status: e.target.value,
              })
            }
          >
            <option value="upcoming">
              Upcoming
            </option>

            <option value="active">
              Active
            </option>

            <option value="completed">
              Completed
            </option>
          </select>

          <button
            disabled={creatingBatchBusy}
            className="rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:opacity-50 md:col-span-3 cursor-pointer"
          >
            {creatingBatchBusy
              ? "Creating…"
              : "Create Batch"}
          </button>

          <p className="text-[11px] text-[#a39081] md:col-span-4">
            Batches represent yearly bootcamp cohorts.
            Groups are created inside each batch.
          </p>
        </form>
      )}

      {/* SEARCH */}

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a39081]" />

        <input
          value={batchSearch}
          onChange={(e) =>
            setBatchSearch(e.target.value)
          }
          placeholder="Search batches…"
          className={`${field} pl-9`}
        />
      </div>

      {/* BATCHES */}

      {loading ? (
        <div
          className={`${panel} p-8 text-center text-sm text-[#a39081]`}
        >
          Loading batches…
        </div>
      ) : visibleBatches.length === 0 ? (
        <div
          className={`${panel} p-8 text-center text-sm text-[#a39081]`}
        >
          {batches.length === 0
            ? "No batches yet. Create the first yearly batch."
            : "No batches match your search."}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleBatches.map((batch) => {
            const groups =
              groupsByBatch[batch._id] || [];

            const isExpanded =
              expandedBatch === batch._id;

            return (
              <section
                key={batch._id}
                className={`${panel} overflow-hidden`}
              >
                {/* BATCH HEADER */}

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        toggleBatch(batch._id)
                      }
                      className="flex min-w-0 flex-1 items-start gap-3 text-left cursor-pointer"
                    >
                      <div
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#4a3b32] transition-transform ${
                          isExpanded
                            ? "rotate-180"
                            : ""
                        }`}
                      >
                        <IconChevron className="h-4 w-4 text-[#c89b7b]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-bold text-[#f5efe6]">
                            {batch.name}
                          </h2>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              STATUS_STYLES[
                                batch.status
                              ] ||
                              STATUS_STYLES.upcoming
                            }`}
                          >
                            {batch.status}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#a39081]">
                          {new Date(
                            batch.startDate
                          ).toLocaleDateString()}{" "}
                          →{" "}
                          {new Date(
                            batch.endDate
                          ).toLocaleDateString()}
                        </p>

                        {batch.description && (
                          <p className="mt-2 text-xs text-[#a39081]">
                            {batch.description}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          openEditBatch(batch)
                        }
                        title="Edit batch"
                        className="rounded-lg border border-[#4a3b32] p-2 text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeBatch(batch)
                        }
                        title="Delete batch"
                        className="rounded-lg border border-[#4a3b32] p-2 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* BATCH SUMMARY */}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <div className="rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
                        Groups
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-[#f5efe6]">
                        {groups.length}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
                        Students
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-[#f5efe6]">
                        {batch.students?.length ||
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-[#a39081]">
                        Mentors
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-[#f5efe6]">
                        {batch.mentors?.length ||
                          0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* GROUP AREA */}

                {isExpanded && (
                  <div className="border-t border-[#4a3b32] bg-[#16110e]/60 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#f5efe6]">
                          Groups in {batch.name}
                        </h3>

                        <p className="mt-0.5 text-[11px] text-[#a39081]">
                          Create mentoring groups
                          inside this yearly batch.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateGroup(
                            batch._id
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-[#c89b7b] px-3 py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer"
                      >
                        <IconPlus className="h-3.5 w-3.5" />
                        New Group
                      </button>
                    </div>

                    {/* CREATE GROUP */}

                    {creatingGroupFor ===
                      batch._id && (
                      <form
                        onSubmit={submitGroup}
                        className={`${panel} mb-4 grid gap-3 p-4 md:grid-cols-2`}
                      >
                        <input
                          className={field}
                          placeholder="Group name (e.g. Frontend Group A)"
                          value={
                            groupForm.name
                          }
                          onChange={(e) =>
                            setGroupForm({
                              ...groupForm,
                              name: e.target
                                .value,
                            })
                          }
                          required
                          autoFocus
                        />

                        <input
                          className={field}
                          placeholder="Description (optional)"
                          value={
                            groupForm.description
                          }
                          onChange={(e) =>
                            setGroupForm({
                              ...groupForm,
                              description:
                                e.target
                                  .value,
                            })
                          }
                        />

                        <div className="flex gap-2 md:col-span-2">
                          <button
                            type="submit"
                            disabled={
                              creatingGroupBusy
                            }
                            className="flex-1 rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                          >
                            {creatingGroupBusy
                              ? "Creating…"
                              : "Create Group"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCreatingGroupFor(
                                null
                              )
                            }
                            className="rounded-xl border border-[#4a3b32] px-4 text-xs font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* GROUP LIST */}

                    {groups.length === 0 ? (
                      <div
                        className={`${panel} p-7 text-center`}
                      >
                        <p className="text-sm text-[#a39081]">
                          No groups in this batch
                          yet.
                        </p>

                        <p className="mt-1 text-[11px] text-[#6f6259]">
                          Create a group to start
                          assigning mentors and
                          students.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {groups.map((group) => {
                          const groupMentors =
                            group.mentors ||
                            [];

                          const groupStudents =
                            group.students ||
                            [];

                          return (
                            <div
                              key={group._id}
                              className={`${panel} p-4`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h4 className="truncate font-bold text-[#f5efe6]">
                                    {group.name}
                                  </h4>

                                  {group.description && (
                                    <p className="mt-1 text-[11px] text-[#a39081]">
                                      {
                                        group.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="flex shrink-0 gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditGroup(
                                        group
                                      )
                                    }
                                    className="rounded-lg border border-[#4a3b32] p-1.5 text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                                  >
                                    <IconPencil className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeGroup(
                                        group
                                      )
                                    }
                                    className="rounded-lg border border-[#4a3b32] p-1.5 text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                                  >
                                    <IconTrash className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-[#4a3b32] bg-[#16110e] p-3">
                                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                                    <IconUsers className="h-3 w-3" />
                                    Mentors
                                  </p>

                                  <p className="mt-1 text-lg font-bold text-[#f5efe6]">
                                    {
                                      groupMentors.length
                                    }
                                  </p>
                                </div>

                                <div className="rounded-xl border border-[#4a3b32] bg-[#16110e] p-3">
                                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#a39081]">
                                    <IconCap className="h-3 w-3" />
                                    Students
                                  </p>

                                  <p className="mt-1 text-lg font-bold text-[#f5efe6]">
                                    {
                                      groupStudents.length
                                    }
                                  </p>
                                </div>
                              </div>

                              {groupMentors.length >
                                0 && (
                                <div className="mt-3 flex -space-x-2">
                                  {groupMentors
                                    .filter(
                                      (m) =>
                                        typeof m ===
                                        "object"
                                    )
                                    .slice(0, 5)
                                    .map(
                                      (mentor) => (
                                        <Avatar
                                          key={
                                            mentor._id
                                          }
                                          person={
                                            mentor
                                          }
                                        />
                                      )
                                    )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  openRoster(group)
                                }
                                className="mt-4 w-full rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer"
                              >
                                Manage Mentors &
                                Students
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* =================================================
          EDIT BATCH MODAL
      ================================================= */}

      {editingBatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() =>
            setEditingBatch(null)
          }
        >
          <form
            onSubmit={submitBatch}
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`${panel} w-full max-w-md space-y-3 p-6`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5efe6]">
                Edit Batch
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditingBatch(null)
                }
                className="text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <input
              className={field}
              placeholder="Batch name"
              value={editBatchForm.name}
              onChange={(e) =>
                setEditBatchForm({
                  ...editBatchForm,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              className={field}
              placeholder="Description"
              value={
                editBatchForm.description
              }
              onChange={(e) =>
                setEditBatchForm({
                  ...editBatchForm,
                  description:
                    e.target.value,
                })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                className={field}
                type="date"
                value={
                  editBatchForm.startDate
                }
                onChange={(e) =>
                  setEditBatchForm({
                    ...editBatchForm,
                    startDate:
                      e.target.value,
                  })
                }
                required
              />

              <input
                className={field}
                type="date"
                value={
                  editBatchForm.endDate
                }
                onChange={(e) =>
                  setEditBatchForm({
                    ...editBatchForm,
                    endDate:
                      e.target.value,
                  })
                }
                required
              />
            </div>

            <select
              className={field}
              value={editBatchForm.status}
              onChange={(e) =>
                setEditBatchForm({
                  ...editBatchForm,
                  status: e.target.value,
                })
              }
            >
              <option value="upcoming">
                Upcoming
              </option>

              <option value="active">
                Active
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

            <button
              disabled={creatingBatchBusy}
              className="w-full rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {creatingBatchBusy
                ? "Saving…"
                : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* =================================================
          EDIT GROUP MODAL
      ================================================= */}

      {editingGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() =>
            setEditingGroup(null)
          }
        >
          <form
            onSubmit={submitEditGroup}
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`${panel} w-full max-w-md space-y-3 p-6`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5efe6]">
                Edit Group
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditingGroup(null)
                }
                className="text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <input
              className={field}
              placeholder="Group name"
              value={editGroupForm.name}
              onChange={(e) =>
                setEditGroupForm({
                  ...editGroupForm,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              className={field}
              placeholder="Description"
              value={
                editGroupForm.description
              }
              onChange={(e) =>
                setEditGroupForm({
                  ...editGroupForm,
                  description:
                    e.target.value,
                })
              }
            />

            <button className="w-full rounded-xl bg-[#c89b7b] py-2.5 text-xs font-bold text-[#1e1713] hover:opacity-90 cursor-pointer">
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* =================================================
          GROUP ROSTER MODAL
      ================================================= */}

      {rosterGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeRoster}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`${panel} flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#4a3b32] p-5">
              <div>
                <h2 className="text-xl font-bold text-[#f5efe6]">
                  {rosterGroup.name}
                </h2>

                <p className="text-xs text-[#a39081]">
                  {rosterGroup.batch?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRoster}
                className="text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-[#4a3b32] px-5 pt-3">
              {[
                {
                  id: "mentors",
                  label: `Mentors (${selectedMentors.length})`,
                  Icon: IconUsers,
                },
                {
                  id: "students",
                  label: `Students (${selectedStudents.length})`,
                  Icon: IconCap,
                },
              ].map(
                ({
                  id,
                  label,
                  Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setRosterTab(id);
                      setRosterSearch("");
                    }}
                    className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-bold cursor-pointer ${
                      rosterTab === id
                        ? "border border-b-0 border-[#4a3b32] bg-[#16110e] text-[#c89b7b]"
                        : "text-[#a39081] hover:text-[#f5efe6]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                )
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                {(
                  rosterTab === "mentors"
                    ? selectedMentors
                    : selectedStudents
                ).length === 0 && (
                  <p className="text-xs text-[#a39081]">
                    No {rosterTab} added yet.
                  </p>
                )}

                {(
                  rosterTab === "mentors"
                    ? selectedMentors
                    : selectedStudents
                ).map((person) => (
                  <button
                    key={person._id}
                    type="button"
                    onClick={() =>
                      rosterTab ===
                      "mentors"
                        ? toggleMentor(
                            person._id
                          )
                        : toggleStudent(
                            person._id
                          )
                    }
                    className="flex items-center gap-2 rounded-full border border-[#4a3b32] bg-[#16110e] py-1 pl-1 pr-3 text-xs text-[#f5efe6] hover:border-rose-700/60 cursor-pointer"
                  >
                    <Avatar
                      person={person}
                      size={6}
                    />

                    {person.fullName}

                    <IconClose className="h-3 w-3 text-[#a39081]" />
                  </button>
                ))}
              </div>

              <div className="relative mb-3">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a39081]" />

                <input
                  autoFocus
                  value={rosterSearch}
                  onChange={(e) =>
                    setRosterSearch(
                      e.target.value
                    )
                  }
                  placeholder={`Search ${rosterTab}…`}
                  className={`${field} pl-9`}
                />
              </div>

              <div className="space-y-1.5">
                {rosterTab ===
                  "mentors" &&
                  (mentorCandidates.length ===
                  0 ? (
                    <p className="p-3 text-center text-xs text-[#a39081]">
                      {rosterQuery
                        ? "No mentors match your search."
                        : "Every available mentor is already in this group."}
                    </p>
                  ) : (
                    mentorCandidates.map(
                      (mentor) => (
                        <button
                          key={mentor._id}
                          type="button"
                          onClick={() =>
                            toggleMentor(
                              mentor._id
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-left text-xs hover:border-[#c89b7b] cursor-pointer"
                        >
                          <Avatar
                            person={mentor}
                          />

                          <span className="min-w-0 flex-1">
                            <b className="text-[#f5efe6]">
                              {
                                mentor.fullName
                              }
                            </b>

                            <br />

                            <span className="text-[#a39081]">
                              {mentor.email}
                            </span>
                          </span>
                        </button>
                      )
                    )
                  ))}

                {rosterTab ===
                  "students" &&
                  (studentCandidates.length ===
                  0 ? (
                    <p className="p-3 text-center text-xs text-[#a39081]">
                      {rosterQuery
                        ? "No students match your search."
                        : "Every available student is already in this group."}
                    </p>
                  ) : (
                    studentCandidates.map(
                      (student) => (
                        <button
                          key={student._id}
                          type="button"
                          onClick={() =>
                            toggleStudent(
                              student._id
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-left text-xs hover:border-[#c89b7b] cursor-pointer"
                        >
                          <Avatar
                            person={student}
                          />

                          <span className="min-w-0 flex-1">
                            <b className="text-[#f5efe6]">
                              {
                                student.fullName
                              }
                            </b>

                            <br />

                            <span className="text-[#a39081]">
                              {student.department ||
                                student.email}
                            </span>
                          </span>
                        </button>
                      )
                    )
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#4a3b32] p-5">
              <p className="text-[11px] text-[#a39081]">
                {rosterDirty
                  ? "You have unsaved changes."
                  : "No changes to save."}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeRoster}
                  className="rounded-xl border border-[#4a3b32] px-4 py-2 text-xs font-bold text-[#a39081] hover:text-[#f5efe6] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    !rosterDirty ||
                    rosterBusy
                  }
                  onClick={saveRoster}
                  className="flex items-center gap-1.5 rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <IconCheck className="h-3.5 w-3.5" />

                  {rosterBusy
                    ? "Saving…"
                    : "Save Roster"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}