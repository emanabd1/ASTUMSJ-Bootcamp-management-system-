import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MentorAssignments() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const fileBaseUrl = "http://localhost:5000";

  const [form, setForm] = useState({
    title: "",
    module: "",
    description: "",
    dueDate: "",
    maximumScore: "100",
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const batchRes = await axios.get("http://localhost:5000/api/batches", { headers });
        const fetchedBatches = batchRes.data.batches || [];
        setBatches(fetchedBatches);
        if (fetchedBatches.length > 0) {
          setBatchId(fetchedBatches[0]._id);
        }

        const assignmentRes = await axios.get("http://localhost:5000/api/assignments", { headers });
        const assignmentData = assignmentRes.data.assignments || assignmentRes.data.data || assignmentRes.data || [];
        setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to load assignments from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectAssignment = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/submissions", { headers });
      const allSubmissions = res.data.submissions || res.data.data || res.data || [];
      
      const filtered = allSubmissions.filter((sub) => {
        const subAssignmentId = sub.assignment?._id || sub.assignment;
        return String(subAssignmentId) === String(assignment._id);
      });

      setSubmissions(filtered);
    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!batchId) {
      alert("Please select a batch.");
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.module ? `[Module: ${form.module}] ${form.description}` : form.description,
        batch: batchId,
        deadline: new Date(form.dueDate).toISOString(),
        maximumScore: Number(form.maximumScore),
      };

      const response = await axios.post(
        "http://localhost:5000/api/assignments",
        payload,
        { headers: { ...headers, "Content-Type": "application/json" } }
      );

      const newAssignment = response.data.assignment || response.data.data || response.data;
      alert("Assignment created successfully!");
      setAssignments([newAssignment, ...assignments]);
      setShowForm(false);
      setForm({ title: "", module: "", description: "", dueDate: "", maximumScore: "100" });
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert(err.response?.data?.message || "Failed to create assignment.");
    }
  };

  const handleGradeSubmission = async (submissionId, status = "graded") => {
    const score = grades[submissionId];
    const feedback = feedbacks[submissionId] || "";

    if (status === "graded" && (score === undefined || score === "")) {
      alert("Please enter a valid score before grading.");
      return;
    }

    try {
      await axios.patch(
        `http://localhost:5000/api/submissions/${submissionId}/grade`,
        { 
          score: score !== undefined && score !== "" ? Number(score) : 0, 
          feedback, 
          status 
        },
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
      
      alert(status === "resubmission_requested" ? "Resubmission requested successfully!" : "Grade and feedback saved successfully!");
      handleSelectAssignment(selectedAssignment);
    } catch (err) {
      console.error("Error updating submission:", err);
      alert(err.response?.data?.message || "Failed to update submission.");
    }
  };

  return (
    <div className="min-h-screen bg-[#120d0a] p-8 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Assignments & Grading</h1>
          <p className="mt-2 text-[#c99d78]">Manage assignments and review student submissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-[#c99d78] px-5 py-3 font-bold text-black cursor-pointer hover:bg-[#b88c68]"
        >
          + Add Assignment
        </button>
      </div>

      {loading && <div className="text-[#c99d78]">Loading data...</div>}
      {error && <div className="text-red-400">{error}</div>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ASSIGNMENTS LIST */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-[#c99d78]">Created Assignments</h2>
          {assignments.length === 0 && !loading && (
            <p className="text-gray-400 text-sm">No assignments created yet.</p>
          )}
          {assignments.map((assignment) => (
            <div
              key={assignment._id}
              onClick={() => handleSelectAssignment(assignment)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selectedAssignment?._id === assignment._id
                  ? "border-[#c99d78] bg-[#1d1511]"
                  : "border-[#4a3528] bg-[#16100d] hover:border-[#c99d78]/50"
              }`}
            >
              <h3 className="font-bold text-lg text-white">{assignment.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-2 mt-1">{assignment.description}</p>
              <div className="mt-3 flex justify-between text-xs text-[#c99d78]">
                <span>Due: {new Date(assignment.deadline || assignment.dueDate).toLocaleDateString()}</span>
                <span>Max: {assignment.maximumScore || 100} pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* SUBMISSIONS & GRADING PANEL */}
        <div className="lg:col-span-2 rounded-xl border border-[#4a3528] bg-[#1d1511] p-6">
          {selectedAssignment ? (
            <div>
              <div className="border-b border-[#4a3528] pb-4 mb-6">
                <h2 className="text-2xl font-bold">{selectedAssignment.title} - Submissions</h2>
                <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{selectedAssignment.description}</p>
                <div className="mt-3 space-y-1 text-sm text-gray-300">
                  <p className="whitespace-pre-wrap"><span className="font-semibold text-[#c99d78]">Instructions:</span> {selectedAssignment.instructions || "No additional instructions."}</p>
                  {selectedAssignment.resourceLink && <a href={selectedAssignment.resourceLink} target="_blank" rel="noreferrer" className="block text-blue-400 underline">Open task resource link</a>}
                  {(selectedAssignment.resourceFiles || []).map((file) => <a key={file.path} href={`${fileBaseUrl}${file.path}`} target="_blank" rel="noreferrer" className="block text-blue-400 underline">Open task file: {file.originalName}</a>)}
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <p>No student submissions found for this assignment yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((sub) => {
                    return (
                      <div key={sub._id} className="rounded-lg border border-[#4a3528] bg-[#120d0a] p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-white">{sub.student?.fullName || "Student"}</h4>
                            <p className="text-xs text-gray-400">{sub.student?.email}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded font-semibold ${
                            sub.status === 'resubmission_requested' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                            sub.status === 'graded' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                            'bg-blue-900/50 text-blue-300 border border-blue-700'
                          }`}>
                            {sub.status || 'submitted'}
                          </span>
                        </div>

                        {/* Student Answer Box */}
                        <div className="rounded bg-[#1d1511] p-3 border border-[#4a3528]">
                          <span className="text-xs font-bold text-[#c99d78] uppercase tracking-wider block mb-1">Student Answer / Content:</span>
                          {sub.githubUrl && <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="block text-blue-400 underline break-all text-sm">Open GitHub submission</a>}
                          {sub.liveDemoUrl && <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer" className="block text-blue-400 underline break-all text-sm">Open live demo</a>}
                          {(sub.textAnswer || sub.content) && <p className="text-gray-200 text-sm whitespace-pre-wrap">{sub.textAnswer || sub.content}</p>}
                          {(sub.files || []).map((file) => <a key={file.path} href={`${fileBaseUrl}${file.path}`} target="_blank" rel="noreferrer" className="block text-blue-400 underline text-sm">Open submitted file: {file.originalName}</a>)}
                          {!sub.githubUrl && !sub.liveDemoUrl && !sub.textAnswer && !sub.content && !(sub.files || []).length && <p className="text-gray-200 text-sm">No submission content provided.</p>}
                          {sub.resubmissionReason && <p className="text-amber-300 text-sm whitespace-pre-wrap">Resubmission reason: {sub.resubmissionReason}</p>}
                        </div>

                        {/* Feedback Input */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Mentor Feedback / Comments</label>
                          <textarea
                            rows="2"
                            placeholder="Provide feedback or notes for resubmission..."
                            defaultValue={sub.feedback || ""}
                            onChange={(e) => setFeedbacks({ ...feedbacks, [sub._id]: e.target.value })}
                            className="w-full rounded border border-[#4a3528] bg-[#1d1511] p-2 text-white text-sm"
                          />
                        </div>

                        {/* Grading & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#4a3528]/50">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Score"
                              defaultValue={sub.score}
                              onChange={(e) => setGrades({ ...grades, [sub._id]: e.target.value })}
                              className="w-20 rounded border border-[#4a3528] bg-[#1d1511] p-2 text-white text-center text-sm"
                            />
                            <span className="text-sm text-gray-400">/ {selectedAssignment.maximumScore || 100}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleGradeSubmission(sub._id, "resubmission_requested")}
                              className="rounded border border-yellow-600 px-4 py-2 font-semibold text-yellow-400 text-xs cursor-pointer hover:bg-yellow-950/30"
                            >
                              Request Resubmission
                            </button>
                            <button
                              onClick={() => handleGradeSubmission(sub._id, "graded")}
                              className="rounded bg-[#c99d78] px-4 py-2 font-bold text-black text-xs cursor-pointer hover:bg-[#b88c68]"
                            >
                              Save Grade & Feedback
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-400">
              Select an assignment from the left list to view student submissions and grade them.
            </div>
          )}
        </div>
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-xl border border-[#4a3528] bg-[#1d1511]">
            <div className="flex justify-between border-b border-[#4a3528] p-6">
              <h2 className="text-2xl font-bold">Create Assignment</h2>
              <button onClick={() => setShowForm(false)} className="text-2xl cursor-pointer">×</button>
            </div>

            <form onSubmit={createAssignment} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Select Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                  required
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

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
                rows="3"
                placeholder="Assignment description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
              />

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="mb-1 block text-sm text-gray-400">Max Score</label>
                  <input
                    required
                    type="number"
                    value={form.maximumScore}
                    onChange={(e) => setForm({ ...form, maximumScore: e.target.value })}
                    className="w-full rounded-lg border border-[#4a3528] bg-[#120d0a] p-3 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-[#4a3b32] px-5 py-3 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#c99d78] px-5 py-3 font-bold text-black cursor-pointer"
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