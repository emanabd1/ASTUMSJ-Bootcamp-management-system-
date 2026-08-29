// client/src/pages/MentorProgress.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://astumsj-bootcamp-management-system.onrender.com/api";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const threadEndRef = useRef(null);

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
            err.message ||
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
        id: item.isVirtual ? null : item._id || item.id,

        isVirtual: Boolean(item.isVirtual),

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
          "HTML / CSS",

        percentage: Number(
          item.percentage ??
            item.progress ??
            0
        ),

        status:
          item.status ||
          getStatusFromPercentage(
            item.percentage ??
              item.progress ??
              0
          ),

        note:
          item.note ||
          item.notes ||
          "",

        lastUpdated:
          item.updatedAt ||
          item.lastUpdated ||
          null,

        comments:
          item.comments || [],
      };
    });
  }, [progressData]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const search = searchTerm.toLowerCase();

    return normalizedProgress
      .filter(
        (student) =>
          student.name
            .toLowerCase()
            .includes(search) ||
          student.email
            .toLowerCase()
            .includes(search)
      )
      .slice(0, 6);
  }, [normalizedProgress, searchTerm]);

  const filteredProgress = useMemo(() => {
    return normalizedProgress.filter((student) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        student.name
          .toLowerCase()
          .includes(search) ||
        student.email
          .toLowerCase()
          .includes(search) ||
        student.module
          .toLowerCase()
          .includes(search);

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

  const totalStudents = normalizedProgress.length;

  const completedStudents =
    normalizedProgress.filter(
      (student) =>
        student.status === "Completed"
    ).length;

  const needsAttention =
    normalizedProgress.filter(
      (student) =>
        student.status ===
        "Needs Improvement"
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

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setCommentText("");

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
    setCommentText("");
  };

  useEffect(() => {
    const progressId =
      searchParams.get("progressId");

    if (
      !progressId ||
      normalizedProgress.length === 0
    ) {
      return;
    }

    const match = normalizedProgress.find(
      (s) => s.id === progressId
    );

    if (match) {
      openEditModal(match);
    }

    setSearchParams({}, { replace: true });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedProgress, searchParams]);

  useEffect(() => {
    if (
      isModalOpen &&
      selectedStudent?.id
    ) {
      threadEndRef.current?.scrollIntoView({
        block: "end",
      });
    }
  }, [
    isModalOpen,
    selectedStudent?.id,
  ]);

  useEffect(() => {
    if (!isModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [isModalOpen]);

  const handlePercentageChange = (e) => {
    const percentage = Number(
      e.target.value
    );

    setFormData((previous) => ({
      ...previous,
      percentage,
    }));
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();

    if (!selectedStudent?.studentId) {
      setError(
        "Student information is missing."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        topic: formData.module,
        percentage: Number(
          formData.percentage
        ),
        status: formData.status,
        note: formData.note,
      };

      console.log(
        "Saving progress:",
        {
          progressId: selectedStudent.id,
          studentId:
            selectedStudent.studentId,
          payload,
        }
      );

      if (selectedStudent.id) {
        const response =
          await axios.patch(
            `${API_URL}/progress/${selectedStudent.id}`,
            payload,
            { headers }
          );

        console.log(
          "Progress update successful:",
          response.data
        );
      } else {
        const response =
          await axios.post(
            `${API_URL}/progress`,
            {
              studentId:
                selectedStudent.studentId,
              ...payload,
            },
            { headers }
          );

        console.log(
          "Progress creation successful:",
          response.data
        );
      }

      closeModal();
      await fetchProgress();
    } catch (err) {
      console.error(
        "Failed to update progress:",
        err
      );

      console.error(
        "Progress error response:",
        {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method,
        }
      );

      const backendMessage =
        err.response?.data?.message;

      if (backendMessage) {
        setError(backendMessage);
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "You are not authorized to update this student's progress."
        );
      } else if (err.response?.status === 404) {
        setError(
          "The progress record or API route could not be found."
        );
      } else if (err.response?.status === 400) {
        setError(
          "The progress information is invalid."
        );
      } else if (err.response?.status >= 500) {
        setError(
          "The server encountered an error while saving progress."
        );
      } else {
        setError(
          err.message ||
            "Failed to update student progress."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgress = async (id) => {
    if (!id) {
      setError(
        "This student doesn't have a saved progress record yet."
      );
      return;
    }

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
          err.message ||
          "Failed to delete progress."
      );
    }
  };

  const handlePostComment = async () => {
    const text = commentText.trim();

    if (
      !text ||
      !selectedStudent?.id
    ) {
      return;
    }

    try {
      setPostingComment(true);
      setError("");

      const token = getToken();

      const res = await axios.post(
        `${API_URL}/progress/${selectedStudent.id}/comments`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updated =
        res.data?.progress;

      setCommentText("");

      if (updated) {
        setSelectedStudent((prev) => ({
          ...prev,
          comments:
            updated.comments || [],
        }));
      }

      await fetchProgress();
    } catch (err) {
      console.error(
        "Failed to post comment:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to post your reply."
      );
    } finally {
      setPostingComment(false);
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
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none placeholder:text-[#806957] focus:border-[#c99d78]"
          />

          {searchTerm.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#4a3528] bg-[#1d1511] shadow-xl">
              {searchSuggestions.length > 0 ? (
                searchSuggestions.map(
                  (student) => (
                    <button
                      key={
                        student.studentId
                      }
                      type="button"
                      onClick={() =>
                        setSearchTerm(
                          student.name
                        )
                      }
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
                  )
                )
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
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="rounded-lg border border-[#4a3528] bg-[#120d0a] px-4 py-3 text-white outline-none focus:border-[#c99d78]"
        >
          <option value="All">
            All Statuses
          </option>

          {STATUS_OPTIONS.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}
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

        {filteredProgress.length ===
        0 ? (
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
                {filteredProgress.map(
                  (student) => (
                    <tr
                      key={
                        student.studentId
                      }
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
                            {
                              student.percentage
                            }
                            %
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
                              openEditModal(
                                student
                              )
                            }
                            className="rounded-md bg-[#c99d78] px-3 py-2 text-xs font-bold text-[#21150f] hover:bg-[#d8ae8b]"
                          >
                            {student.isVirtual
                              ? "Start Tracking"
                              : "Update"}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProgress(
                                student.id
                              )
                            }
                            disabled={
                              student.isVirtual
                            }
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
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-[#4a3528] bg-[#1d1511] text-white"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-[#4a3528] bg-[#1d1511] px-6 py-4">
              <h2 className="text-xl font-bold text-[#c99d78]">
                {selectedStudent?.id
                  ? "Update Student Progress"
                  : "Start Tracking Progress"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded-full border border-[#4a3528] px-2.5 py-1 text-xs text-[#a98a72] transition hover:border-[#c99d78] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                handleSaveProgress
              }
              className="space-y-4 overflow-y-auto px-6 py-5"
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
                  value={
                    formData.module
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      module:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-white outline-none"
                >
                  {MODULES.map(
                    (mod) => (
                      <option
                        key={mod}
                        value={mod}
                      >
                        {mod}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Progress Percentage (
                  {
                    formData.percentage
                  }
                  %)
                </label>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={
                    formData.percentage
                  }
                  onChange={
                    handlePercentageChange
                  }
                  className="w-full accent-[#c99d78]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#a98a72]">
                  Status
                </label>

                <select
                  value={
                    formData.status
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-white outline-none"
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
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

              {selectedStudent?.id ? (
                <div>
                  <label className="mb-1 block text-xs text-[#a98a72]">
                    Discussion with{" "}
                    {formData.name}
                  </label>

                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-[#4a3528] bg-[#120d0a] p-3">
                    {selectedStudent
                      .comments
                      ?.length ? (
                      selectedStudent.comments.map(
                        (c, idx) => (
                          <div
                            key={
                              c._id ||
                              idx
                            }
                            className={`rounded-lg px-3 py-2 text-xs ${
                              c.authorRole ===
                              "student"
                                ? "bg-[#241a15] text-[#e5dccf]"
                                : "bg-[#c99d78]/10 text-[#e9c9ab]"
                            }`}
                          >
                            <div className="mb-0.5 flex items-center justify-between gap-2">
                              <span className="font-bold">
                                {c
                                  .author
                                  ?.fullName ||
                                  (c.authorRole ===
                                  "student"
                                    ? "Student"
                                    : "Mentor")}
                              </span>

                              <span className="text-[10px] text-[#7c6d5f]">
                                {c.createdAt
                                  ? new Date(
                                      c.createdAt
                                    ).toLocaleDateString()
                                  : ""}
                              </span>
                            </div>

                            <p>
                              {c.text}
                            </p>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-xs text-[#7c6d5f]">
                        No replies yet — say hi.
                      </p>
                    )}

                    <div
                      ref={
                        threadEndRef
                      }
                    />
                  </div>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={
                        commentText
                      }
                      onChange={(e) =>
                        setCommentText(
                          e.target.value
                        )
                      }
                      placeholder="Write a reply..."
                      className="flex-1 rounded-lg border border-[#4a3528] bg-[#120d0a] px-3 py-2 text-sm text-white outline-none"
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={
                        handlePostComment
                      }
                      disabled={
                        postingComment ||
                        !commentText.trim()
                      }
                      className="rounded-lg bg-[#c99d78] px-4 py-2 text-xs font-bold text-[#120d0a] hover:bg-[#d8ae8b] disabled:opacity-50"
                    >
                      {postingComment
                        ? "..."
                        : "Send"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7c6d5f]">
                  Save this student's progress first to start a discussion thread with them.
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-lg border border-[#4a3528] px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#c99d78] px-4 py-2 text-xs font-bold text-[#120d0a] hover:bg-[#d8ae8b]"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}