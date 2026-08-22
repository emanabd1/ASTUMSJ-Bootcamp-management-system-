import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MentorAssignments() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assignments, setAssignments] = useState(() => {
    const saved = localStorage.getItem("mentorAssignments");
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [grading, setGrading] = useState(null);

  const [form, setForm] = useState({
    title: "",
    module: "",
    description: "",
    dueDate: "",
  });

  const [gradeForm, setGradeForm] = useState({
    grade: "",
    feedback: "",
  });

  // Fetch assigned students from the backend API safely
  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");

        const response = await axios.get(
          "http://localhost:5000/api/mentors/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("API Response:", response.data);

        // Safely extract the array from response.data.dashboard.assignedStudents
        let rawData = response.data;
        if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
          rawData = 
            rawData.dashboard?.assignedStudents || 
            rawData.assignedStudents || 
            rawData.students || 
            rawData.data || 
            [];
        }

        const fetchedStudents = Array.isArray(rawData) ? rawData : [];

        // Normalize student data structure
        const normalizedStudents = fetchedStudents.map((s) => ({
          id: s._id || s.id,
          name: s.fullName || s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Student",
          email: s.email,
        }));

        setStudents(normalizedStudents);
      } catch (err) {
        console.error("Error fetching assigned students:", err);
        setError("Unable to load assigned students from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedStudents();
  }, []);

  // Save assignments
  useEffect(() => {
    localStorage.setItem("mentorAssignments", JSON.stringify(assignments));
  }, [assignments]);

  // Create assignment
  const createAssignment = (e) => {
    e.preventDefault();

    if (!students.length) {
      alert("No students have been assigned to you yet.");
      return;
    }

    const newAssignment = {
      id: Date.now(),
      title: form.title,
      module: form.module,
      description: form.description,
      dueDate: form.dueDate,

      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        status: "Pending",
        submission: "",
        submittedAt: null,
        grade: null,
        feedback: "",
      })),
    };

    setAssignments([...assignments, newAssignment]);

    setForm({
      title: "",
      module: "",
      description: "",
      dueDate: "",
    });

    setShowForm(false);
  };

  // Give grade
  const giveGrade = (e) => {
    e.preventDefault();

    const updatedAssignments = assignments.map((assignment) => {
      if (assignment.id !== grading.assignmentId) {
        return assignment;
      }

      return {
        ...assignment,
        students: assignment.students.map((student) => {
          if (student.id !== grading.studentId) {
            return student;
          }

          return {
            ...student,
            grade: Number(gradeForm.grade),
            feedback: gradeForm.feedback,
            status: "Graded",
          };
        }),
      };
    });

    setAssignments(updatedAssignments);
    setGrading(null);
    setGradeForm({
      grade: "",
      feedback: "",
    });
  };

  // Delete assignment
  const deleteAssignment = (id) => {
    if (!window.confirm("Delete this assignment?")) {
      return;
    }
    setAssignments(assignments.filter((assignment) => assignment.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#120d0a] p-8 text-white">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Assignments & Grading</h1>
          <p className="mt-2 text-[#c99d78]">
            Create assignments and grade student submissions
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-[#c99d78] px-5 py-3 font-bold text-black"
        >
          + Add Assignment
        </button>
      </div>

      {/* ERROR / LOADING */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-700 bg-red-950 p-4 text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-lg bg-[#1d1511] p-4 text-[#c99d78]">
          Loading students...
        </div>
      )}

      {/* NO STUDENTS */}
      {!loading && students.length === 0 && (
        <div className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950 p-5 text-yellow-300">
          <h2 className="font-bold">No Students Assigned</h2>
          <p className="mt-1 text-sm">
            Students assigned to you by the administrator will appear here.
          </p>
        </div>
      )}

      {/* ASSIGNMENTS LIST */}
      {assignments.length === 0 ? (
        <div className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-12 text-center">
          <h2 className="text-2xl font-bold">No Assignments</h2>
          <p className="mt-2 text-[#a98a72]">Create your first assignment.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-6"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{assignment.title}</h2>
                  <p className="mt-1 text-[#c99d78]">{assignment.module}</p>
                  <p className="mt-3 text-sm text-gray-400">
                    {assignment.description}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Due: {assignment.dueDate}
                  </p>
                </div>

                <button
                  onClick={() => deleteAssignment(assignment.id)}
                  className="rounded border border-red-700 px-3 py-2 text-red-400"
                >
                  Delete
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#4a3528] text-left text-[#c99d78]">
                      <th className="p-3">Student</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignment.students.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-[#33251e]"
                      >
                        <td className="p-3">
                          <div className="font-bold">{student.name}</div>
                          <div className="text-xs text-gray-500">
                            {student.email}
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`rounded px-3 py-1 text-xs font-bold ${
                              student.status === "Graded"
                                ? "bg-green-700"
                                : student.status === "Submitted"
                                ? "bg-blue-700"
                                : "bg-yellow-700"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>

                        <td className="p-3">
                          {student.grade !== null
                            ? `${student.grade}/100`
                            : "-"}
                        </td>

                        <td className="p-3">
                          {student.status === "Submitted" && (
                            <button
                              onClick={() => {
                                setGrading({
                                  assignmentId: assignment.id,
                                  studentId: student.id,
                                  studentName: student.name,
                                  assignmentTitle: assignment.title,
                                });
                                setGradeForm({
                                  grade: "",
                                  feedback: "",
                                });
                              }}
                              className="rounded-lg bg-[#c99d78] px-4 py-2 font-bold text-black"
                            >
                              Grade
                            </button>
                          )}
                          {student.status === "Graded" && (
                            <button
                              onClick={() => {
                                setGrading({
                                  assignmentId: assignment.id,
                                  studentId: student.id,
                                  studentName: student.name,
                                  assignmentTitle: assignment.title,
                                });
                                setGradeForm({
                                  grade: student.grade,
                                  feedback: student.feedback,
                                });
                              }}
                              className="rounded-lg border border-[#c99d78] px-4 py-2 text-[#c99d78]"
                            >
                              Review
                            </button>
                          )}
                          {student.status === "Pending" && (
                            <span className="text-sm text-gray-500">
                              Waiting for submission
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-xl border border-[#4a3528] bg-[#1d1511]">
            <div className="flex justify-between border-b border-[#4a3528] p-6">
              <h2 className="text-2xl font-bold">Create Assignment</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={createAssignment} className="space-y-5 p-6">
              <input
                required
                placeholder="Assignment title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <input
                required
                placeholder="Module"
                value={form.module}
                onChange={(e) =>
                  setForm({ ...form, module: e.target.value })
                }
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <textarea
                required
                rows="4"
                placeholder="Assignment description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <input
                required
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({ ...form, dueDate: e.target.value })
                }
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-[#4a3528] px-5 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#c99d78] px-5 py-3 font-bold text-black"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {grading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#4a3528] bg-[#1d1511]">
            <div className="border-b border-[#4a3528] p-6">
              <h2 className="text-2xl font-bold">Grade Submission</h2>
              <p className="mt-2 text-[#c99d78]">{grading.studentName}</p>
              <p className="text-sm text-gray-400">{grading.assignmentTitle}</p>
            </div>

            <form onSubmit={giveGrade} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block">Grade / 100</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={gradeForm.grade}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, grade: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block">Feedback</label>
                <textarea
                  rows="5"
                  placeholder="Give feedback to the student..."
                  value={gradeForm.feedback}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, feedback: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setGrading(null)}
                  className="rounded-lg border border-[#4a3528] px-5 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-green-700 px-5 py-3 font-bold text-white"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}