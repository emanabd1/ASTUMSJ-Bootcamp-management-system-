import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { navigationConfig } from "./navigationConfig";

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "student";
  const links = navigationConfig[role] || [];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#4a3b32] bg-[#1e1713] p-6 text-[#f5efe6]">
      <div className="mb-6 flex items-center space-x-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#c89b7b] bg-white">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <h2 className="text-sm font-extrabold tracking-tight">Portal Menu</h2>
          <p className="text-[10px] uppercase text-[#a39081]">
            {role} Control Panel
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path.endsWith("/dashboard")}
            className={({ isActive }) =>
              `flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#c89b7b] text-[#1e1713] shadow-lg"
                  : "text-[#a39081] hover:bg-[#2d231d] hover:text-[#f5efe6]"
              }`
            }
          >
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}