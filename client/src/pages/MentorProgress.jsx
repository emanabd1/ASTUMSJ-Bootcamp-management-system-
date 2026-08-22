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

  if (value === 100) {
    return "bg-green-600";
  }

  if (value < 50) {
    return "bg-red-500";
  }

  if (value < 80) {
    return "bg-yellow-600";
  }

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

  // =========================================================
  // GET PROGRESS OF STUDENTS ASSIGNED TO LOGGED-IN MENTOR
  // =========================================================

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

      const response = await axios.get(
        `${API_URL}/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.progress || response.data.data || [];

      setProgressData(data);
    } catch (err) {
      console.error("Failed to load progress:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError(
          "You are not authorized to view these students."
        );
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

  // =========================================================
  // NORMALIZE DATA
  // =========================================================

  const normalizedProgress = useMemo(() => {
    return progressData.map((item) => {
      const student =
        item.student ||
        item.studentId ||
        {};

      return {
        id: item._id || item.id,

        studentId:
          student._id ||
          student.id ||
          item.studentId,

        name:
          student.name ||
          student.fullName ||
          `${student.firstName || ""} ${
            student.lastName || ""
          }`.trim() ||
          "Student",

        email: student.email || "",

        module:
          item.module ||
          item.topic ||
          "Not Started",

        percentage:
          Number(item.percentage ?? item.progress ?? 0),

        status:
          item.status ||
          getStatusFromPercentage(
            item.percentage ?? item.progress ?? 0
          ),

        note:
          item.note ||
          item.notes ||
          "",

        lastUpdated:
          item.updatedAt ||
          item.lastUpdated ||
          null,
      };
    });
  }, [progressData]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredProgress = useMemo(() => {
    return normalizedProgress.filter((student) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        student.module.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    normalizedProgress,
    searchTerm,
    statusFilter,
  ]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalStudents = normalizedProgress.length;

  const completedStudents = normalizedProgress.filter(
    (student) => student.status === "Completed"
  ).length;

  const needsAttention = normalizedProgress.filter(
    (student) =>
      student.status === "Needs Improvement"
  ).length;

  const averageProgress =
    totalStudents > 0
      ? Math.round(
          normalizedProgress.reduce(
            (total, student) =>
              total + student.percentage,
            0
          ) / totalStudents
        )
      : 0;

  // =========================================================
  // OPEN UPDATE MODAL
  // =========================================================

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

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePercentageChange = (e) => {
    const percentage = Number(e.target.value);

    setFormData((previous) => ({
      ...previous,
      percentage,
      status: getStatusFromPercentage(
        percentage
      ),
    }));
  };

  const handleStatusChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      status: e.target.value,
    }));
  };

  // =========================================================
  // SAVE PROGRESS TO DATABASE
  // =========================================================

  const handleSaveProgress = async (e) => {
    e.preventDefault();

    if (!selectedStudent?.id) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = getToken();

      await axios.put(
        `${API_URL}/progress/${selectedStudent.id}`,
        {
          module: formData.module,
          percentage: Number(
            formData.percentage
          ),
          status: formData.status,
          note: formData.note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      closeModal();
      await fetchProgress();
    } catch (err) {
      console.error(
        "Failed to update progress:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update student progress."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE PROGRESS
  // =========================================================

  const handleDeleteProgress = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this progress record?"
    );

    if (!confirmed) return;

    try {
      const token = getToken();

      await axios.delete(
        `${API_URL}/progress/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchProgress();
    } catch (err) {
      console.error(
        "Failed to delete progress:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete progress."
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

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

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-[#120d0a] px-4 py-8 text-white md:px-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">
          Student Progress Tracker
        </h1>
        <p className="mt-1 text-sm text-[#c99d78]">
          Monitor and update the learning progress
          of your assigned students
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 px-5 py-4 text-red-300">
          {error}
        </div>
      )}

      {/* STATISTICS */}
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

      {/* SEARCH + FILTER */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#4a3528] bg-[#1d1511] p-4 md:flex-row">
        <input
          type="text"
          placeholder="Search assigned students..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          className="flex-1 rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none placeholder:text-[#806957] focus:border-[#c99d78]"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
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

      {/* PROGRESS TABLE */}
      <div className="overflow-hidden rounded-xl border border-[#4a3528] bg-[#1d1511]">
        <div className="border-b border-[#4a3528] px-6 py-5">
          <h2 className="text-xl font-bold text-[#c99d78]">
            Progress Overview
          </h2>
          <p className="mt-1 text-sm text-[#8f7664]">
            Only students assigned to you by the
            administrator are displayed.
          </p>
        </div>

        {filteredProgress.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2a1d16] text-4xl">
              👨‍🎓
            </div>
            <h3 className="text-xl font-bold text-white">
              No Students Assigned
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#8f7664]">
              You currently have no students assigned
              to you. Students will appear here after
              an administrator assigns them to your
              batch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-[#4a3528] text-left text-sm uppercase text-[#c99d78]">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Current Module</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4">Actions</th>
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
                      <p className="mt-1 text-xs text-[#806957]">
                        {student.percentage}% completed
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-md px-3 py-1.5 text-xs font-bold ${getStatusClass(
                          student.status
                        )}`}
                      >
                        {student.status}
                      </span>
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
                          Update
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProgress(
                              student.id
                            )
                          }
                          className="rounded-md border border-red-800 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-900/30"
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

      {/* NEEDS ATTENTION */}
      {needsAttention > 0 && (
        <div className="mt-8 rounded-xl border border-yellow-800/60 bg-[#21180e] p-6">
          <h2 className="text-xl font-bold text-yellow-500">
            Students Needing Attention
          </h2>
          <p className="mt-1 text-sm text-[#a98a72]">
            Students assigned to you who may need
            additional mentoring.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {normalizedProgress
              .filter(
                (student) =>
                  student.status ===
                  "Needs Improvement"
              )
              .map((student) => (
                <div
                  key={student.id}
                  className="rounded-lg border border-[#4a3528] bg-[#1d1511] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        {student.name}
                      </h3>
                      <p className="text-sm text-[#a98a72]">
                        {student.module}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-yellow-500">
                      {student.percentage}%
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      openEditModal(student)
                    }
                    className="mt-4 w-full rounded-lg border border-[#c99d78] px-3 py-2 text-sm font-bold text-[#c99d78] hover:bg-[#c99d78] hover:text-[#21150f]"
                  >
                    Update Progress
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#4a3528] bg-[#1d1511]">
            <div className="flex items-center justify-between border-b border-[#4a3528] px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold">
                  Update Student Progress
                </h2>
                <p className="mt-1 text-sm text-[#a98a72]">
                  {formData.name}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-3xl text-[#a98a72] hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSaveProgress}
              className="space-y-6 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-[#c99d78]">
                  Student
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-[#a98a72]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#c99d78]">
                  Topic / Module
                </label>
                <select
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none focus:border-[#c99d78]"
                >
                  {MODULES.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <label className="text-sm font-bold text-[#c99d78]">
                    Progress
                  </label>
                  <span className="text-xl font-bold">
                    {formData.percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.percentage}
                  onChange={
                    handlePercentageChange
                  }
                  className="w-full accent-[#c99d78]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#c99d78]">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none focus:border-[#c99d78]"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#c99d78]">
                  Progress Note
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Add a progress note..."
                  className="w-full resize-none rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none placeholder:text-[#806957] focus:border-[#c99d78]"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#4a3528] pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-[#4a3528] px-5 py-3 font-bold text-[#a98a72] hover:bg-[#2a1d16]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#c99d78] px-6 py-3 font-bold text-[#21150f] hover:bg-[#d8ae8b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}