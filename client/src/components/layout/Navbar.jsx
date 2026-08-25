import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "../../api/axiosInstance";
import { usePreferences } from "../../hooks/usePreferences";

function BellIcon() {
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
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

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

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-6 w-6"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export default function Navbar({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const { preferences, updatePreferences, t } = usePreferences();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const load = () =>
      axiosInstance
        .get("/notifications")
        .then((r) => setUnread(r.data.unread || 0))
        .catch(() => {});

    load();
    const t = setInterval(load, 30000);

    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-[#4a3b32] bg-[#1e1713] px-6 text-[#f5efe6] shadow-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#c89b7b] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
          title="Toggle Sidebar"
        >
          <MenuIcon />
        </button>

        <Link
          to={`/${user?.role || "student"}/dashboard`}
          className="text-xs font-bold tracking-widest uppercase text-[#c89b7b]"
        >
          ASTUMSJ
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <label className="sr-only" htmlFor="dashboard-language">{t("language")}</label>
        <select id="dashboard-language" value={preferences.language} onChange={(event) => updatePreferences({ language: event.target.value })} className="max-w-24 rounded-lg border border-[#4a3b32] bg-[#16110e] px-2 py-2 text-[11px] text-[#c89b7b] outline-none focus:border-[#c89b7b]">
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
          <option value="om">Oromiffa</option>
          <option value="so">Af-Soomaali</option>
          <option value="ar">العربية</option>
        </select>
        <Link
          to="/notifications"
          title={t("notifications")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <Link
          to="/settings"
          title={t("settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
        >
          <GearIcon />
        </Link>

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c89b7b] text-sm font-bold text-[#1e1713] transition hover:brightness-110"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-[#4a3b32] bg-[#1e1713] shadow-xl">
              <div className="border-b border-[#4a3b32] px-4 py-3">
                <p className="truncate text-sm font-bold text-[#f5efe6]">
                  {user?.fullName || "User"}
                </p>

                <span className="mt-1 inline-block rounded-full bg-[#c89b7b]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#c89b7b]">
                  {user?.role}
                </span>
              </div>

              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-xs font-semibold text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
              >
                {t("accountSettings")}
              </Link>

              <Link
                to="/settings/general"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-xs font-semibold text-[#a39081] transition hover:bg-[#2d231d] hover:text-[#f5efe6]"
              >
                General Settings
              </Link>

              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-400 transition hover:bg-[#2d231d] hover:text-rose-300"
              >
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}