import { usePreferences } from "../hooks/usePreferences";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }) {
  const { preferences, updatePreferences } = usePreferences();
  const isDark = preferences.theme === "dark";

  return (
    <button
      type="button"
      onClick={() => updatePreferences({ theme: isDark ? "light" : "dark" })}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`theme-toggle flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80 ${className}`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
