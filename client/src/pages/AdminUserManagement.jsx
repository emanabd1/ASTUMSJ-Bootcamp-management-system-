import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states for Create / Update
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    yearOfStudy: "1st Year",
    gender: "Male"
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axiosInstance.patch(`/users/${id}`, { status });
      fetchUsers();
    } catch (err) {
      try {
        await axiosInstance.put(`/users/${id}`, { status });
        fetchUsers();
      } catch (innerErr) {
        alert(innerErr.response?.data?.message || "Failed to update user status.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user: filter out empty password so it doesn't trigger validation errors
        const updatePayload = { ...formData };
        if (!updatePayload.password) {
          delete updatePayload.password;
        }
        await axiosInstance.put(`/users/${editingUser._id}`, updatePayload);
      } else {
        // Create user: Supply default bootcampReason and set status to 'approved' by default for admin creation
        const createPayload = {
          ...formData,
          status: "approved",
          bootcampReason: formData.bootcampReason || "Created directly by administrator."
        };
        await axiosInstance.post("/auth/register", createPayload);
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save user operation.");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      password: "", // Left blank intentionally so it isn't required on edit
      role: user.role || "student",
      department: user.department || "",
      yearOfStudy: user.yearOfStudy || "1st Year",
      gender: user.gender || "Male"
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      role: "student",
      department: "",
      yearOfStudy: "1st Year",
      gender: "Male"
    });
  };

  // Split users into two distinct segments
  const activeOrSuspendedUsers = users.filter(u => u.status === 'approved' || u.status === 'suspended');
  const pendingOrRejectedUsers = users.filter(u => !u.status || u.status === 'pending' || u.status === 'rejected');

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide">User Management</h1>
          <p className="text-xs text-[#a39081]">Split board overview for active/suspended vs pending/rejected accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#c89b7b] text-[#1e1713] px-4 py-2 rounded-xl text-xs font-bold transition hover:bg-[#b08567]"
        >
          + Create New User
        </button>
      </div>

      {loading && <p className="text-xs text-[#a39081]">Loading user details...</p>}

      {/* ================= SECTION 1: ACTIVE & SUSPENDED USERS ================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#c89b7b] tracking-wide">Active & Suspended Accounts</h2>
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-[#f5efe6]">
            <thead className="bg-[#16110e] text-[#a39081] uppercase border-b border-[#4a3b32]">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {activeOrSuspendedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-[#a39081]">No active or suspended users found.</td>
                </tr>
              ) : (
                activeOrSuspendedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-[#2d231d]/40">
                    <td className="p-4 font-bold">{user.fullName}</td>
                    <td className="p-4 text-[#a39081]">{user.email}</td>
                    <td className="p-4 uppercase font-semibold text-[#c89b7b]">{user.role}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        user.status === 'approved' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-rose-900/40 text-rose-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <select
                        value={user.status || 'approved'}
                        onChange={(e) => handleStatusUpdate(user._id, e.target.value)}
                        className="bg-[#16110e] border border-[#4a3b32] text-[#f5efe6] rounded-lg px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="approved">Active / Approved</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-[#4a3b32] hover:bg-[#5e4b3f] text-[#f5efe6] px-3 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="bg-rose-600/80 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= SECTION 2: PENDING & REJECTED USERS ================= */}
      <div className="space-y-3 pt-4">
        <h2 className="text-lg font-bold text-amber-400 tracking-wide">Pending & Rejected Requests</h2>
        <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-[#f5efe6]">
            <thead className="bg-[#16110e] text-[#a39081] uppercase border-b border-[#4a3b32]">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Approval State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a3b32]">
              {pendingOrRejectedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-[#a39081]">No pending or rejected requests.</td>
                </tr>
              ) : (
                pendingOrRejectedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-[#2d231d]/40">
                    <td className="p-4 font-bold">{user.fullName}</td>
                    <td className="p-4 text-[#a39081]">{user.email}</td>
                    <td className="p-4 uppercase font-semibold text-[#c89b7b]">{user.role}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        user.status === 'rejected' ? 'bg-rose-900/40 text-rose-300' : 'bg-amber-900/40 text-amber-300'
                      }`}>
                        {user.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <select
                        value={user.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(user._id, e.target.value)}
                        className="bg-[#16110e] border border-[#4a3b32] text-[#f5efe6] rounded-lg px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approve / Accept</option>
                        <option value="rejected">Reject</option>
                      </select>
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-[#4a3b32] hover:bg-[#5e4b3f] text-[#f5efe6] px-3 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="bg-rose-600/80 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CREATE / UPDATE USER MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1713] border border-[#4a3b32] rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl text-[#f5efe6]">
            <div className="flex justify-between items-center border-b border-[#4a3b32] pb-3">
              <h2 className="text-xl font-bold">{editingUser ? "Update User Information" : "Create New User"}</h2>
              <button onClick={closeModal} className="text-[#a39081] hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs text-[#a39081]">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#a39081]">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#a39081]">
                  {editingUser ? "New Password (leave blank to keep unchanged)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                  placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a39081]">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-[#4a3b32] bg-[#16110e] px-3 py-2 text-sm text-[#f5efe6] focus:border-[#c89b7b] focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#a39081]">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-[#4a3b32] bg-transparent px-3 py-2 text-sm focus:border-[#c89b7b] focus:outline-none"
                    placeholder="e.g. Software Engineering"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-[#4a3b32] text-xs text-[#a39081] hover:bg-[#2d231d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#c89b7b] text-[#1e1713] text-xs font-semibold hover:bg-[#b08567]"
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