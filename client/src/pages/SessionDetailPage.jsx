import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../hooks/useAuth";

const field =
  "w-full rounded border border-[#4a3b32] bg-[#16110e] p-2 text-sm";

const tabs = ["resources", "tasks", "attendance", "feedback"];

const fileUrl = (path) =>
  `${axiosInstance.defaults.baseURL.replace("/api", "")}${path}`;

export default function SessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [tab, setTab] = useState("tasks");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [task, setTask] = useState({
    title: "",
    description: "",
    deadline: "",
    maximumScore: 100,
  });

  const [answer, setAnswer] = useState({
    method: "text",
    text: "",
    github: "",
    files: [],
    reason: "",
  });

  const [grades, setGrades] = useState({});

  const [batches, setBatches] = useState([]);

  const [resourceForm, setResourceForm] = useState({
    title: "",
    resourceLink: "",
    file: null,
  });

  const [editingResource, setEditingResource] = useState(null);

  const [editForm, setEditForm] = useState(null);

  // ------------------------------------------------------------
  // ATTENDANCE
  // ------------------------------------------------------------

  const [attendanceDrafts, setAttendanceDrafts] = useState({});

  const manager =
    user?.role === "admin" || user?.role === "mentor";

  const admin = user?.role === "admin";

  const canManageResource = (resource) =>
    admin ||
    (user?.role === "mentor" &&
      String(resource.uploadedBy?._id || resource.uploadedBy) ===
        String(user._id));

  // ------------------------------------------------------------
  // LOAD SESSION
  // ------------------------------------------------------------

  const load = async () => {
    try {
      const response = await axiosInstance.get(`/sessions/${id}`);
      setData(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load session."
      );
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // ------------------------------------------------------------
  // LOAD BATCHES FOR ADMIN
  // ------------------------------------------------------------

  useEffect(() => {
    if (!admin) return;

    axiosInstance
      .get("/batches")
      .then((response) =>
        setBatches(response.data.batches || [])
      )
      .catch(() => {});
  }, [admin]);

  // ------------------------------------------------------------
  // AUTOMATIC STUDENT ATTENDANCE
  // ------------------------------------------------------------

  useEffect(() => {
    if (!data || !user || user.role !== "student") {
      return;
    }

    let interval;

    const startAttendanceTracking = async () => {
      try {
        await axiosInstance.post(`/sessions/${id}/join`);

        await load();

        interval = setInterval(async () => {
          try {
            const response = await axiosInstance.post(
              `/sessions/${id}/presence`
            );

            if (response.data?.completed) {
              clearInterval(interval);
              await load();
            }
          } catch (error) {
            console.error(
              "Attendance presence error:",
              error
            );
          }
        }, 30000);
      } catch (error) {
        console.error(
          "Unable to start attendance tracking:",
          error
        );
      }
    };

    startAttendanceTracking();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [data?.session?._id, user?._id]);

  // ------------------------------------------------------------
  // CREATE TASK
  // ------------------------------------------------------------

  const createTask = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("Creating task...");

    try {
      await axiosInstance.post("/assignments", {
        ...task,
        batch: data.session.batch._id,
        sessionId: id,
        deadline: new Date(
          task.deadline
        ).toISOString(),
      });

      setTask({
        title: "",
        description: "",
        deadline: "",
        maximumScore: 100,
      });

      setMessage(
        "Task created for your assigned students."
      );

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create task."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // SUBMIT TASK
  // ------------------------------------------------------------

  const submitTask = async (event, assignmentId) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("Submitting solution...");

    const body = new FormData();

    body.append("method", answer.method);
    body.append("textAnswer", answer.text);
    body.append("githubUrl", answer.github);
    body.append(
      "resubmissionReason",
      answer.reason
    );

    [...answer.files].forEach((file) => {
      body.append("files", file);
    });

    try {
      await axiosInstance.post(
        `/assignments/${assignmentId}/submit`,
        body
      );

      setMessage(
        "Solution submitted and reviewers notified."
      );

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to submit solution."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // GRADE TASK
  // ------------------------------------------------------------

  const gradeTask = async (
    assignmentId,
    submissionId,
    status
  ) => {
    if (busy) return;

    setBusy(true);

    setMessage(
      status === "redo"
        ? "Requesting resubmission..."
        : "Saving grade..."
    );

    const value = grades[submissionId] || {};

    try {
      await axiosInstance.patch(
        `/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        {
          score: value.score,
          feedback: value.feedback,
          status,
        }
      );

      setMessage(
        status === "redo"
          ? "Resubmission requested."
          : "Grade saved."
      );

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to save grade."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // EDIT TASK
  // ------------------------------------------------------------

  const editTask = async (item) => {
    const title = window.prompt(
      "Task title",
      item.title
    );

    if (!title?.trim()) return;

    const description = window.prompt(
      "Task details",
      item.description
    );

    if (description === null) return;

    try {
      await axiosInstance.patch(
        `/assignments/${item._id}`,
        {
          title,
          description,
        }
      );

      setMessage("Task updated.");

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update task."
      );
    }
  };

  // ------------------------------------------------------------
  // DELETE TASK
  // ------------------------------------------------------------

  const deleteTask = async (item) => {
    if (
      !window.confirm(
        `Delete task "${item.title}"?`
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/assignments/${item._id}`
      );

      setMessage("Task deleted.");

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to delete task."
      );
    }
  };

  // ------------------------------------------------------------
  // UPLOAD RESOURCE
  // ------------------------------------------------------------

  const uploadResource = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);

    const body = new FormData();

    body.append(
      "title",
      resourceForm.title || "Session resource"
    );

    body.append(
      "resourceLink",
      resourceForm.resourceLink
    );

    if (resourceForm.file) {
      body.append("file", resourceForm.file);
    }

    try {
      await axiosInstance.post(
        `/sessions/${id}/resources`,
        body
      );

      setResourceForm({
        title: "",
        resourceLink: "",
        file: null,
      });

      setMessage("Resource added.");

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to add resource."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // UPDATE RESOURCE
  // ------------------------------------------------------------

  const updateResource = async (event) => {
    event.preventDefault();

    if (busy || !editingResource) return;

    setBusy(true);

    try {
      await axiosInstance.patch(
        `/sessions/${id}/resources/${editingResource._id}`,
        {
          title: editingResource.title,
          resourceLink:
            editingResource.resourceLink,
        }
      );

      setEditingResource(null);

      setMessage("Resource updated.");

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update resource."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // DELETE RESOURCE
  // ------------------------------------------------------------

  const deleteResource = async (item) => {
    if (
      busy ||
      !window.confirm(
        `Delete resource "${item.title}"?`
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await axiosInstance.delete(
        `/sessions/${id}/resources/${item._id}`
      );

      setMessage("Resource deleted.");

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to delete resource."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // OPEN EDIT SESSION
  // ------------------------------------------------------------

  const openEdit = () => {
    setEditForm({
      title: session.title,
      description: session.description || "",
      meetLink: session.meetLink || "",
      batchId: session.batch?._id || "",
      startsAt: new Date(
        session.startsAt
      )
        .toISOString()
        .slice(0, 16),
      endsAt: new Date(
        session.endsAt
      )
        .toISOString()
        .slice(0, 16),
    });
  };

  // ------------------------------------------------------------
  // SAVE SESSION
  // ------------------------------------------------------------

  const saveSession = async (event) => {
    event.preventDefault();

    if (busy || !editForm) return;

    setBusy(true);

    try {
      await axiosInstance.patch(
        `/sessions/${id}`,
        {
          ...editForm,
          startsAt: new Date(
            editForm.startsAt
          ).toISOString(),
          endsAt: new Date(
            editForm.endsAt
          ).toISOString(),
        }
      );

      setEditForm(null);

      setMessage("Session updated.");

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update session."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // ATTENDANCE DRAFT
  // ------------------------------------------------------------

  const updateAttendanceDraft = (
    studentId,
    changes
  ) => {
    setAttendanceDrafts((previous) => ({
      ...previous,
      [studentId]: {
        ...(previous[studentId] || {}),
        ...changes,
      },
    }));
  };

  // ------------------------------------------------------------
  // SAVE ATTENDANCE
  // ------------------------------------------------------------

  const saveAttendance = async (studentId) => {
    if (busy) return;

    const record = attendance.find(
      (item) =>
        String(item.student?._id) ===
        String(studentId)
    );

    const draft =
      attendanceDrafts[studentId] || {};

    const status =
      draft.status ||
      record?.status ||
      "Absent";

    const lateMinutes =
      draft.lateMinutes !== undefined
        ? Number(draft.lateMinutes)
        : Number(record?.lateMinutes || 0);

    const note =
      draft.note !== undefined
        ? draft.note
        : record?.note || "";

    setBusy(true);

    setMessage("Saving attendance...");

    try {
      await axiosInstance.post(
        `/sessions/${id}/attendance`,
        {
          studentId,
          status,
          lateMinutes,
          note,
        }
      );

      setMessage(
        "Attendance saved successfully."
      );

      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to save attendance."
      );
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (!data) {
    return (
      <p className="rounded border border-[#4a3b32] p-6">
        {message || "Loading..."}
      </p>
    );
  }

  const { session, tasks, attendance } = data;

  // ------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* BACK */}
      <Link
        to="/sessions"
        className="text-sm text-[#c89b7b]"
      >
        ← Back to sessions
      </Link>

      {/* SESSION HEADER */}
      <header className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#c89b7b]">
              {session.batch.name}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {session.title}
            </h1>

            <p className="mt-2 text-sm text-[#a39081]">
              {session.description}
            </p>

            <p className="mt-3 text-sm">
              {new Date(
                session.startsAt
              ).toLocaleString()}{" "}
              -{" "}
              {new Date(
                session.endsAt
              ).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {admin && (
              <button
                type="button"
                onClick={openEdit}
                className="rounded border border-[#c89b7b] px-3 py-2 text-sm"
              >
                Edit session
              </button>
            )}

            {session.meetLink && (
              <a
                className="rounded bg-[#c89b7b] px-3 py-2 text-sm font-bold text-[#1e1713]"
                href={session.meetLink}
                target="_blank"
                rel="noreferrer"
              >
                Join Google Meet
              </a>
            )}
          </div>
        </div>
      </header>

      {/* MESSAGE */}
      {message && (
        <p className="rounded border border-[#4a3b32] p-3 text-sm text-amber-300">
          {message}
        </p>
      )}

      {/* TABS */}
      <nav className="grid grid-cols-2 gap-2 rounded-xl border border-[#4a3b32] p-2 sm:grid-cols-4">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded p-3 capitalize ${
              tab === item
                ? "bg-[#c89b7b] text-[#1e1713]"
                : "text-[#a39081]"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* ========================================================
          RESOURCES
      ======================================================== */}

      {tab === "resources" && (
        <section className="space-y-3 rounded-xl border border-[#4a3b32] p-5">
          <div>
            <h2 className="text-xl font-bold">
              Resources
            </h2>

            <p className="text-sm text-[#a39081]">
              Learning materials for this session.
            </p>
          </div>

          {session.resources?.length === 0 && (
            <p className="rounded border border-dashed border-[#4a3b32] p-4 text-sm text-[#a39081]">
              No resources have been added yet.
            </p>
          )}

          {session.resources?.map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#4a3b32] p-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium">
                  {item.title}
                </p>

                {item.originalName && (
                  <p className="text-xs text-[#a39081]">
                    {item.originalName}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {canManageResource(item) && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingResource({
                          _id: item._id,
                          title: item.title,
                          resourceLink:
                            item.resourceLink || "",
                        })
                      }
                      className="text-xs text-[#c89b7b]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteResource(item)
                      }
                      className="text-xs text-red-300"
                    >
                      Delete
                    </button>
                  </>
                )}

                {item.path ? (
                  <a
                    href={fileUrl(item.path)}
                    download={item.originalName}
                    className="text-[#c89b7b]"
                  >
                    Download
                  </a>
                ) : (
                  <a
                    href={item.resourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c89b7b]"
                  >
                    Open
                  </a>
                )}
              </div>
            </div>
          ))}

          {manager && (
            <form
              onSubmit={uploadResource}
              className="space-y-2 border-t border-[#4a3b32] pt-4"
            >
              <h3 className="font-bold">
                Add resource
              </h3>

              <input
                className={field}
                placeholder="Resource title"
                value={resourceForm.title}
                onChange={(event) =>
                  setResourceForm({
                    ...resourceForm,
                    title: event.target.value,
                  })
                }
              />

              <input
                className={field}
                type="url"
                placeholder="Resource link (optional)"
                value={resourceForm.resourceLink}
                onChange={(event) =>
                  setResourceForm({
                    ...resourceForm,
                    resourceLink:
                      event.target.value,
                  })
                }
              />

              <input
                className={field}
                type="file"
                onChange={(event) =>
                  setResourceForm({
                    ...resourceForm,
                    file: event.target.files?.[0] || null,
                  })
                }
              />

              <button
                disabled={busy}
                className="rounded bg-[#c89b7b] px-3 py-2 text-sm text-[#1e1713] disabled:opacity-60"
              >
                {busy
                  ? "Working..."
                  : "Add resource"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* ========================================================
          FEEDBACK
      ======================================================== */}

      {tab === "feedback" && (
        <section className="space-y-3 rounded-xl border border-[#4a3b32] p-5">
          <h2 className="text-xl font-bold">
            Anonymous feedback
          </h2>

          <p className="text-sm text-[#a39081]">
            Feedback is displayed anonymously.
          </p>

          {session.feedback?.length === 0 && (
            <p className="rounded border border-dashed border-[#4a3b32] p-4 text-sm text-[#a39081]">
              No feedback yet.
            </p>
          )}

          {session.feedback?.map((item) => (
            <p
              key={item._id}
              className="rounded border border-[#4a3b32] p-3"
            >
              {item.message}
            </p>
          ))}

          {manager && (
            <p className="text-xs text-[#a39081]">
              Student identities are hidden from this
              feedback list.
            </p>
          )}
        </section>
      )}

      {/* ========================================================
          ATTENDANCE
      ======================================================== */}

      {tab === "attendance" && (
        <section className="space-y-4 rounded-xl border border-[#4a3b32] bg-[#1e1713] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">
                Attendance
              </h2>

              <p className="text-sm text-[#a39081]">
                Track attendance for students in this
                session.
              </p>
            </div>

            {manager && (
              <span className="rounded-full border border-[#4a3b32] px-3 py-1 text-xs text-[#a39081]">
                {session.batch.students?.length || 0}{" "}
                students
              </span>
            )}
          </div>

          {/* STUDENT VIEW */}
          {user?.role === "student" ? (
            <div className="rounded-lg border border-[#4a3b32] bg-[#16110e] p-4">
              <p className="text-sm text-[#a39081]">
                Your attendance
              </p>

              <p className="mt-2 text-2xl font-bold">
                {attendance[0]?.status ||
                  "Not recorded"}
              </p>

              {attendance[0]?.attendedSeconds >
                0 && (
                <p className="mt-2 text-xs text-[#a39081]">
                  Time attended:{" "}
                  {Math.floor(
                    attendance[0]
                      .attendedSeconds / 60
                  )}{" "}
                  minutes
                </p>
              )}

              {attendance[0]?.status ===
                "Present" && (
                <p className="mt-3 text-sm text-emerald-300">
                  ✓ Attendance completed
                </p>
              )}

              {attendance[0]?.status ===
                "Absent" && (
                <p className="mt-3 text-sm text-amber-300">
                  Attendance is currently being
                  tracked.
                </p>
              )}
            </div>
          ) : (
            /* ADMIN / MENTOR VIEW */
            <div className="overflow-x-auto rounded-lg border border-[#4a3b32]">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="border-b border-[#4a3b32] bg-[#16110e]">
                  <tr>
                    <th className="p-3 text-left">
                      Student
                    </th>

                    <th className="p-3 text-left">
                      Current
                    </th>

                    <th className="p-3 text-left">
                      Status
                    </th>

                    <th className="p-3 text-left">
                      Late minutes
                    </th>

                    <th className="p-3 text-left">
                      Note
                    </th>

                    <th className="p-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {session.batch.students?.map(
                    (student) => {
                      const record =
                        attendance.find(
                          (item) =>
                            String(
                              item.student?._id
                            ) ===
                            String(student._id)
                        );

                      const draft =
                        attendanceDrafts[
                          student._id
                        ] || {};

                      const currentStatus =
                        draft.status ||
                        record?.status ||
                        "Absent";

                      const currentLateMinutes =
                        draft.lateMinutes !==
                        undefined
                          ? draft.lateMinutes
                          : record?.lateMinutes ||
                            0;

                      const currentNote =
                        draft.note !==
                        undefined
                          ? draft.note
                          : record?.note || "";

                      return (
                        <tr
                          key={student._id}
                          className="border-b border-[#4a3b32] last:border-b-0"
                        >
                          <td className="p-3">
                            <div className="font-medium">
                              {student.fullName}
                            </div>

                            {student.email && (
                              <div className="text-xs text-[#a39081]">
                                {student.email}
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                record?.status ===
                                "Present"
                                  ? "bg-emerald-900/40 text-emerald-300"
                                  : record?.status ===
                                    "Late"
                                    ? "bg-amber-900/40 text-amber-300"
                                    : record?.status ===
                                      "Excused"
                                      ? "bg-blue-900/40 text-blue-300"
                                      : record?.status ===
                                        "Absent"
                                        ? "bg-red-900/40 text-red-300"
                                        : "bg-[#2a211c] text-[#a39081]"
                              }`}
                            >
                              {record?.status ||
                                "Not recorded"}
                            </span>
                          </td>

                          <td className="p-3">
                            <select
                              className={field}
                              value={
                                currentStatus
                              }
                              disabled={
                                !manager || busy
                              }
                              onChange={(event) =>
                                updateAttendanceDraft(
                                  student._id,
                                  {
                                    status:
                                      event.target
                                        .value,
                                    lateMinutes:
                                      event.target
                                        .value ===
                                      "Late"
                                        ? currentLateMinutes
                                        : 0,
                                  }
                                )
                              }
                            >
                              <option value="Present">
                                Present
                              </option>

                              <option value="Absent">
                                Absent
                              </option>

                              <option value="Late">
                                Late
                              </option>

                              <option value="Excused">
                                Excused
                              </option>
                            </select>
                          </td>

                          <td className="p-3">
                            <input
                              className={field}
                              type="number"
                              min="0"
                              max="15"
                              disabled={
                                !manager ||
                                busy ||
                                currentStatus !==
                                  "Late"
                              }
                              value={
                                currentLateMinutes
                              }
                              onChange={(event) =>
                                updateAttendanceDraft(
                                  student._id,
                                  {
                                    lateMinutes:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                            />
                          </td>

                          <td className="p-3">
                            <input
                              className={field}
                              placeholder="Optional note"
                              disabled={
                                !manager || busy
                              }
                              value={currentNote}
                              onChange={(event) =>
                                updateAttendanceDraft(
                                  student._id,
                                  {
                                    note: event.target
                                      .value,
                                  }
                                )
                              }
                            />
                          </td>

                          <td className="p-3 text-right">
                            {manager && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  saveAttendance(
                                    student._id
                                  )
                                }
                                className="rounded bg-[#c89b7b] px-3 py-2 text-xs font-bold text-[#1e1713] disabled:opacity-50"
                              >
                                Save
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          TASKS
      ======================================================== */}

      {tab === "tasks" && (
        <section className="space-y-4 rounded-xl border border-[#4a3b32] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Tasks
            </h2>

            <span className="text-xs text-[#a39081]">
              {tasks.length} task(s)
            </span>
          </div>

          {manager && (
            <form
              onSubmit={createTask}
              className="space-y-2 rounded border border-dashed border-[#4a3b32] p-4"
            >
              <h3 className="font-bold">
                Create task for assigned students
              </h3>

              <input
                className={field}
                required
                placeholder="Task title"
                value={task.title}
                onChange={(event) =>
                  setTask({
                    ...task,
                    title: event.target.value,
                  })
                }
              />

              <textarea
                className={field}
                required
                placeholder="Task details"
                value={task.description}
                onChange={(event) =>
                  setTask({
                    ...task,
                    description:
                      event.target.value,
                  })
                }
              />

              <input
                className={field}
                required
                type="datetime-local"
                value={task.deadline}
                onChange={(event) =>
                  setTask({
                    ...task,
                    deadline:
                      event.target.value,
                  })
                }
              />

              <input
                className={field}
                type="number"
                min="0"
                value={task.maximumScore}
                onChange={(event) =>
                  setTask({
                    ...task,
                    maximumScore:
                      event.target.value,
                  })
                }
              />

              <button
                disabled={busy}
                className="rounded bg-[#c89b7b] px-3 py-2 text-sm text-[#1e1713] disabled:opacity-60"
              >
                {busy
                  ? "Creating..."
                  : "Create task"}
              </button>
            </form>
          )}

          {tasks.map((item) => (
            <article
              key={item._id}
              className="rounded border border-[#4a3b32] p-4"
            >
              <div className="flex justify-between">
                <div>
                  <b>{item.title}</b>

                  {manager && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editTask(item)
                        }
                        className="rounded border border-[#c89b7b] px-2 py-1 text-xs"
                      >
                        Edit task
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTask(item)
                        }
                        className="rounded border border-red-800 px-2 py-1 text-xs text-red-300"
                      >
                        Delete task
                      </button>
                    </div>
                  )}
                </div>

                <span>
                  {item.maximumScore} points
                </span>
              </div>

              <p className="mt-2 text-sm text-[#a39081]">
                {item.description}
              </p>

              <Link
                to={`/assignments/${item._id}`}
                className="mt-2 inline-block text-xs text-[#c89b7b] underline"
              >
                Open task workspace
              </Link>

              {/* STUDENT SUBMISSION */}

              {user?.role === "student" && (
                <form
                  onSubmit={(event) =>
                    submitTask(
                      event,
                      item._id
                    )
                  }
                  className="mt-3 space-y-2"
                >
                  <select
                    className={field}
                    value={answer.method}
                    onChange={(event) =>
                      setAnswer({
                        ...answer,
                        method:
                          event.target.value,
                      })
                    }
                  >
                    <option value="text">
                      Write answer
                    </option>

                    <option value="github">
                      GitHub link
                    </option>

                    <option value="files">
                      Upload folder/files
                    </option>
                  </select>

                  {answer.method === "text" && (
                    <textarea
                      className={field}
                      required
                      placeholder="Write your answer..."
                      value={answer.text}
                      onChange={(event) =>
                        setAnswer({
                          ...answer,
                          text: event.target
                            .value,
                        })
                      }
                    />
                  )}

                  {answer.method === "github" && (
                    <input
                      className={field}
                      required
                      type="url"
                      placeholder="GitHub repository URL"
                      value={answer.github}
                      onChange={(event) =>
                        setAnswer({
                          ...answer,
                          github:
                            event.target.value,
                        })
                      }
                    />
                  )}

                  {answer.method === "files" && (
                    <input
                      className={field}
                      required
                      type="file"
                      multiple
                      onChange={(event) =>
                        setAnswer({
                          ...answer,
                          files:
                            event.target.files,
                        })
                      }
                    />
                  )}

                  <textarea
                    className={field}
                    placeholder="Reason for resubmission (optional)"
                    value={answer.reason}
                    onChange={(event) =>
                      setAnswer({
                        ...answer,
                        reason:
                          event.target.value,
                      })
                    }
                  />

                  <button
                    disabled={busy}
                    className="rounded bg-[#c89b7b] px-3 py-2 text-sm text-[#1e1713] disabled:opacity-60"
                  >
                    {busy
                      ? "Submitting..."
                      : "Submit solution"}
                  </button>
                </form>
              )}

              {/* SUBMISSIONS */}

              {item.submissions?.map(
                (submission) => (
                  <div
                    key={submission._id}
                    className="mt-3 rounded bg-[#16110e] p-3 text-sm"
                  >
                    <p>
                      {user?.role ===
                      "student"
                        ? submission.status
                        : `${submission.student?.fullName} · ${submission.method}`}
                    </p>

                    {submission.githubUrl && (
                      <a
                        href={
                          submission.githubUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[#c89b7b]"
                      >
                        Open GitHub
                      </a>
                    )}

                    {submission.textAnswer && (
                      <p className="mt-2">
                        {submission.textAnswer}
                      </p>
                    )}

                    {submission.files?.map(
                      (file) => (
                        <a
                          key={file.path}
                          href={fileUrl(
                            file.path
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[#c89b7b]"
                        >
                          Open{" "}
                          {file.originalName}
                        </a>
                      )
                    )}

                    {/* MANAGER GRADING */}

                    {manager && (
                      <div className="mt-3 space-y-2">
                        <input
                          className={field}
                          type="number"
                          min="0"
                          placeholder="Score"
                          value={
                            grades[
                              submission._id
                            ]?.score ||
                            submission.score ||
                            ""
                          }
                          onChange={(event) =>
                            setGrades({
                              ...grades,
                              [submission._id]:
                                {
                                  ...(grades[
                                    submission
                                      ._id
                                  ] || {}),
                                  score:
                                    event.target
                                      .value,
                                },
                            })
                          }
                        />

                        <textarea
                          className={field}
                          placeholder="Feedback"
                          value={
                            grades[
                              submission._id
                            ]?.feedback ||
                            submission.feedback ||
                            ""
                          }
                          onChange={(event) =>
                            setGrades({
                              ...grades,
                              [submission._id]:
                                {
                                  ...(grades[
                                    submission
                                      ._id
                                  ] || {}),
                                  feedback:
                                    event.target
                                      .value,
                                },
                            })
                          }
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              gradeTask(
                                item._id,
                                submission._id,
                                "graded"
                              )
                            }
                            className="rounded bg-[#c89b7b] px-3 py-2 text-xs font-bold text-[#1e1713]"
                          >
                            Save grade
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              gradeTask(
                                item._id,
                                submission._id,
                                "redo"
                              )
                            }
                            className="rounded border border-amber-700 px-3 py-2 text-xs text-amber-300"
                          >
                            Request resubmission
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STUDENT GRADE */}

                    {user?.role ===
                      "student" &&
                      submission.status ===
                        "graded" && (
                        <p className="mt-2 text-emerald-300">
                          Grade:{" "}
                          {submission.score}{" "}
                          ·{" "}
                          {
                            submission.feedback
                          }
                        </p>
                      )}
                  </div>
                )
              )}
            </article>
          ))}
        </section>
      )}

      {/* ========================================================
          EDIT SESSION MODAL
      ======================================================== */}

      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={saveSession}
            className="w-full max-w-xl space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">
                Edit session
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditForm(null)
                }
                className="text-sm text-[#a39081]"
              >
                Close
              </button>
            </div>

            <input
              className={field}
              required
              placeholder="Title"
              value={editForm.title}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  title: event.target.value,
                })
              }
            />

            <textarea
              className={field}
              placeholder="Description"
              value={editForm.description}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  description:
                    event.target.value,
                })
              }
            />

            <input
              className={field}
              type="url"
              pattern="https://meet.google.com/.*"
              placeholder="Google Meet link"
              value={editForm.meetLink}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  meetLink:
                    event.target.value,
                })
              }
            />

            <select
              className={field}
              required
              value={editForm.batchId}
              onChange={(event) =>
                setEditForm({
                  ...editForm,
                  batchId:
                    event.target.value,
                })
              }
            >
              {batches.map((batch) => (
                <option
                  key={batch._id}
                  value={batch._id}
                >
                  {batch.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input
                className={field}
                required
                type="datetime-local"
                value={editForm.startsAt}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    startsAt:
                      event.target.value,
                  })
                }
              />

              <input
                className={field}
                required
                type="datetime-local"
                value={editForm.endsAt}
                onChange={(event) =>
                  setEditForm({
                    ...editForm,
                    endsAt:
                      event.target.value,
                  })
                }
              />
            </div>

            <button
              disabled={busy}
              className="rounded bg-[#c89b7b] px-3 py-2 font-bold text-[#1e1713]"
            >
              {busy
                ? "Saving..."
                : "Save changes"}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          EDIT RESOURCE MODAL
      ======================================================== */}

      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={updateResource}
            className="w-full max-w-md space-y-3 rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-6"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">
                Edit resource
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditingResource(null)
                }
              >
                Close
              </button>
            </div>

            <input
              className={field}
              required
              placeholder="Resource title"
              value={editingResource.title}
              onChange={(event) =>
                setEditingResource({
                  ...editingResource,
                  title: event.target.value,
                })
              }
            />

            <input
              className={field}
              type="url"
              placeholder="Resource link"
              value={
                editingResource.resourceLink
              }
              onChange={(event) =>
                setEditingResource({
                  ...editingResource,
                  resourceLink:
                    event.target.value,
                })
              }
            />

            <button
              disabled={busy}
              className="rounded bg-[#c89b7b] px-3 py-2 font-bold text-[#1e1713]"
            >
              {busy
                ? "Saving..."
                : "Save resource"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}