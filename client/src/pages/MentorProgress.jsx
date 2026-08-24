// client/src/pages/MentorProgress.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Completed",
  "Needs Improvement",
];

const MODULES = [
  "HTML / CSS",
  "JavaScript",
  "React",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Git / GitHub",
];

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt")
  );
};

const getStatusFromPercentage = (percentage) => {
  const value = Number(percentage);

  if (value === 0) return "Not Started";
  if (value === 100) return "Completed";
  if (value < 50) return "Needs Improvement";

  return "In Progress";
};

const getStatusClass = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-700 text-white";
    case "In Progress":
      return "bg-blue-700 text-white";
    case "Needs Improvement":
      return "bg-yellow-700 text-white";
    case "Not Started":
      return "bg-gray-700 text-gray-200";
    default:
      return "bg-gray-700 text-white";
  }
};

const getProgressBarClass = (percentage) => {
  const value = Number(percentage);
  if (value === 100) return "bg-green-600";
  if (value < 50) return "bg-red-500";
  if (value < 80) return "bg-yellow-600";
  return "bg-[#c99d78]";
};

export default function MentorProgress() {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    module: "HTML / CSS",
    percentage: 0,
    status: "Not Started",
    note: "",
  });

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      // FIX: The dashboard endpoint only returns aggregate stats
      // (attendance %, counts) — it has no percentage/status/note fields,
      // and its "_id" is the STUDENT id, not a Progress record id. That
      // mismatch is why saving an update used to fail with
      // "Progress record not found" (the PATCH was hitting /progress/<studentId>).
      // We now fetch real progress records straight from /progress, which
      // is properly scoped to this mentor's assigned students server-side,
      // and includes a placeholder row (isVirtual: true, id: null) for any
      // assigned student who doesn't have a record yet.
      const response = await axios.get(`${API_URL}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawData = response.data;

      const progressArray =
        rawData?.progress || rawData?.data || [];

      setProgressData(progressArray);
    } catch (err) {
      console.error("Failed to load progress:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You are not authorized to view these students.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to load assigned students."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const normalizedProgress = useMemo(() => {
    return progressData.map((item) => {
      const student = item.student || item;

      return {
        // A virtual placeholder (student with no saved progress yet) has
        // no real Progress document, so id stays null. We rely on this
        // downstream to decide POST (create) vs PATCH (update) on save,
        // and to disable "Delete" (there's nothing to delete yet).
        id: item.isVirtual ? null : item._id || item.id,
        isVirtual: Boolean(item.isVirtual),
        studentId: student._id || student.id || item.studentId,
        name:
          student.name ||
          student.fullName ||
          `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
          "Student",
        email: student.email || "",
        module: item.module || item.topic || "HTML / CSS",
        percentage: Number(item.percentage ?? item.progress ?? 0),
        status:
          item.status ||
          getStatusFromPercentage(
            item.percentage ?? item.progress ?? 0
          ),
        note: item.note || item.notes || "",
        lastUpdated: item.updatedAt || item.lastUpdated || null,
      };
    });
  }, [progressData]);

  // Search suggestions from assigned students
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const search = searchTerm.toLowerCase();

    return normalizedProgress
      .filter(
        (student) =>
          student.name.toLowerCase().includes(search) ||
          student.email.toLowerCase().includes(search)
      )
      .slice(0, 6);
  }, [normalizedProgress, searchTerm]);

  const filteredProgress = useMemo(() => {
    return normalizedProgress.filter((student) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        student.module.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedProgress, searchTerm, statusFilter]);

  const totalStudents = normalizedProgress.length;

  const completedStudents = normalizedProgress.filter(
    (student) => student.status === "Completed"
  ).length;

  const needsAttention = normalizedProgress.filter(
    (student) => student.status === "Needs Improvement"
  ).length;

  const averageProgress =
    totalStudents > 0
      ? Math.round(
          normalizedProgress.reduce(
            (total, student) => total + student.percentage,
            0
          ) / totalStudents
        )
      : 0;

  const openEditModal = (student) => {
    setSelectedStudent(student);

    setFormData({
      studentId: student.studentId,
      name: student.name,
      module: student.module,
      percentage: student.percentage,
      status: student.status,
      note: student.note,
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Percentage no longer changes the status automatically.
  const handlePercentageChange = (e) => {
    const percentage = Number(e.target.value);

    setFormData((previous) => ({
      ...previous,
      percentage,
    }));
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();

    // A student always has a studentId, even before any progress record
    // exists — that's the field we should be gating on, not the (possibly
    // null) progress record id.
    if (!selectedStudent?.studentId) return;

    try {
      setSaving(true);
      setError("");

      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (selectedStudent.id) {
        // Existing record — update it in place.
        await axios.patch(
          `${API_URL}/progress/${selectedStudent.id}`,
          {
            topic: formData.module,
            percentage: Number(formData.percentage),
            status: formData.status,
            note: formData.note,
          },
          { headers }
        );
      } else {
        // FIX: This student has no Progress document yet (that's why the
        // old PATCH call used their student id and got a 404 "Progress
        // record not found"). Create it with the upsert-capable POST
        // route instead.
        await axios.post(
          `${API_URL}/progress`,
          {
            studentId: selectedStudent.studentId,
            topic: formData.module,
            percentage: Number(formData.percentage),
            status: formData.status,
            note: formData.note,
          },
          { headers }
        );
      }

      closeModal();
      await fetchProgress();
    } catch (err) {
      console.error("Failed to update progress:", err);

      setError(
        err.response?.data?.message ||
          "Failed to update student progress."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgress = async (id) => {
    // Virtual placeholder rows (id is null) have no Progress document in
    // the database yet — nothing to delete.
    if (!id) {
      setError("This student doesn't have a saved progress record yet.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this progress record?"
    );

    if (!confirmed) return;

    try {
      const token = getToken();

      await axios.delete(`${API_URL}/progress/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchProgress();
    } catch (err) {
      console.error("Failed to delete progress:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete progress."
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120d0a] px-6 py-10 text-white">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#4a3528] border-t-[#c99d78]" />

            <p className="text-[#c99d78]">
              Loading your assigned students...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#120d0a] px-4 py-8 text-white md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          Student Progress Tracker
        </h1>

        <p className="mt-1 text-sm text-[#c99d78]">
          Monitor and update the learning progress of your assigned students
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 px-5 py-4 text-red-300">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-5">
          <p className="text-sm text-[#a98a72]">
            Assigned Students
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalStudents}
          </h2>
        </div>

        <div className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-5">
          <p className="text-sm text-[#a98a72]">
            Average Progress
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {averageProgress}%
          </h2>
        </div>

        <div className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-5">
          <p className="text-sm text-[#a98a72]">
            Completed
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-500">
            {completedStudents}
          </h2>
        </div>

        <div className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-5">
          <p className="text-sm text-[#a98a72]">
            Needs Attention
          </p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-500">
            {needsAttention}
          </h2>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#4a3528] bg-[#1d1511] p-4 md:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search assigned students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none placeholder:text-[#806957] focus:border-[#c99d78]"
          />

          {searchTerm.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#4a3528] bg-[#1d1511] shadow-xl">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map((student) => (
                  <button
                    key={student.studentId}
                    type="button"
                    onClick={() => setSearchTerm(student.name)}
                    className="block w-full border-b border-[#4a3528] px-4 py-3 text-left text-sm text-white hover:bg-[#2a1d16]"
                  >
                    <div className="font-medium">
                      {student.name}
                    </div>

                    {student.email && (
                      <div className="text-xs text-[#806957]">
                        {student.email}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-[#8f7664]">
                  No assigned student found.
                </p>
              )}
            </div>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none focus:border-[#c99d78]"
        >
          <option value="All">All Statuses</option>

          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#4a3528] bg-[#1d1511]">
        <div className="border-b border-[#4a3528] px-6 py-5">
          <h2 className="text-xl font-bold text-[#c99d78]">
            Progress Overview
          </h2>

          <p className="mt-1 text-sm text-[#8f7664]">
            Only students assigned to you are displayed.
          </p>
        </div>

        {filteredProgress.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2a1d16] text-4xl">
              👨‍🎓
            </div>

            <h3 className="text-xl font-bold text-white">
              No Students Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#8f7664]">
              No assigned students match your search or filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#4a3528] text-left text-sm uppercase text-[#c99d78]">
                  <th className="px-6 py-4">
                    Student Name
                  </th>

                  <th className="px-6 py-4">
                    Current Module
                  </th>

                  <th className="px-6 py-4">
                    Progress
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4">
                    Last Updated
                  </th>

                  <th className="px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProgress.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-[#4a3528] transition hover:bg-[#241a15]"
                  >
                    <td className="px-6 py-5">
                      <div className="font-bold text-white">
                        {student.name}
                      </div>

                      {student.email && (
                        <div className="mt-1 text-xs text-[#806957]">
                          {student.email}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 text-[#d4b9a4]">
                      {student.module}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-36 overflow-hidden rounded-full border border-[#4a3528] bg-[#2b211b]">
                          <div
                            className={`h-full rounded-full ${getProgressBarClass(
                              student.percentage
                            )}`}
                            style={{
                              width: `${student.percentage}%`,
                            }}
                          />
                        </div>

                        <span className="font-bold">
                          {student.percentage}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-3 py-1.5 text-xs font-bold ${getStatusClass(
                            student.status
                          )}`}
                        >
                          {student.status}
                        </span>

                        {student.isVirtual && (
                          <span className="rounded-md border border-[#4a3528] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8f7664]">
                            Not saved yet
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm text-[#a98a72]">
                      {student.lastUpdated
                        ? new Date(
                            student.lastUpdated
                          ).toLocaleDateString()
                        : "Not updated"}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            openEditModal(student)
                          }
                          className="rounded-md bg-[#c99d78] px-3 py-2 text-xs font-bold text-[#21150f] hover:bg-[#d8ae8b]"
                        >
                          {student.isVirtual ? "Start Tracking" : "Update"}
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteProgress(student.id)
                          }
                          disabled={student.isVirtual}
                          title={
                            student.isVirtual
                              ? "Nothing to delete yet — save progress first"
                              : "Delete this progress record"
                          }
                          className="rounded-md border border-red-800 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:border-[#4a3528] disabled:text-[#5c4c3f] disabled:hover:bg-transparent"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#4a3528] bg-[#1d1511] p-6 text-white">
            <h2 className="mb-4 text-xl font-bold text-[#c99d78]">
              {selectedStudent?.id
                ? "Update Student Progress"
                : "Start Tracking Progress"}
            </h2>

            <form
              onSubmit={handleSaveProgress}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Student
                </label>

                <input
                  type="text"
                  disabled
                  value={formData.name}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-gray-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Current Module
                </label>

                <select
                  value={formData.module}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      module: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-white outline-none"
                >
                  {MODULES.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Progress Percentage ({formData.percentage}%)
                </label>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={handlePercentageChange}
                  className="w-full accent-[#c99d78]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Status
                </label>

                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-white outline-none"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Notes
                </label>

                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      note: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-white outline-none"
                  placeholder="Optional mentor remarks..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-[#4a3528] px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#c99d78] px-4 py-2 text-xs font-bold text-[#120d0a] hover:bg-[#d8ae8b]"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}