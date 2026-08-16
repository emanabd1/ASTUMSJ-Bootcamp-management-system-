import React from "react";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#4a3b32] bg-[#1e1713] px-6 text-[#f5efe6] shadow-md">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-bold tracking-widest uppercase text-[#c89b7b]">
          ASTUMSJ BOOTCAMP
        </span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-bold text-[#f5efe6]">{user?.fullName || "User"}</p>
          <span className="text-[10px] uppercase tracking-wider rounded-full bg-[#c89b7b]/20 px-2 py-0.5 text-[#c89b7b] font-semibold">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="rounded-xl border border-[#4a3b32] bg-transparent px-4 py-2 text-xs font-semibold text-[#a39081] transition hover:bg-[#c89b7b] hover:text-[#1e1713]"
        >
          Logout
        </button>
      </div>
    </header>
  );
}