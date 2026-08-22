import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MentorAssignments() {
  const [students, setStudents] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [grading, setGrading] = useState(null);

  const [form, setForm] = useState({
    title: "",
    module: "",
    description: "",
    dueDate: "",
    maximumScore: "100",
    batch: "", // Added manual batch input fallback
  });

  const [gradeForm, setGradeForm] = useState({
    grade: "",
    feedback: "",
    status: "graded",
  });

  // Fetch assigned students and assignments from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch mentor dashboard / students
        const studentRes = await axios.get(
          "http://localhost:5000/api/mentors/dashboard",
          { headers }
        );

        let rawData = studentRes.data;
        if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
          rawData = 
            rawData.dashboard?.assignedStudents || 
            rawData.assignedStudents || 
            rawData.students || 
            rawData.data || 
            [];
        }

        const fetchedStudents = Array.isArray(rawData) ? rawData : [];
        const normalizedStudents = fetchedStudents.map((s) => ({
          id: s._id || s.id,
          name: s.fullName || s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Student",
          email: s.email,
          batch: s.batch?._id || s.batch,
        }));

        setStudents(normalizedStudents);
        
        // Try to automatically grab batch ID if available
        if (normalizedStudents.length > 0 && normalizedStudents[0].batch) {
          const autoBatch = normalizedStudents[0].batch;
          setBatchId(autoBatch);
          setForm((prev) => ({ ...prev, batch: autoBatch }));
        }

        // 2. Fetch actual backend assignments
        const assignmentRes = await axios.get(
          "http://localhost:5000/api/assignments",
          { headers }
        );
        if (assignmentRes.data.success) {
          setAssignments(assignmentRes.data.assignments);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to load dashboard data from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create assignment (Sends to Backend API)
  const createAssignment = async (e) => {
    e.preventDefault();

    if (!students.length) {
      alert("No students have been assigned to you yet.");
      return;
    }

    const targetBatchId = batchId || form.batch;
    if (!targetBatchId) {
      alert("Batch ID is missing. Please provide a valid Batch ID.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const studentIds = students.map((s) => s.id);

      const payload = {
        title: form.title,
        description: `${form.module ? `[Module: ${form.module}] ` : ""}${form.description}`,
        batch: targetBatchId,
        deadline: new Date(form.dueDate).toISOString(),
        maximumScore: Number(form.maximumScore),
        studentIds: studentIds,
      };

      const response = await axios.post(
        "http://localhost:5000/api/assignments",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setAssignments([response.data.assignment, ...assignments]);
        setForm({
          title: "",
          module: "",
          description: "",
          dueDate: "",
          maximumScore: "100",
          batch: batchId,
        });
        setShowForm(false);
        alert("Assignment created successfully!");
      }
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert(err.response?.data?.message || "Failed to create assignment.");
    }
  };

  // Give grade via backend API
  const giveGrade = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://localhost:5000/api/assignments/${grading.assignmentId}/submissions/${grading.submissionId}/grade`,
        {
          score: Number(gradeForm.grade),
          feedback: gradeForm.feedback,
          status: gradeForm.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Grade saved successfully!");
        setGrading(null);
        const assignmentRes = await axios.get(
          "http://localhost:5000/api/assignments",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (assignmentRes.data.success) {
          setAssignments(assignmentRes.data.assignments);
        }
      }
    } catch (err) {
      console.error("Error grading submission:", err);
      alert(err.response?.data?.message || "Failed to save grade.");
    }
  };

  // Delete assignment via backend API
  const deleteAssignment = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(assignments.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting assignment:", err);
      alert(err.response?.data?.message || "Failed to delete assignment.");
    }
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

      {error && (
        <div className="mb-6 rounded-lg border border-red-700 bg-red-950 p-4 text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-lg bg-[#1d1511] p-4 text-[#c99d78]">
          Loading data...
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
              key={assignment._id || assignment.id}
              className="rounded-xl border border-[#4a3528] bg-[#1d1511] p-6"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{assignment.title}</h2>
                  <p className="mt-3 text-sm text-gray-400">
                    {assignment.description}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Due: {new Date(assignment.deadline).toLocaleDateString()} | Max Score: {assignment.maximumScore}
                  </p>
                </div>

                <button
                  onClick={() => deleteAssignment(assignment._id || assignment.id)}
                  className="rounded border border-red-700 px-3 py-2 text-red-400"
                >
                  Delete
                </button>
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
              <button onClick={() => setShowForm(false)} className="text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={createAssignment} className="space-y-5 p-6">
              <input
                required
                placeholder="Assignment title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <input
                placeholder="Module / Topic"
                value={form.module}
                onChange={(e) => setForm({ ...form, module: e.target.value })}
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <textarea
                required
                rows="4"
                placeholder="Assignment description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <div>
                <label className="mb-1 block text-sm text-gray-400">Batch ID</label>
                <input
                  required
                  placeholder="Enter Batch ID (e.g., from MongoDB)"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Due Date</label>
                <input
                  required
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Maximum Score</label>
                <input
                  required
                  type="number"
                  value={form.maximumScore}
                  onChange={(e) => setForm({ ...form, maximumScore: e.target.value })}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                />
              </div>

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
    </div>
  );
}