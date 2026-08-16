import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
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
      alert("Failed to update user status");
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wide">User Management</h1>
          <p className="text-xs text-[#a39081]">Approve, suspend, update roles, and manage system accounts</p>
        </div>
      </div>

      <div className="bg-[#1e1713] border border-[#4a3b32] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-[#f5efe6]">
          <thead className="bg-[#16110e] text-[#a39081] uppercase border-b border-[#4a3b32]">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status Approval / State</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4a3b32]">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-[#2d231d]/40">
                <td className="p-4 font-bold">{user.fullName}</td>
                <td className="p-4 text-[#a39081]">{user.email}</td>
                <td className="p-4 uppercase font-semibold text-[#c89b7b]">{user.role}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                    user.status === 'approved' ? 'bg-emerald-900/40 text-emerald-300' :
                    user.status === 'suspended' ? 'bg-rose-900/40 text-rose-300' :
                    'bg-amber-900/40 text-amber-300'
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
                    <option value="approved">Active / Approved</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="bg-rose-600/80 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}