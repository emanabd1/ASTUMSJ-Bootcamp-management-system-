import { createContext, useEffect, useState } from "react";

const STORAGE_KEY = "astumsj-preferences";
const defaults = { fontSize: "medium", fontFamily: "serif", theme: "dark", language: "en" };

const translations = {
  en: { about: "About", tracks: "Tracks", mentors: "Mentors", faq: "FAQ", alumni: "Alumni", login: "Login", join: "Join Now", notifications: "Notifications", settings: "Settings", accountSettings: "Account Settings", logout: "Logout", language: "Language" },
  am: { about: "ስለ እኛ", tracks: "የትምህርት መስኮች", mentors: "አማካሪዎች", faq: "ተደጋጋሚ ጥያቄዎች", alumni: "ተመራቂዎች", login: "ግባ", join: "አሁን ይመዝገቡ", notifications: "ማሳወቂያዎች", settings: "ቅንብሮች", accountSettings: "የመለያ ቅንብሮች", logout: "ውጣ", language: "ቋንቋ" },
  om: { about: "Waa'ee Keenya", tracks: "Kutaalee", mentors: "Gorsitoota", faq: "Gaaffiiwwan", alumni: "Eebbifamtoota", login: "Seeni", join: "Amma Galmaa'i", notifications: "Beeksisa", settings: "Qindaa'ina", accountSettings: "Qindaa'ina Herregaa", logout: "Ba'i", language: "Afaan" },
  so: { about: "Nagu Saabsan", tracks: "Qaybaha", mentors: "La-taliyeyaasha", faq: "Su'aalaha", alumni: "Qalin-jabiyeyaasha", login: "Gal", join: "Hadda Isdiiwaangeli", notifications: "Ogeysiisyada", settings: "Dejinta", accountSettings: "Dejinta Koontada", logout: "Ka bax", language: "Luqad" },
  ar: { about: "من نحن", tracks: "المسارات", mentors: "المرشدون", faq: "الأسئلة الشائعة", alumni: "الخريجون", login: "تسجيل الدخول", join: "انضم الآن", notifications: "الإشعارات", settings: "الإعدادات", accountSettings: "إعدادات الحساب", logout: "تسجيل الخروج", language: "اللغة" },
};

