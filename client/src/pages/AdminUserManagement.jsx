import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import UserFilterBar from "../components/UserFilterBar";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const initialFormState = {
    fullName: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    yearOfStudy: "1st Year",
    gender: "Male",
    assignedMentor: "" // አዲስ የተጨመረ: ተማሪውን ለሜንተር ለመመደብ
  };

  const [formData, setFormData] = useState(initialFormState);

  // ከተመዘገቡት ተማሪዎች መካከል ሜንተር የሆኑትን ብቻ ማጣሪያ (ለአድሚን ምርጫ እንዲመች)
  const mentorsList = users.filter((u) => u.role?.toLowerCase() === "mentor");

  const getUserStatus = (user) => {
    if (!user || !user.status) return "approved";
    const raw = String(user.status).toLowerCase();
    
    if (["active", "approved", "verified", "enabled"].includes(raw)) return "approved";
    if (["pending", "applied", "unverified"].includes(raw)) return "pending";
    if (["rejected", "denied"].includes(raw)) return "rejected";
    if (["suspended", "blocked", "banned", "inactive"].includes(raw)) return "suspended";
    
    return raw;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users");
      const data = res.data;
      let fetchedData = [];
      
      if (Array.isArray(data)) {
        fetchedData = data;
      } else if (Array.isArray(data?.users)) {
        fetchedData = data.users;
      } else if (Array.isArray(data?.data)) {
        fetchedData = data.data;
      } else if (Array.isArray(data?.data?.users)) {
        fetchedData = data.data.users;
      }

      setUsers(fetchedData);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axiosInstance.put(`/users/${id}`, { status });
      const updatedUser = res.data?.updatedUser || res.data?.user || res.data?.data;

      if (updatedUser && typeof updatedUser === "object") {
        setUsers((prev) => prev.map((u) => ((u._id || u.id) === id ? { ...u, ...updatedUser } : u)));
      } else {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/users/${id}`);
        setUsers((prev) => prev.filter((u) => (u._id || u.id) !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete user.");
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const userId = editingUser._id || editingUser.id;
        const updatePayload = { ...formData };
        if (!updatePayload.password) delete updatePayload.password;

        const res = await axiosInstance.put(`/users/${userId}`, updatePayload);
        const updatedUser = res.data?.updatedUser || res.data?.user || res.data?.data;

        if (updatedUser && typeof updatedUser === "object") {
          setUsers((prev) => prev.map((u) => ((u._id || u.id) === userId ? { ...u, ...updatedUser } : u)));
        } else {
          fetchUsers();
        }
      } else {
        const createPayload = {
          ...formData,
          status: "approved",
          bootcampReason: formData.bootcampReason || "Directly created by admin."
        };

        const res = await axiosInstance.post("/users", createPayload);
        const newUser = res.data?.user || res.data?.data || res.data;

        if (newUser && (newUser._id || newUser.id)) {
          setUsers((prev) => [newUser, ...prev]);
        } else {
          fetchUsers();
        }
      }
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save user.");
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "student",
      department: user.department || "",
      yearOfStudy: user.yearOfStudy || "1st Year",
      gender: user.gender || "Male",
      assignedMentor: user.assignedMentor || ""
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    setFormData(initialFormState);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("ALL");
    setSelectedStatus("ALL");
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => {
    const userName = user.fullName || user.name || "";
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRole === "ALL" ||
      user.role?.toLowerCase() === selectedRole.toLowerCase();

    const userStatus = getUserStatus(user);
    const matchesStatus =
      selectedStatus === "ALL" ||
      userStatus === selectedStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingOrRejectedUsers = filteredUsers.filter((u) => {
    const status = getUserStatus(u);
    return status === "pending" || status === "rejected";
  });

  const activeOrSuspendedUsers = filteredUsers.filter((u) => {
    const status = getUserStatus(u);
    return status !== "pending" && status !== "rejected";
  });

  return (
    <div className="p-6 min-h-screen bg-[#140e0a] text-stone-100 space-y-8">
      <div className="flex justify-between items-center border-b border-[#2d221b] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">User Management</h1>
          <p className="text-sm text-stone-400 mt-1">Split board overview for active/suspended vs pending/rejected accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95"
        >
          + Create New User
        </button>
      </div>

      <UserFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onReset={handleResetFilters}
      />

      {loading && <p className="text-sm text-amber-500 animate-pulse font-medium">Loading users data...</p>}

      <div className="space-y-3">
        <h2 className="text-base font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Active & Suspended Accounts
        </h2>
        <div className="bg-[#1c1410] border border-[#2d221b] rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm text-stone-200">
            <thead className="bg-[#241a14] text-stone-300 uppercase font-semibold border-b border-[#2d221b] text-xs tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Mentor</th>
                <th className="p-4">State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d221b]">
              {activeOrSuspendedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-stone-400 text-sm">No active or suspended users found.</td>
                </tr>
              ) : (
                activeOrSuspendedUsers.map((user) => {
                  const userId = user._id || user.id;
                  return (
                    <tr key={userId} className="hover:bg-[#241a14]/60 transition-colors">
                      <td className="p-4 font-bold text-white text-base">{user.fullName || user.name || "N/A"}</td>
                      <td className="p-4 text-stone-300 text-sm">{user.email}</td>
                      <td className="p-4">
                        <span className="bg-[#241a14] text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-stone-300 text-xs font-medium">
                        {user.role?.toLowerCase() === "student" ? (user.assignedMentor || "Not Assigned") : "-"}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                          getUserStatus(user) === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {getUserStatus(user)}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <select
                          value={getUserStatus(user)}
                          onChange={(e) => handleStatusUpdate(userId, e.target.value)}
                          className="bg-[#0f0a07] border border-[#3d2f26] text-stone-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-600 outline-none"
                        >
                          <option value="approved">Active / Approved</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-[#241a14] hover:bg-[#32251d] text-stone-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#3d2f26] transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(userId)}
                          className="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pending & Rejected Requests
        </h2>
        <div className="bg-[#2a1f18] border border-[#4a3930] rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm text-stone-200">
            <thead className="bg-[#241a14] text-stone-300 uppercase font-semibold border-b border-[#2d221b] text-xs tracking-wider">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Approval State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d221b]">
              {pendingOrRejectedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-stone-400 text-sm">No pending or rejected requests found.</td>
                </tr>
              ) : (
                pendingOrRejectedUsers.map((user) => {
                  const userId = user._id || user.id;
                  return (
                    <tr key={userId} className="hover:bg-[#241a14]/60 transition-colors">
                      <td className="p-4 font-bold text-white text-base">{user.fullName || user.name || "N/A"}</td>
                      <td className="p-4 text-stone-300 text-sm">{user.email}</td>
                      <td className="p-4">
                        <span className="bg-[#241a14] text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                          getUserStatus(user) === 'rejected' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {getUserStatus(user)}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <select
                          value={getUserStatus(user)}
                          onChange={(e) => handleStatusUpdate(userId, e.target.value)}
                          className="bg-[#0f0a07] border border-[#3d2f26] text-stone-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-600 outline-none"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approve / Accept</option>
                          <option value="rejected">Reject</option>
                        </select>
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-[#241a14] hover:bg-[#32251d] text-stone-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#3d2f26] transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(userId)}
                          className="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0f0a07]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1410] border border-[#2d221b] rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-stone-100">
            <div className="flex justify-between items-center border-b border-[#2d221b] pb-3">
              <h2 className="text-xl font-bold text-white">{editingUser ? "Update User Information" : "Create New User"}</h2>
              <button onClick={closeModal} className="text-stone-400 hover:text-white font-bold transition">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs text-stone-300 font-medium uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#2d221b] bg-[#0f0a07] px-3 py-2 text-sm text-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 font-medium uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#2d221b] bg-[#0f0a07] px-3 py-2 text-sm text-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-stone-300 font-medium uppercase tracking-wider">
                  {editingUser ? "New Password (Leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#2d221b] bg-[#0f0a07] px-3 py-2 text-sm text-white focus:border-amber-600 focus:outline-none"
                  placeholder={editingUser ? "••••••••" : "At least 6 characters"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-300 font-medium uppercase tracking-wider">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-[#2d221b] bg-[#0f0a07] px-3 py-2 text-sm text-white focus:border-amber-600 focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-stone-300 font-medium uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-[#2d221b] bg-[#0f0a07] px-3 py-2 text-sm text-white focus:border-amber-600 focus:outline-none"
                    placeholder="e.g. Software Engineering"
                  />
                </div>
              </div>

              {/* ተማሪ በሚሆንበት ጊዜ የሚታይ የሜንተር መምረጫ */}
              {formData.role.toLowerCase() === "student" && (
                <div>
                  <label className="text-xs text-stone-300 font-medium uppercase tracking-wider">Assign Mentor</label>
                  <select
                    value={formData.assignedMentor}
                    onChange={(e) => setFormData({ ...formData, assignedMentor: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-[#2d221b] bg-[#0f0a07] px-3 py-2 text-sm text-white focus:border-amber-600 focus:outline-none"
                  >
                    <option value="">-- Select Mentor --</option>
                    {mentorsList.map((mentor) => (
                      <option key={mentor._id || mentor.id} value={mentor.fullName || mentor.name}>
                        {mentor.fullName || mentor.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2d221b]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-[#2d221b] text-xs font-semibold text-stone-300 hover:bg-[#241a14] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-stone-950 text-xs font-bold hover:bg-amber-500 transition"
                >
                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}