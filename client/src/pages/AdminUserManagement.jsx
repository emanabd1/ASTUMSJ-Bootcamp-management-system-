import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const field =
  "w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none";

const roles = ["student", "mentor", "admin"];

const empty = {
  fullName: "",
  email: "",
  role: "student",
  department: "",
  gender: "Male",
  yearOfStudy: "1st Year",
  githubUrl: "",
  leetcodeUrl: "",
  codeforcesUrl: "",
  batchId: "",
  university: "",
  universityIdNumber: "",
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [pending, setPending] = useState([]);
  const [batches, setBatches] = useState([]);
  const [universities, setUniversities] = useState([]);

  const [universityFilter, setUniversityFilter] =
    useState("");

  const [pendingBatches, setPendingBatches] =
    useState({});

  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState(null);

  const [form, setForm] =
    useState(empty);

  const [show, setShow] =
    useState("");

  const [msg, setMsg] =
    useState("");

  const load = async () => {
    try {
      const [
        userResponse,
        mentorResponse,
        pendingResponse,
        batchResponse,
        universityResponse,
      ] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get("/users/mentors"),
        axiosInstance.get(
          "/users/applications/pending"
        ),
        axiosInstance.get("/batches"),
        axiosInstance.get("/universities"),
      ]);

      setUsers(
        userResponse.data.users || []
      );

      setMentors(
        mentorResponse.data.mentors || []
      );

      setPending(
        pendingResponse.data.users || []
      );

      setBatches(
        batchResponse.data.batches || []
      );

      setUniversities(
        universityResponse.data.universities ||
          []
      );
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not load users."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users
      .filter((user) =>
        `${user.fullName} ${user.email} ${user.role}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .filter(
        (user) =>
          !universityFilter ||
          user.university?._id ===
            universityFilter
      );
  }, [
    users,
    search,
    universityFilter,
  ]);

  const update = async (
    id,
    data
  ) => {
    try {
      await axiosInstance.patch(
        `/users/${id}`,
        data
      );

      setMsg("Updated successfully.");

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Update failed."
      );
    }
  };

  const assign = async (
    studentId,
    mentorId
  ) => {
    try {
            let response;
      if (mentorId) {
        response = await axiosInstance.post(`/users/${studentId}/assign-mentor`, {
          mentorId,
        });
      } else {
        response = await axiosInstance.delete(`/users/${studentId}/assign-mentor`);
      }
      
      setMsg(response.data.message || "Mentor assignment updated successfully.");
      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || "Assignment failed.");

    }
  };

  const create = async (event) => {
    event.preventDefault();

    setMsg("");

    if (
      form.role === "student" &&
      !form.university
    ) {
      setMsg(
        "Please select a university for the student."
      );
      return;
    }

    if (
      form.role === "student" &&
      !form.universityIdNumber.trim()
    ) {
      setMsg(
        "Please enter the student's university ID number."
      );
      return;
    }

    try {
      const response =
        await axiosInstance.post(
          "/users",
          {
            ...form,

            university:
              form.role === "student"
                ? form.university
                : null,

            universityIdNumber:
              form.role === "student"
                ? form.universityIdNumber.trim()
                : "",
          }
        );

      setMsg(
        response.data.message ||
          "User created successfully."
      );

      setShow("");
      setForm(empty);

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not create user."
      );
    }
  };

  const save = async (event) => {
    event.preventDefault();

    if (
      form.role === "student" &&
      !form.university
    ) {
      setMsg(
        "Please select a university for the student."
      );
      return;
    }

    if (
      form.role === "student" &&
      !form.universityIdNumber.trim()
    ) {
      setMsg(
        "Please enter the student's university ID number."
      );
      return;
    }

    await update(
      selected._id,
      form
    );

    setShow("");
    setSelected(null);
  };

  const openEdit = (user) => {
    setSelected(user);

    setForm({
      ...empty,
      ...user,

      university:
        user.university?._id || "",

      universityIdNumber:
        user.universityIdNumber || "",
    });

    setShow("edit");
  };

  const openView = async (id) => {
    try {
      const response =
        await axiosInstance.get(
          `/users/${id}`
        );

      setSelected(
        response.data.user
      );

      setShow("view");
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not load user."
      );
    }
  };

  const remove = async (id) => {
    if (
      !confirm(
        "Delete this user permanently?"
      )
    ) {
      return;
    }

    try {
      await axiosInstance.delete(
        `/users/${id}`
      );

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          "Could not delete user."
      );
    }
  };

  const Row = ({
    user,
    pendingRow = false,
  }) => (
    <tr className="border-t border-[#4a3b32] hover:bg-[#2d231d]/40">
      <td className="p-4 font-bold">
        {user.fullName}
      </td>

      <td className="p-4 text-[#a39081]">
        {user.email}
      </td>

      <td className="p-4 uppercase text-[#c89b7b]">
        {user.role}
      </td>

      <td className="p-4">
        {user.university ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  user.university.color ||
                  "#c89b7b",
              }}
            />

            {user.university.shortName ||
              user.university.name}
          </span>
        ) : (
          <span className="text-[#a39081]">
            —
          </span>
        )}
      </td>

      <td className="p-4">
        {user.status === "approved"
          ? user.isActive
            ? "Active"
            : "Suspended"
          : user.status}
      </td>

      <td className="whitespace-nowrap p-4 text-right">
        <button
          onClick={() =>
            openView(user._id)
          }
          className="mr-2 rounded-lg bg-[#4a3b32] px-3 py-1"
        >
          View
        </button>

        {pendingRow ? (
          <>
            <select
              value={
                pendingBatches[user._id] ||
                ""
              }
              onChange={(event) =>
                setPendingBatches({
                  ...pendingBatches,
                  [user._id]:
                    event.target.value,
                })
              }
              className="mr-2 max-w-36 rounded-lg border border-[#4a3b32] bg-[#16110e] px-2 py-1 text-xs"
            >
              <option value="">
                No batch
              </option>

              {batches.map(
                (batch) => (
                  <option
                    key={batch._id}
                    value={batch._id}
                  >
                    {batch.name}
                  </option>
                )
              )}
            </select>

            <button
              onClick={() =>
                update(user._id, {
                  status: "approved",
                  isActive: true,
                  batchId:
                    pendingBatches[
                      user._id
                    ] || undefined,
                })
              }
              className="mr-2 rounded-lg bg-emerald-700/70 px-3 py-1"
            >
              Accept
            </button>

            <button
              onClick={() =>
                update(user._id, {
                  status: "rejected",
                  isActive: false,
                })
              }
              className="rounded-lg bg-rose-700/70 px-3 py-1"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() =>
                openEdit(user)
              }
              className="mr-2 rounded-lg bg-[#c89b7b] px-3 py-1 text-[#1e1713]"
            >
              Edit
            </button>

            <select
              value={
                user.isActive
                  ? "active"
                  : "suspended"
              }
              onChange={(event) =>
                update(user._id, {
                  status: "approved",
                  isActive:
                    event.target.value ===
                    "active",
                })
              }
              className="mr-2 rounded-lg border border-[#4a3b32] bg-[#16110e] px-2 py-1"
            >
              <option value="active">
                Active
              </option>

              <option value="suspended">
                Suspended
              </option>
            </select>

            <button
              onClick={() =>
                remove(user._id)
              }
              className="rounded-lg bg-rose-700/70 px-3 py-1"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            User Management
          </h1>

          <p className="text-xs text-[#a39081]">
            Users, pending applications,
            universities and mentor assignments.
          </p>
        </div>

        <button
          onClick={() => {
            setForm(empty);
            setSelected(null);
            setMsg("");
            setShow("create");
          }}
          className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]"
        >
          + Create User
        </button>
      </div>

      {msg && (
        <p className="rounded-xl border border-[#4a3b32] bg-[#1e1713] p-3 text-sm text-amber-400">
          {msg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            setTab("users")
          }
          className={`rounded-xl px-4 py-2 text-xs font-bold ${
            tab === "users"
              ? "bg-[#c89b7b] text-[#1e1713]"
              : "bg-[#1e1713]"
          }`}
        >
          All Users
        </button>

        <button
          onClick={() =>
            setTab("pending")
          }
          className={`rounded-xl px-4 py-2 text-xs font-bold ${
            tab === "pending"
              ? "bg-[#c89b7b] text-[#1e1713]"
              : "bg-[#1e1713]"
          }`}
        >
          Pending ({pending.length})
        </button>

        <button
          onClick={() =>
            setTab("mentors")
          }
          className={`rounded-xl px-4 py-2 text-xs font-bold ${
            tab === "mentors"
              ? "bg-[#c89b7b] text-[#1e1713]"
              : "bg-[#1e1713]"
          }`}
        >
          Manage Mentors
        </button>
      </div>

      {tab !== "mentors" && (
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search name, email or role..."
            className={`${field} max-w-xs`}
          />

          <select
            value={universityFilter}
            onChange={(event) =>
              setUniversityFilter(
                event.target.value
              )
            }
            className={`${field} max-w-56`}
          >
            <option value="">
              All universities
            </option>

            {universities.map(
              (university) => (
                <option
                  key={university._id}
                  value={university._id}
                >
                  {university.shortName ||
                    university.name}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {tab === "users" && (
        <section className="overflow-hidden rounded-2xl border border-[#4a3b32] bg-[#1e1713]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16110e] text-[#a39081]">
                <tr>
                  <th className="p-4">
                    Name
                  </th>
                  <th className="p-4">
                    Email
                  </th>
                  <th className="p-4">
                    Role
                  </th>
                  <th className="p-4">
                    University
                  </th>
                  <th className="p-4">
                    State
                  </th>
                  <th className="p-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (user) => (
                    <Row
                      key={user._id}
                      user={user}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "pending" && (
        <section className="overflow-hidden rounded-2xl border border-[#4a3b32] bg-[#1e1713]">
          <div className="border-b border-[#4a3b32] p-4">
            <h2 className="font-bold">
              Pending Applications
            </h2>

            <p className="text-[11px] text-[#a39081]">
              Review registration data.
              Passwords are never shown.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16110e] text-[#a39081]">
                <tr>
                  <th className="p-4">
                    Name
                  </th>
                  <th className="p-4">
                    Email
                  </th>
                  <th className="p-4">
                    Role
                  </th>
                  <th className="p-4">
                    University
                  </th>
                  <th className="p-4">
                    Status
                  </th>
                  <th className="p-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {pending
                  .filter((user) =>
                    `${user.fullName} ${user.email}`
                      .toLowerCase()
                      .includes(
                        search.toLowerCase()
                      )
                  )
                  .filter(
                    (user) =>
                      !universityFilter ||
                      user.university?._id ===
                        universityFilter
                  )
                  .map((user) => (
                    <Row
                      key={user._id}
                      user={user}
                      pendingRow
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "mentors" && (
        <section className="space-y-4">
          <p className="text-xs text-[#a39081]">
            Choose a mentor first, then select
            students from the complete active
            student list.
          </p>

          {mentors.map(
            (mentor) => (
              <MentorCard
                key={mentor._id}
                mentor={mentor}
                students={users.filter(
                  (user) =>
                    user.role ===
                      "student" &&
                    user.status ===
                      "approved" &&
                    user.isActive
                )}
                assign={assign}
              />
            )
          )}
        </section>
      )}

      {show && (
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
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#4a3b32] bg-[#1e1713] p-6"
          >
                       {msg && <p className="mb-4 rounded-xl border border-rose-700/40 bg-rose-950/30 p-3 text-sm text-rose-300">{msg}</p>}
            {show === "view" && selected && (
              <>
                <div className="flex justify-between">
                  <h2 className="text-2xl font-bold">User Details</h2>
                  <button onClick={() => setShow("")}>✕</button>
                </div>
                <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm">
                  {[
                    ["Full Name", selected.fullName],
                    ["Email", selected.email],
                    ["Role", selected.role],
                    ["Status", selected.status],
                    ["Active", selected.isActive ? "Yes" : "No"],
                    ["Gender", selected.gender || "—"],
                    ["Department", selected.department || "—"],
                    ["Year", selected.yearOfStudy || "—"],
                    ["Mentor", selected.mentor?.fullName || "Unassigned"],
                    ["GitHub", selected.githubUrl || "—"],
                    ["LeetCode", selected.leetcodeUrl || "—"],
                    ["Codeforces", selected.codeforcesUrl || "—"],
                    ["Why Join", selected.bootcampReason || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-[#4a3b32] p-3">
                      <span className="font-semibold block text-gray-400">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {show === "create" && (
              <form
                onSubmit={create}
                className="space-y-3"
              >
                <h2 className="text-2xl font-bold">
                  Create User
                </h2>

                <p className="text-xs text-[#a39081]">
                  A temporary password will
                  be generated and emailed.
                </p>

                <input
                  className={field}
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      fullName:
                        event.target.value,
                    })
                  }
                  required
                />

                <input
                  className={field}
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email:
                        event.target.value,
                    })
                  }
                  required
                />

                <select
                  className={field}
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role:
                        event.target.value,
                      university:
                        event.target.value ===
                        "student"
                          ? form.university
                          : "",
                      universityIdNumber:
                        event.target.value ===
                        "student"
                          ? form.universityIdNumber
                          : "",
                    })
                  }
                >
                  {roles.map(
                    (role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {role}
                      </option>
                    )
                  )}
                </select>

                <select
                  className={field}
                  value={
                    form.batchId || ""
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      batchId:
                        event.target.value,
                    })
                  }
                >
                  <option value="">
                    No batch
                  </option>

                  {batches.map(
                    (batch) => (
                      <option
                        key={batch._id}
                        value={batch._id}
                      >
                        {batch.name}
                      </option>
                    )
                  )}
                </select>

                {/* UNIVERSITY */}
                <select
                  className={field}
                  required={
                    form.role ===
                    "student"
                  }
                  value={
                    form.university || ""
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      university:
                        event.target.value,
                    })
                  }
                >
                  <option value="">
                    {form.role ===
                    "student"
                      ? "Select university"
                      : "No university"}
                  </option>

                  {universities.map(
                    (university) => (
                      <option
                        key={
                          university._id
                        }
                        value={
                          university._id
                        }
                      >
                        {university.shortName
                          ? `${university.name} (${university.shortName})`
                          : university.name}
                      </option>
                    )
                  )}
                </select>

                {/* UNIVERSITY ID */}
                <input
                  className={field}
                  required={
                    form.role ===
                    "student"
                  }
                  placeholder={
                    form.role ===
                    "student"
                      ? "University ID number *"
                      : "University ID number (optional)"
                  }
                  value={
                    form.universityIdNumber ||
                    ""
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      universityIdNumber:
                        event.target.value,
                    })
                  }
                />

                <input
                  className={field}
                  placeholder="Department"
                  value={
                    form.department
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      department:
                        event.target.value,
                    })
                  }
                />

                <button className="w-full rounded-xl bg-[#c89b7b] py-3 font-bold text-[#1e1713]">
                  Create
                </button>
              </form>
            )}

            {show === "edit" &&
              selected && (
                <form
                  onSubmit={save}
                  className="space-y-3"
                >
                  <div className="flex justify-between">
                    <h2 className="text-2xl font-bold">
                      Edit User
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

                  {[
                    [
                      "fullName",
                      "Full name",
                    ],
                    [
                      "email",
                      "Email",
                    ],
                    [
                      "department",
                      "Department",
                    ],
                    [
                      "universityIdNumber",
                      "University ID number",
                    ],
                    [
                      "githubUrl",
                      "GitHub URL",
                    ],
                    [
                      "leetcodeUrl",
                      "LeetCode URL",
                    ],
                    [
                      "codeforcesUrl",
                      "Codeforces URL",
                    ],
                  ].map(
                    ([key, label]) => (
                      <input
                        key={key}
                        className={field}
                        placeholder={
                          label
                        }
                        value={
                          form[key] || ""
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [key]:
                              event.target
                                .value,
                          })
                        }
                      />
                    )
                  )}

                  <select
                    className={field}
                    required={
                      form.role ===
                      "student"
                    }
                    value={
                      form.university ||
                      ""
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        university:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      {form.role ===
                      "student"
                        ? "Select university"
                        : "No university"}
                    </option>

                    {universities.map(
                      (university) => (
                        <option
                          key={
                            university._id
                          }
                          value={
                            university._id
                          }
                        >
                          {university.shortName
                            ? `${university.name} (${university.shortName})`
                            : university.name}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    className={field}
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role:
                          event.target
                            .value,
                      })
                    }
                  >
                    {roles.map(
                      (role) => (
                        <option
                          key={role}
                          value={role}
                        >
                          {role}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    className={field}
                    value={form.gender}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option>
                      Male
                    </option>
                    <option>
                      Female
                    </option>
                    <option>
                      Other
                    </option>
                  </select>

                  <select
                    className={field}
                    value={
                      form.yearOfStudy
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        yearOfStudy:
                          event.target
                            .value,
                      })
                    }
                  >
                    {[
                      "1st Year",
                      "2nd Year",
                      "3rd Year",
                      "4th Year",
                      "5th Year",
                    ].map(
                      (year) => (
                        <option
                          key={year}
                        >
                          {year}
                        </option>
                      )
                    )}
                  </select>

                  <button className="w-full rounded-xl bg-[#c89b7b] py-3 font-bold text-[#1e1713]">
                    Save Changes
                  </button>
                </form>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
function MentorCard({ mentor, students, assign }) {
  // Initializes state with an array of IDs for students currently assigned to this mentor
  const [selectedStudents, setSelectedStudents] = useState(() =>
    students
      .filter((student) => student.mentor?._id === mentor._id)
      .map((student) => student._id)
  );

  // Toggles student assignment state locally before saving
  const toggle = (id) => {
    setSelectedStudents((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const save = async () => {
     const handleSave = async () => {
    for (const student of students) {
      const shouldBeAssigned = selectedStudents.includes(student._id);
      const currentlyAssigned = student.mentor?._id === mentor._id;

      // Case 1: Checked in UI, but not yet assigned to this mentor in DB
      if (shouldBeAssigned && !currentlyAssigned) {
        await assign(student._id, mentor._id);
      }

      // Case 2: Unchecked in UI, but still assigned to this mentor in DB
      if (!shouldBeAssigned && currentlyAssigned) {
        await assign(student._id, "");
      }
    }
  };


  return (
    <div className="rounded-2xl border border-[#4a3b32] bg-[#1e1713] p-5">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="font-bold">
            {mentor.fullName}
          </h2>

          <p className="text-xs text-[#a39081]">
            {mentor.email}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setManaged((value) => !value)}
          className="rounded-xl bg-[#c89b7b] px-4 py-2 text-xs font-bold text-[#1e1713]"
        >
          {managed ? "Close" : "Manage"}
        </button>
      </div>
            {managed && (
        <div className="mt-4 space-y-4">
          {/* Multi-select student assignment grid */}
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {students.map((student) => (
              <label
                key={student._id}
                className="flex items-center gap-3 rounded-xl border border-[#4a3b32] p-3 text-xs cursor-pointer hover:bg-[#16110e]"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student._id)}
                  onChange={() => toggle(student._id)}
                  className="rounded border-[#4a3b32] text-[#c89b7b] focus:ring-[#c89b7b]"
                />
                <span>
                  <b>{student.fullName}</b>
                  <br />
                  <span className="text-[#a39081]">
                    {student.email} · Current: {student.mentor?.fullName || "Unassigned"}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {/* Action button to commit all checkbox changes */}
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#c89b7b] px-5 py-2.5 text-xs font-bold text-[#1e1713] transition hover:bg-[#b08463]"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

    </div>
  );
}