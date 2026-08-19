import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.2.75.2 1.15V10.4c.4.14.75.4 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get first letter of user's name
  const initial = (user?.fullName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#4a3b32] bg-[#1e1713] px-6 text-[#f5efe6] shadow-md">
      
      {/* ASTUMSJ Logo */}
      <Link
        to={`/${user?.role || "student"}/dashboard`}
        className="text-sm font-bold uppercase tracking-widest text-[#c89b7b] transition hover:text-[#f5efe6]"
      >
        ASTUMSJ
      </Link>

      {/* Right Side */}
      <div className="flex items-center gap-3">

        {/* General Settings */}
        <Link
          to="/settings"
          title="General Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
        >
          <GearIcon />
        </Link>

        {/* User Avatar and Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c89b7b] text-sm font-bold text-[#1e1713] transition hover:brightness-110"
            title="Account"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-[#4a3b32] bg-[#1e1713] shadow-xl">

              {/* User Information */}
              <div className="border-b border-[#4a3b32] px-4 py-3">
                <p className="truncate text-sm font-bold text-[#f5efe6]">
                  {user?.fullName || "User"}
                </p>

                <span className="mt-1 inline-block rounded-full bg-[#c89b7b]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#c89b7b]">
                  {user?.role || "Student"}
                </span>
              </div>

              {/* My Profile */}
              <Link
                to="/student/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-xs font-semibold text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
              >
                My Profile
              </Link>

              {/* Account Settings */}
              <Link
                to="/student/account-settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-xs font-semibold text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
              >
                Account Settings
              </Link>

              {/* Divider */}
              <div className="border-t border-[#4a3b32]" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-3 text-left text-xs font-semibold text-rose-400 transition hover:bg-[#2d231d] hover:text-rose-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}