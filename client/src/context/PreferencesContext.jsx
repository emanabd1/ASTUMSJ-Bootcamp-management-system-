import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "astumsj-preferences";
const defaults = { fontSize: "medium", fontFamily: "serif", theme: "dark", language: "en" };

const translations = {
  en: { about: "About", tracks: "Tracks", mentors: "Mentors", faq: "FAQ", alumni: "Alumni", login: "Login", join: "Join Now", notifications: "Notifications", settings: "Settings", accountSettings: "Account Settings", logout: "Logout", language: "Language" },
  am: { about: "ስለ እኛ", tracks: "የትምህርት መስኮች", mentors: "አማካሪዎች", faq: "ተደጋጋሚ ጥያቄዎች", alumni: "ተመራቂዎች", login: "ግባ", join: "አሁን ይመዝገቡ", notifications: "ማሳወቂያዎች", settings: "ቅንብሮች", accountSettings: "የመለያ ቅንብሮች", logout: "ውጣ", language: "ቋንቋ" },
  om: { about: "Waa'ee Keenya", tracks: "Kutaalee", mentors: "Gorsitoota", faq: "Gaaffiiwwan", alumni: "Eebbifamtoota", login: "Seeni", join: "Amma Galmaa'i", notifications: "Beeksisa", settings: "Qindaa'ina", accountSettings: "Qindaa'ina Herregaa", logout: "Ba'i", language: "Afaan" },
  so: { about: "Nagu Saabsan", tracks: "Qaybaha", mentors: "La-taliyeyaasha", faq: "Su'aalaha", alumni: "Qalin-jabiyeyaasha", login: "Gal", join: "Hadda Isdiiwaangeli", notifications: "Ogeysiisyada", settings: "Dejinta", accountSettings: "Dejinta Koontada", logout: "Ka bax", language: "Luqad" },
  ar: { about: "من نحن", tracks: "المسارات", mentors: "المرشدون", faq: "الأسئلة الشائعة", alumni: "الخريجون", login: "تسجيل الدخول", join: "انضم الآن", notifications: "الإشعارات", settings: "الإعدادات", accountSettings: "إعدادات الحساب", logout: "تسجيل الخروج", language: "اللغة" },
};

const PreferencesContext = createContext(null);

function readPreferences() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return defaults; }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    const root = document.documentElement;
    root.style.fontSize = { small: "14px", medium: "16px", large: "18px" }[preferences.fontSize];
    root.style.setProperty("--app-font", { serif: "Georgia, 'Times New Roman', serif", sans: "Verdana, Geneva, sans-serif", mono: "'Courier New', monospace" }[preferences.fontFamily]);
    document.body.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.language;
    document.documentElement.dir = preferences.language === "ar" ? "rtl" : "ltr";
  }, [preferences]);
  const updatePreferences = (changes) => setPreferences((current) => ({ ...current, ...changes }));
  const t = (key) => translations[preferences.language]?.[key] || translations.en[key] || key;
  return <PreferencesContext.Provider value={{ preferences, updatePreferences, t }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