const uiTranslations = {
  am: {
    "about the bootcamp": "ስለ ቡትካምፕ",
    "bootcamp tracks": "የቡትካምፕ የትምህርት መስኮች",
    "meet your mentors": "አማካሪዎችዎን ያግኙ",
    "common questions": "የተለመዱ ጥያቄዎች",
    "contact us": "ያግኙን",
    "start your application": "ማመልከቻዎን ይጀምሩ",
    "reports & analytics": "ሪፖርቶች እና ትንታኔ",
    "learning calendar": "የትምህርት የቀን መቁጠሪያ",
    "achievement badges": "የስኬት ምልክቶች",
    "general settings": "አጠቃላይ ቅንብሮች",
    "account settings": "የመለያ ቅንብሮች",
    "profile": "መገለጫ",
    "password": "የይለፍ ቃል",
    "save changes": "ለውጦችን አስቀምጥ",
    "logout": "ውጣ",
    "loading...": "በመጫን ላይ...",
    "loading settings...": "ቅንብሮችን በመጫን ላይ...",
    "sessions": "ክፍለ ጊዜዎች",
    "assignments": "ስራዎች",
    "attendance": "ክትትል",
    "progress": "እድገት",
    "announcements": "ማስታወቂያዎች",
    "resources": "ምንጮች",
  },
  om: {
    "about the bootcamp": "Waa'ee Bootcamp",
    "bootcamp tracks": "Kutaalee Bootcamp",
    "meet your mentors": "Gorsitoota Keessan Waliin Walbaraa",
    "common questions": "Gaaffiiwwan Barame",
    "contact us": "Nu Qunnamaa",
    "start your application": "Iyyata Keessan Jalqabaa",
    "reports & analytics": "Gabaasa fi Xiinxala",
    "learning calendar": "Kaalaandarii Barnootaa",
    "achievement badges": "Mallattoolee Milkaa'inaa",
    "general settings": "Qindaa'ina Waliigalaa",
    "account settings": "Qindaa'ina Herregaa",
    "profile": "Piroofaayilii",
    "password": "Jecha Darbii",
    "save changes": "Jijjiirama Olkaa'i",
    "logout": "Ba'i",
    "loading...": "Fe'amaa jira...",
    "sessions": "Yeroo Barnootaa",
    "assignments": "Hojiiwwan",
    "attendance": "Argama",
    "progress": "Guddina",
    "announcements": "Beeksisawwan",
    "resources": "Qabeenya",
  },
  so: {
    "about the bootcamp": "Ku Saabsan Bootcamp-ka",
    "bootcamp tracks": "Qaybaha Bootcamp-ka",
    "meet your mentors": "La Kulan La-taliyeyaashaada",
    "common questions": "Su'aalaha Caadiga ah",
    "contact us": "Nala Soo Xiriir",
    "start your application": "Bilow Codsigaaga",
    "reports & analytics": "Warbixinno iyo Falanqayn",
    "learning calendar": "Jadwalka Waxbarashada",
    "achievement badges": "Abaalmarinnada Guusha",
    "general settings": "Dejinta Guud",
    "account settings": "Dejinta Koontada",
    "profile": "Astaanta",
    "password": "Furaha sirta",
    "save changes": "Kaydi Isbeddellada",
    "logout": "Ka bax",
    "loading...": "Waa la soo rarayaa...",
    "sessions": "Kulamada",
    "assignments": "Shaqooyinka",
    "attendance": "Xaadirinta",
    "progress": "Horumarka",
    "announcements": "Ogeysiisyada",
    "resources": "Khayraadka",
  },
  ar: {
    "about the bootcamp": "عن المعسكر التدريبي",
    "bootcamp tracks": "مسارات المعسكر التدريبي",
    "meet your mentors": "تعرّف على مرشديك",
    "common questions": "الأسئلة الشائعة",
    "contact us": "اتصل بنا",
    "start your application": "ابدأ طلبك",
    "reports & analytics": "التقارير والتحليلات",
    "learning calendar": "تقويم التعلم",
    "achievement badges": "شارات الإنجاز",
    "general settings": "الإعدادات العامة",
    "account settings": "إعدادات الحساب",
    "profile": "الملف الشخصي",
    "password": "كلمة المرور",
    "save changes": "حفظ التغييرات",
    "logout": "تسجيل الخروج",
    "loading...": "جار التحميل...",
    "sessions": "الجلسات",
    "assignments": "الواجبات",
    "attendance": "الحضور",
    "progress": "التقدم",
    "announcements": "الإعلانات",
    "resources": "المصادر",
  },
};

const PreferencesContext = createContext(null);

function readPreferences() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return defaults; }
}

const originalText = new WeakMap();
const originalAttributes = new WeakMap();

function localizeDocument(language) {
  const dictionary = uiTranslations[language] || {};
  const translate = (value) => dictionary[value.trim().toLowerCase()] || value;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement || ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) continue;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const source = originalText.get(node);
    node.nodeValue = language === "en" ? source : translate(source);
  }
  document.querySelectorAll("input, textarea, select, button, [title]").forEach((element) => {
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      if (!originalAttributes.has(element)) originalAttributes.set(element, {});
      const attributes = originalAttributes.get(element);
      if (attributes[attribute] === undefined) attributes[attribute] = element.getAttribute(attribute);
      const source = attributes[attribute];
      element.setAttribute(attribute, language === "en" ? source : translate(source));
    });
  });
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
    localizeDocument(preferences.language);
    const observer = new MutationObserver(() => localizeDocument(preferences.language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [preferences]);
  const updatePreferences = (changes) => setPreferences((current) => ({ ...current, ...changes }));
  const t = (key) => translations[preferences.language]?.[key] || translations.en[key] || key;
  return <PreferencesContext.Provider value={{ preferences, updatePreferences, t }}>{children}</PreferencesContext.Provider>;
}

export { PreferencesContext };
