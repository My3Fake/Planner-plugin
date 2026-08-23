var { useState, useMemo, useEffect, useRef, useId } = React;
var Jalali = typeof window !== "undefined" && window.Jalali || null;
var QUADRANTS = [
  { id: "q1", label: "\u0641\u0648\u0631\u06CC \u0648 \u0645\u0647\u0645", sub: "\u0647\u0645\u06CC\u0646 \u0627\u0644\u0627\u0646", color: "#DB2777" },
  { id: "q2", label: "\u0645\u0647\u0645\u060C \u063A\u06CC\u0631\u0641\u0648\u0631\u06CC", sub: "\u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC \u06A9\u0646", color: "#C026D3" },
  { id: "q3", label: "\u0641\u0648\u0631\u06CC\u060C \u063A\u06CC\u0631\u0645\u0647\u0645", sub: "\u0648\u0627\u06AF\u0630\u0627\u0631 \u06CC\u0627 \u0633\u0631\u06CC\u0639 \u0631\u062F \u06A9\u0646", color: "#22D3EE" },
  { id: "q4", label: "\u063A\u06CC\u0631\u0641\u0648\u0631\u06CC \u0648 \u063A\u06CC\u0631\u0645\u0647\u0645", sub: "\u0628\u0639\u062F\u0627\u064B \u06CC\u0627 \u062D\u0630\u0641", color: "#6B7280" }
];
var DAYPARTS = [
  { id: "morning", label: "\u0635\u0628\u062D" },
  { id: "noon", label: "\u0638\u0647\u0631" },
  { id: "evening", label: "\u0639\u0635\u0631" },
  { id: "night", label: "\u0634\u0628" }
];
var PRIORITIES = [
  { level: 1, label: "\u067E\u0627\u06CC\u06CC\u0646" },
  { level: 2, label: "\u0645\u062A\u0648\u0633\u0637" },
  { level: 3, label: "\u0628\u0627\u0644\u0627" },
  { level: 4, label: "\u0628\u062D\u0631\u0627\u0646\u06CC" }
];
var STATUS_ORDER = ["todo", "doing", "done"];
var STATUS_LABEL = { todo: "\u0628\u0631\u0627\u06CC \u0627\u0646\u062C\u0627\u0645", doing: "\u062F\u0631 \u062D\u0627\u0644 \u0627\u0646\u062C\u0627\u0645", done: "\u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647" };
var DURATIONS = [25, 45, 60];
var WEEKDAYS = [
  { id: 6, short: "\u0634", label: "\u0634\u0646\u0628\u0647" },
  { id: 0, short: "\u06CC", label: "\u06CC\u06A9\u0634\u0646\u0628\u0647" },
  { id: 1, short: "\u062F", label: "\u062F\u0648\u0634\u0646\u0628\u0647" },
  { id: 2, short: "\u0633", label: "\u0633\u0647\u200C\u0634\u0646\u0628\u0647" },
  { id: 3, short: "\u0686", label: "\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647" },
  { id: 4, short: "\u067E", label: "\u067E\u0646\u062C\u0634\u0646\u0628\u0647" },
  { id: 5, short: "\u062C", label: "\u062C\u0645\u0639\u0647" }
];
var JALALI_MONTHS_FA = Jalali ? Jalali.MONTH_NAMES_FA : ["\u0641\u0631\u0648\u0631\u062F\u06CC\u0646", "\u0627\u0631\u062F\u06CC\u0628\u0647\u0634\u062A", "\u062E\u0631\u062F\u0627\u062F", "\u062A\u06CC\u0631", "\u0645\u0631\u062F\u0627\u062F", "\u0634\u0647\u0631\u06CC\u0648\u0631", "\u0645\u0647\u0631", "\u0622\u0628\u0627\u0646", "\u0622\u0630\u0631", "\u062F\u06CC", "\u0628\u0647\u0645\u0646", "\u0627\u0633\u0641\u0646\u062F"];
var RECURRENCE_TYPES = [["none", "\u0628\u062F\u0648\u0646 \u062A\u06A9\u0631\u0627\u0631"], ["daily", "\u0631\u0648\u0632\u0627\u0646\u0647"], ["weekly", "\u0647\u0641\u062A\u06AF\u06CC"], ["monthly", "\u0645\u0627\u0647\u0627\u0646\u0647 (\u0634\u0645\u0633\u06CC)"], ["yearly", "\u0633\u0627\u0644\u0627\u0646\u0647 (\u0634\u0645\u0633\u06CC)"], ["even", "\u0631\u0648\u0632\u0647\u0627\u06CC \u0632\u0648\u062C"], ["odd", "\u0631\u0648\u0632\u0647\u0627\u06CC \u0641\u0631\u062F"]];
function isTaskDueOn(task, dateObj) {
  if (!task.recurrence || task.recurrence === "none") return true;
  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly") {
    const days = task.recurrenceWeekdays && task.recurrenceWeekdays.length ? task.recurrenceWeekdays : [dateObj.getDay()];
    return days.includes(dateObj.getDay());
  }
  if (task.recurrence === "monthly") {
    const { jd } = Jalali.toJalaliParts(dateObj);
    return jd === (task.recurrenceDay || 1);
  }
  if (task.recurrence === "yearly") {
    const { jm, jd } = Jalali.toJalaliParts(dateObj);
    return jd === (task.recurrenceDay || 1) && jm === (task.recurrenceMonth || 1);
  }
  if (task.recurrence === "even") return Jalali.toJalaliParts(dateObj).jd % 2 === 0;
  if (task.recurrence === "odd") return Jalali.toJalaliParts(dateObj).jd % 2 === 1;
  return true;
}
function recurrenceLabel(task) {
  if (!task.recurrence || task.recurrence === "none") return null;
  if (task.recurrence === "daily") return "\u0647\u0631 \u0631\u0648\u0632";
  if (task.recurrence === "weekly") {
    const days = task.recurrenceWeekdays || [];
    if (!days.length) return "\u0647\u0641\u062A\u06AF\u06CC";
    return days.slice().sort((a, b) => WEEKDAYS.findIndex((w) => w.id === a) - WEEKDAYS.findIndex((w) => w.id === b)).map((d) => WEEKDAYS.find((w) => w.id === d)?.label).join("\u060C ");
  }
  if (task.recurrence === "monthly") return `\u0645\u0627\u0647\u0627\u0646\u0647 \xB7 \u0631\u0648\u0632 ${task.recurrenceDay || 1}`;
  if (task.recurrence === "yearly") return `\u0633\u0627\u0644\u0627\u0646\u0647 \xB7 ${task.recurrenceDay || 1} ${JALALI_MONTHS_FA[(task.recurrenceMonth || 1) - 1]}`;
  if (task.recurrence === "even") return "\u0631\u0648\u0632\u0647\u0627\u06CC \u0632\u0648\u062C (\u0634\u0645\u0633\u06CC)";
  if (task.recurrence === "odd") return "\u0631\u0648\u0632\u0647\u0627\u06CC \u0641\u0631\u062F (\u0634\u0645\u0633\u06CC)";
  return null;
}
var BOOK_STATUSES = [
  { id: "want", label: "\u0645\u06CC\u200C\u062E\u0648\u0627\u0645 \u0628\u062E\u0648\u0646\u0645", color: "#6B7280" },
  { id: "reading", label: "\u062F\u0631 \u062D\u0627\u0644 \u0645\u0637\u0627\u0644\u0639\u0647", color: "#22D3EE" },
  { id: "finished", label: "\u062E\u0648\u0627\u0646\u062F\u0647\u200C\u0634\u062F\u0647", color: "#C026D3" }
];
var dayColor = (id) => ({ morning: "#67E8F9", noon: "#22D3EE", evening: "#C026D3", night: "#DB2777" })[id];
var dayGlow = (id) => ({ morning: "rgba(103,232,249,.6)", noon: "rgba(34,211,238,.6)", evening: "rgba(192,38,211,.6)", night: "rgba(219,39,119,.6)" })[id];
var uid = () => Date.now() + Math.random();
function parseYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
function formatWhen(v) {
  if (!v) return null;
  const [d, t2] = v.split("T");
  return `${d} ${t2 || ""}`.trim();
}
var storage = {
  get(key) {
    const obsApp = typeof window !== "undefined" && window.__lifeflowObsidianApp;
    if (obsApp) return obsApp.loadLocalStorage(key);
    return window.localStorage.getItem(key);
  },
  set(key, value) {
    const obsApp = typeof window !== "undefined" && window.__lifeflowObsidianApp;
    try {
      if (obsApp) obsApp.saveLocalStorage(key, value);
      else window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }
};
var STORAGE_KEY = "lifeflow_data_v1";
function loadSavedData() {
  try {
    const raw = storage.get(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
var SYNC_CONFIG_KEY = "lifeflow_sync_v1";
function loadSyncConfig() {
  try {
    const raw = storage.get(SYNC_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { url: "", code: "" };
  } catch (e) {
    return { url: "", code: "" };
  }
}
function saveSyncConfig(cfg) {
  try {
    storage.set(SYNC_CONFIG_KEY, JSON.stringify(cfg));
    return true;
  } catch (e) {
    return false;
  }
}
function genSyncCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint32Array(8);
  if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
  let s = "";
  for (let i = 0; i < 8; i++) {
    const n = arr[i] || Math.floor(Math.random() * 4294967296);
    s += chars[n % chars.length];
  }
  return s.slice(0, 4) + "-" + s.slice(4, 8);
}
var SETTINGS_KEY = "lifeflow_settings_v1";
var LANGUAGES = [
  { id: "fa", label: "\u0641\u0627\u0631\u0633\u06CC", dir: "rtl" },
  { id: "en", label: "English", dir: "ltr" },
  { id: "fr", label: "Fran\xE7ais", dir: "ltr" },
  { id: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", dir: "rtl" }
];
var DEFAULT_NOTIFICATIONS = { taskReminders: true, pomodoroEnd: true, learningDeadlines: true, dailyDigest: false };
function loadSettings() {
  try {
    const raw = storage.get(SETTINGS_KEY);
    if (!raw) return { theme: "dark", language: "fa", notifications: DEFAULT_NOTIFICATIONS };
    const parsed = JSON.parse(raw);
    return { theme: "dark", language: "fa", ...parsed, notifications: { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications || {} } };
  } catch (e) {
    return { theme: "dark", language: "fa", notifications: DEFAULT_NOTIFICATIONS };
  }
}
function saveSettings(s) {
  try {
    storage.set(SETTINGS_KEY, JSON.stringify(s));
    return true;
  } catch (e) {
    return false;
  }
}
var I18N = {
  nav_dashboard: { fa: "\u062F\u0627\u0634\u0628\u0648\u0631\u062F", en: "Dashboard", fr: "Tableau de bord", ar: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645" },
  nav_tasks: { fa: "\u062A\u0633\u06A9\u200C\u0647\u0627", en: "Tasks", fr: "T\xE2ches", ar: "\u0627\u0644\u0645\u0647\u0627\u0645" },
  nav_planning: { fa: "\u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC", en: "Planning", fr: "Planification", ar: "\u0627\u0644\u062A\u062E\u0637\u064A\u0637" },
  nav_calendar: { fa: "\u062A\u0642\u0648\u06CC\u0645" },
  nav_study: { fa: "\u0645\u0637\u0627\u0644\u0639\u0647", en: "Study", fr: "\xC9tude", ar: "\u0627\u0644\u062F\u0631\u0627\u0633\u0629" },
  nav_fitness: { fa: "\u0648\u0631\u0632\u0634", en: "Fitness", fr: "Sport", ar: "\u0627\u0644\u0644\u064A\u0627\u0642\u0629" },
  nav_learning: { fa: "\u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC", en: "Learning", fr: "Apprentissage", ar: "\u0627\u0644\u062A\u0639\u0644\u0645" },
  nav_notes: { fa: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627", en: "Notes", fr: "Notes", ar: "\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A" },
  notes_lists: { fa: "\u0644\u06CC\u0633\u062A\u200C\u0647\u0627", en: "Lists", fr: "Listes", ar: "\u0627\u0644\u0642\u0648\u0627\u0626\u0645" },
  notes_journal: { fa: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0631\u0648\u0632\u0627\u0646\u0647", en: "Journal", fr: "Journal", ar: "\u0627\u0644\u064A\u0648\u0645\u064A\u0627\u062A" },
  add_task: { fa: "\u062A\u0633\u06A9 \u062C\u062F\u06CC\u062F", en: "New task", fr: "Nouvelle t\xE2che", ar: "\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629" },
  backup_manager: { fa: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u0628\u06A9\u0627\u067E", en: "Backup manager", fr: "Sauvegardes", ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0646\u0633\u062E" },
  settings: { fa: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A", en: "Settings", fr: "Param\xE8tres", ar: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" },
  save: { fa: "\u0630\u062E\u06CC\u0631\u0647", en: "Save", fr: "Enregistrer", ar: "\u062D\u0641\u0638" },
  cancel: { fa: "\u0627\u0646\u0635\u0631\u0627\u0641", en: "Cancel", fr: "Annuler", ar: "\u0625\u0644\u063A\u0627\u0621" },
  close: { fa: "\u0628\u0633\u062A\u0646", en: "Close", fr: "Fermer", ar: "\u0625\u063A\u0644\u0627\u0642" },
  appearance: { fa: "\u062D\u0627\u0644\u062A \u0638\u0627\u0647\u0631\u06CC", en: "Appearance", fr: "Apparence", ar: "\u0627\u0644\u0645\u0638\u0647\u0631" },
  dark_mode: { fa: "\u062A\u06CC\u0631\u0647", en: "Dark", fr: "Sombre", ar: "\u062F\u0627\u0643\u0646" },
  light_mode: { fa: "\u0631\u0648\u0634\u0646", en: "Light", fr: "Clair", ar: "\u0641\u0627\u062A\u062D" },
  language: { fa: "\u0632\u0628\u0627\u0646", en: "Language", fr: "Langue", ar: "\u0627\u0644\u0644\u063A\u0629" },
  ai_provider_section: { fa: "\u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC", en: "AI assistant", fr: "Assistant IA", ar: "\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" },
  ai_provider_hint: { fa: "\u06A9\u0644\u06CC\u062F API \u062E\u0648\u062F\u062A \u0631\u0648 \u0627\u0632 \u0647\u0631 \u06A9\u062F\u0648\u0645 \u0627\u0632 \u0627\u06CC\u0646 \u0633\u0631\u0648\u06CC\u0633\u200C\u0647\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646 \u062A\u0627 \u06A9\u0627\u0631\u062A \u062E\u0644\u0627\u0635\u0647\u200C\u06CC \u0647\u0641\u062A\u06AF\u06CC \u06A9\u0627\u0631 \u06A9\u0646\u0647. \u06A9\u0644\u06CC\u062F \u0641\u0642\u0637 \u0631\u0648 \u0647\u0645\u06CC\u0646 \u0645\u0631\u0648\u0631\u06AF\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u0634\u0647.", en: "Enter your own API key from any of these providers so the weekly AI summary card works. The key is stored only in this browser.", fr: "Entrez votre propre cl\xE9 API de l'un de ces fournisseurs pour activer le r\xE9sum\xE9 IA hebdomadaire. La cl\xE9 est stock\xE9e uniquement dans ce navigateur.", ar: "\u0623\u062F\u062E\u0644 \u0645\u0641\u062A\u0627\u062D API \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0645\u0646 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u0645\u0632\u0648\u062F\u064A\u0646 \u0644\u062A\u0641\u0639\u064A\u0644 \u0645\u0644\u062E\u0635 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A. \u064A\u064F\u062E\u0632\u064E\u0651\u0646 \u0627\u0644\u0645\u0641\u062A\u0627\u062D \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0641\u0642\u0637." },
  ai_provider: { fa: "\u0627\u0631\u0627\u0626\u0647\u200C\u062F\u0647\u0646\u062F\u0647", en: "Provider", fr: "Fournisseur", ar: "\u0627\u0644\u0645\u0632\u0648\u062F" },
  api_key: { fa: "\u06A9\u0644\u06CC\u062F API", en: "API key", fr: "Cl\xE9 API", ar: "\u0645\u0641\u062A\u0627\u062D API" },
  streak_days: { fa: "\u0631\u0648\u0632 \u0627\u0633\u062A\u0631\u06CC\u06A9", en: "day streak", fr: "jours de suite", ar: "\u0623\u064A\u0627\u0645 \u0645\u062A\u062A\u0627\u0644\u064A\u0629" },
  today_progress: { fa: "\u067E\u06CC\u0634\u0631\u0641\u062A \u0627\u0645\u0631\u0648\u0632", en: "Today's progress", fr: "Progr\xE8s du jour", ar: "\u062A\u0642\u062F\u0645 \u0627\u0644\u064A\u0648\u0645" },
  todays_plan: { fa: "\u0628\u0631\u0646\u0627\u0645\u0647 \u0627\u0645\u0631\u0648\u0632", en: "Today's plan", fr: "Plan du jour", ar: "\u062E\u0637\u0629 \u0627\u0644\u064A\u0648\u0645" },
  see_all: { fa: "\u0647\u0645\u0647", en: "All", fr: "Tout", ar: "\u0627\u0644\u0643\u0644" },
  urgent_important: { fa: "\u0641\u0648\u0631\u06CC \u0648 \u0645\u0647\u0645", en: "Urgent & important", fr: "Urgent et important", ar: "\u0639\u0627\u062C\u0644 \u0648\u0645\u0647\u0645" },
  no_tasks_yet: { fa: "\u0647\u0646\u0648\u0632 \u062A\u0633\u06A9\u06CC \u0646\u062F\u0627\u0631\u06CC", en: "No tasks yet", fr: "Aucune t\xE2che pour l'instant", ar: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0647\u0627\u0645 \u0628\u0639\u062F" },
  no_tasks_today: { fa: "\u0627\u0645\u0631\u0648\u0632 \u062A\u0633\u06A9 \u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC\u200C\u0634\u062F\u0647\u200C\u0627\u06CC \u0646\u062F\u0627\u0631\u06CC \u{1F389}", en: "Nothing scheduled for today \u{1F389}", fr: "Rien de pr\xE9vu aujourd'hui \u{1F389}", ar: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0647\u0627\u0645 \u0644\u0647\u0630\u0627 \u0627\u0644\u064A\u0648\u0645 \u{1F389}" },
  ai_summary_title: { fa: "\u062E\u0644\u0627\u0635\u0647 \u0647\u0641\u062A\u0647 \u0628\u0627 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC", en: "AI weekly summary", fr: "R\xE9sum\xE9 IA hebdomadaire", ar: "\u0645\u0644\u062E\u0635 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" },
  get_summary: { fa: "\u062F\u0631\u06CC\u0627\u0641\u062A", en: "Get summary", fr: "Obtenir", ar: "\u0627\u062D\u0635\u0644 \u0639\u0644\u064A\u0647" },
  retry: { fa: "\u062F\u0648\u0628\u0627\u0631\u0647", en: "Retry", fr: "R\xE9essayer", ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629" },
  ai_no_key: { fa: "\u0628\u0631\u0627\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A \u062E\u0644\u0627\u0635\u0647\u060C \u0627\u0648\u0644 \u0627\u0632 \u0628\u062E\u0634 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u06CC\u0647 \u06A9\u0644\u06CC\u062F API \u0648\u0627\u0631\u062F \u06A9\u0646.", en: "To get a summary, first add an API key in Settings.", fr: "Pour obtenir un r\xE9sum\xE9, ajoutez d'abord une cl\xE9 API dans les Param\xE8tres.", ar: "\u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0644\u062E\u0635\u060C \u0623\u0636\u0641 \u0623\u0648\u0644\u0627\u064B \u0645\u0641\u062A\u0627\u062D API \u0641\u064A \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A." },
  open_settings: { fa: "\u0628\u0631\u0648 \u0628\u0647 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A", en: "Open settings", fr: "Ouvrir les param\xE8tres", ar: "\u0641\u062A\u062D \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" },
  cloud_sync: { fa: "\u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0627\u0628\u0631\u06CC", en: "Cloud sync", fr: "Synchronisation cloud", ar: "\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629" },
  nav_pomodoro: { fa: "\u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648" },
  pomodoro_timer: { fa: "\u062A\u0627\u06CC\u0645\u0631" },
  pomodoro_report: { fa: "\u06AF\u0632\u0627\u0631\u0634" },
  pomodoro_work: { fa: "\u06A9\u0627\u0631" },
  pomodoro_short_break: { fa: "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0648\u062A\u0627\u0647" },
  pomodoro_long_break: { fa: "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u0628\u0644\u0646\u062F" },
  pomodoro_assign_task: { fa: "\u0627\u062E\u062A\u0635\u0627\u0635 \u0628\u0647 \u062A\u0633\u06A9 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)" },
  pomodoro_no_task: { fa: "\u0628\u062F\u0648\u0646 \u062A\u0633\u06A9" },
  pomodoro_start: { fa: "\u0634\u0631\u0648\u0639" },
  pomodoro_pause: { fa: "\u062A\u0648\u0642\u0641" },
  pomodoro_reset: { fa: "\u0631\u06CC\u0633\u062A" },
  pomodoro_skip: { fa: "\u0631\u062F \u0634\u062F\u0646" },
  pomodoro_settings: { fa: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648" },
  progress_task: { fa: "\u062A\u0633\u06A9 \u0631\u0648\u0646\u062F\u200C\u062F\u0627\u0631" }
};
function t(key, lang) {
  const entry = I18N[key];
  if (!entry) return key;
  return entry[lang] || entry.fa || key;
}
var AI_CONFIG_KEY = "lifeflow_ai_v1";
var AI_PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI (GPT)" },
  { id: "xai", label: "xAI (Grok)" },
  { id: "kimi", label: "Kimi (Moonshot AI)" }
];
function loadAiConfig() {
  try {
    const raw = storage.get(AI_CONFIG_KEY);
    return raw ? { provider: "anthropic", apiKey: "", ...JSON.parse(raw) } : { provider: "anthropic", apiKey: "" };
  } catch (e) {
    return { provider: "anthropic", apiKey: "" };
  }
}
function saveAiConfig(cfg) {
  try {
    storage.set(AI_CONFIG_KEY, JSON.stringify(cfg));
    return true;
  } catch (e) {
    return false;
  }
}
async function callAiProvider(provider, apiKey, prompt) {
  if (provider === "anthropic") {
    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, messages: [{ role: "user", content: prompt }] })
    });
    if (!res2.ok) {
      const e = await res2.json().catch(() => ({}));
      throw new Error(e?.error?.message || `HTTP ${res2.status}`);
    }
    const data2 = await res2.json();
    return (data2.content || []).map((c) => c.text || "").join("\n").trim();
  }
  const ENDPOINTS = {
    openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
    xai: { url: "https://api.x.ai/v1/chat/completions", model: "grok-2-latest" },
    kimi: { url: "https://api.moonshot.ai/v1/chat/completions", model: "moonshot-v1-8k" }
  };
  const cfg = ENDPOINTS[provider];
  if (!cfg) throw new Error("invalid provider");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: cfg.model, max_tokens: 300, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}
function computeStats({ tasks, books, videos, podcasts, exercises, projects }) {
  const tasksDone = tasks.filter((t2) => t2.status === "done").length;
  const booksFinished = books.filter((b) => b.status === "finished").length;
  const videosWatched = videos.filter((v) => v.watched).length;
  const podcastsListened = podcasts.filter((p) => p.listened).length;
  const exercisesDone = exercises.filter((e) => e.done).length;
  const practiceDone = projects.reduce((s, p) => s + p.subsections.filter((sec) => sec.linkedTaskId && tasks.find((t2) => t2.id === sec.linkedTaskId)?.status === "done").length, 0);
  const milestonesDone = 0;
  const scheduledTasks = tasks.filter((t2) => t2.time).length;
  const xp = tasksDone * 10 + booksFinished * 50 + videosWatched * 15 + podcastsListened * 10 + exercisesDone * 15 + practiceDone * 15 + milestonesDone * 20;
  const levelSize = 150;
  const level = Math.floor(xp / levelSize) + 1;
  const xpIntoLevel = xp % levelSize;
  return { tasksDone, booksFinished, videosWatched, podcastsListened, exercisesDone, practiceDone, milestonesDone, scheduledTasks, xp, level, xpIntoLevel, levelSize };
}
var BADGES = [
  { id: "first-task", label: "\u0634\u0631\u0648\u0639 \u0642\u062F\u0631\u062A\u0645\u0646\u062F", icon: "check", test: (s) => s.tasksDone >= 1 },
  { id: "reader", label: "\u06A9\u062A\u0627\u0628\u200C\u062E\u0648\u0627\u0646", icon: "book", test: (s) => s.booksFinished >= 1 },
  { id: "streak7", label: "\u0627\u0633\u062A\u0631\u06CC\u06A9 \u0647\u0641\u062A\u06AF\u06CC", icon: "flame", test: (s) => s.streak >= 7 },
  { id: "athlete", label: "\u0648\u0631\u0632\u0634\u06A9\u0627\u0631", icon: "dumbbell", test: (s) => s.exercisesDone >= 5 },
  { id: "builder", label: "\u067E\u0631\u0648\u0698\u0647\u200C\u0633\u0627\u0632", icon: "graduation-cap", test: (s) => s.milestonesDone >= 1 },
  { id: "organizer", label: "\u0633\u0627\u0632\u0645\u0627\u0646\u200C\u062F\u0647", icon: "clock", test: (s) => s.scheduledTasks >= 3 }
];
function GamificationCard({ stats, streak }) {
  const s = { ...stats, streak };
  const pct = Math.round(stats.xpIntoLevel / stats.levelSize * 100);
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)" } }, stats.level), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-white" }, "\u0633\u0637\u062D ", stats.level), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400" }, stats.xp, " \u0627\u0645\u062A\u06CC\u0627\u0632 \u06A9\u0644"))), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, stats.xpIntoLevel, "/", stats.levelSize, " \u062A\u0627 \u0633\u0637\u062D \u0628\u0639\u062F")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full", style: { width: `${pct}%`, background: "linear-gradient(90deg,#C026D3,#22D3EE)" } })), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1" }, BADGES.map((b) => {
    const unlocked = b.test(s);
    const glyph = unlocked ? b.icon : "lock";
    return /* @__PURE__ */ React.createElement("div", { key: b.id, className: "shrink-0 flex flex-col items-center gap-1 w-14" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center", style: { background: unlocked ? "rgba(192,38,211,.18)" : "rgba(255,255,255,.04)" } }, /* @__PURE__ */ React.createElement(Ic, { name: glyph, size: 16 })), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-center leading-tight", style: { color: unlocked ? "#cbd5e1" : "#475569" } }, b.label));
  })));
}
function AiSummaryCard({ stats, streak, lang, onOpenSettings }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [err, setErr] = useState("");
  const [aiCfg] = useState(() => loadAiConfig());
  const getSummary = async () => {
    setLoading(true);
    setSummary("");
    setErr("");
    try {
      const prompt = `\u0627\u06CC\u0646 \u0622\u0645\u0627\u0631 \u0647\u0641\u062A\u0647\u200C\u06CC \u0645\u0646 \u062F\u0631 \u0627\u067E \u0645\u062F\u06CC\u0631\u06CC\u062A \u0632\u0646\u062F\u06AF\u06CC \xAB\u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645\xBB \u0627\u0633\u062A: ${stats.tasksDone} \u062A\u0633\u06A9 \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647\u060C ${stats.booksFinished} \u06A9\u062A\u0627\u0628 \u062A\u0645\u0627\u0645\u200C\u0634\u062F\u0647\u060C ${stats.exercisesDone} \u062A\u0645\u0631\u06CC\u0646 \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647\u060C \u0627\u0633\u062A\u0631\u06CC\u06A9 ${streak} \u0631\u0648\u0632. \u0644\u0637\u0641\u0627\u064B \u06CC\u06A9 \u062E\u0644\u0627\u0635\u0647\u200C\u06CC \u06A9\u0648\u062A\u0627\u0647\u060C \u0635\u0645\u06CC\u0645\u06CC \u0648 \u0627\u0646\u06AF\u06CC\u0632\u0634\u06CC (\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F3 \u062C\u0645\u0644\u0647) \u0628\u0647 \u0641\u0627\u0631\u0633\u06CC \u0628\u0646\u0648\u06CC\u0633 \u0648 \u06CC\u06A9 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u0639\u0645\u0644\u06CC \u0648 \u0645\u0634\u062E\u0635 \u0628\u0631\u0627\u06CC \u0647\u0641\u062A\u0647 \u0628\u0639\u062F \u0628\u062F\u0647. \u0641\u0642\u0637 \u0645\u062A\u0646 \u0641\u0627\u0631\u0633\u06CC\u060C \u0628\u062F\u0648\u0646 \u0645\u0642\u062F\u0645\u0647 \u0627\u0636\u0627\u0641\u0647.`;
      const text = await callAiProvider(aiCfg.provider, aiCfg.apiKey, prompt);
      setSummary(text || "\u0686\u06CC\u0632\u06CC \u0628\u0631\u0646\u06AF\u0634\u062A\u060C \u062F\u0648\u0628\u0627\u0631\u0647 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646.");
    } catch (e) {
      setErr(e.message || "\u062E\u0637\u0627\u06CC \u0646\u0627\u0645\u0634\u062E\u0635");
    }
    setLoading(false);
  };
  const hasKey = !!aiCfg.apiKey;
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-200 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "sparkles", size: 15, className: "text-fuchsia-300" }), " ", t("ai_summary_title", lang)), hasKey && /* @__PURE__ */ React.createElement("button", { onClick: getSummary, disabled: loading, className: "text-[11px] px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 font-medium flex items-center gap-1.5 disabled:opacity-50" }, loading && /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 border-2 border-fuchsia-300/40 border-t-violet-300 rounded-full animate-spin inline-block" }), " ", summary ? t("retry", lang) : t("get_summary", lang))), !hasKey && /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-slate-500" }, /* @__PURE__ */ React.createElement("p", { className: "mb-2" }, t("ai_no_key", lang)), /* @__PURE__ */ React.createElement("button", { onClick: onOpenSettings, className: "text-fuchsia-300 font-medium" }, t("open_settings", lang), " \u2190")), hasKey && err && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400" }, err), hasKey && summary && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300 leading-relaxed whitespace-pre-line" }, summary), hasKey && !summary && !err && !loading && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500" }, "\u0628\u0631\u0627\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A \u062E\u0644\u0627\u0635\u0647 \u0648 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u0627\u06CC\u0646 \u0647\u0641\u062A\u0647\u060C \u062F\u06A9\u0645\u0647 \u0631\u0648 \u0628\u0632\u0646"));
}
function GlobalSearchModal({ onClose, onNavigate, tasks, books, videos, podcasts, exercises, projects }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const match = (s) => s && s.toLowerCase().includes(query);
  const results = query.length < 1 ? [] : [
    ...tasks.filter((t2) => match(t2.title)).map((t2) => ({ id: "t" + t2.id, label: t2.title, sub: "\u062A\u0633\u06A9", tab: "tasks", icon: "clipboard", color: "#C026D3" })),
    ...books.filter((b) => match(b.title) || match(b.author)).map((b) => ({ id: "b" + b.id, label: b.title, sub: "\u06A9\u062A\u0627\u0628 \xB7 " + b.author, tab: "study", icon: "book", color: "#C026D3" })),
    ...videos.filter((v) => match(v.title)).map((v) => ({ id: "v" + v.id, label: v.title, sub: "\u0648\u06CC\u062F\u06CC\u0648", tab: "study", icon: "play", color: "#C026D3" })),
    ...podcasts.filter((p) => match(p.title)).map((p) => ({ id: "p" + p.id, label: p.title, sub: "\u067E\u0627\u062F\u06A9\u0633\u062A", tab: "study", icon: "headphones", color: "#22D3EE" })),
    ...exercises.filter((e) => match(e.name)).map((e) => ({ id: "e" + e.id, label: e.name, sub: "\u062A\u0645\u0631\u06CC\u0646", tab: "fitness", icon: "dumbbell", color: "#DB2777" })),
    ...projects.filter((p) => match(p.title)).map((p) => ({ id: "pr" + p.id, label: p.title, sub: "\u0645\u0648\u0636\u0648\u0639 \u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC", tab: "learning", icon: "graduation-cap", color: "#C026D3" }))
  ];
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "max-w-md mx-auto w-full px-4 pt-8", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "search", size: 16, className: "text-slate-400 shrink-0" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      value: q,
      onChange: (e) => setQ(e.target.value),
      placeholder: "\u062C\u0633\u062A\u062C\u0648\u06CC \u0633\u0631\u0627\u0633\u0631\u06CC \u2014 \u062A\u0633\u06A9\u060C \u06A9\u062A\u0627\u0628\u060C \u0648\u06CC\u062F\u06CC\u0648\u060C \u062A\u0645\u0631\u06CC\u0646...",
      className: "flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
    }
  )), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "text-slate-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "x", size: 22 }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 overflow-y-auto max-h-[70vh]" }, query.length > 0 && results.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-6" }, "\u0646\u062A\u06CC\u062C\u0647\u200C\u0627\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F"), results.map((r) => {
    const glyph = r.icon;
    return /* @__PURE__ */ React.createElement("button", { key: r.id, onClick: () => {
      onNavigate(r.tab);
      onClose();
    }, className: "w-full flex items-center gap-3 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2.5 text-right" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style: { background: `${r.color}22` } }, /* @__PURE__ */ React.createElement(Ic, { name: glyph, size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-100 truncate" }, r.label), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500" }, r.sub)));
  }))));
}
var ICON_PATHS = {
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7",
  "check-square": "M9 12l2 2 4-4 M5 5h14v14H5Z",
  flame: "M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 3 3 3 5a5 5 0 0 1-10 0c0-4 3-6 5-10Z",
  "book-open": "M12 6c-1.5-1.2-4-2-7-2v13c3 0 5.5.8 7 2 1.5-1.2 4-2 7-2V4c-3 0-5.5.8-7 2ZM12 6v13",
  dumbbell: "M6 8v8M4 10v4M20 10v4M18 8v8M8 12h8",
  "graduation-cap": "M2 9l10-4 10 4-10 4-10-4ZM6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4M22 9v6",
  clipboard: "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z M9 12h6M9 16h6",
  home: "M4 11 12 4l8 7M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9",
  clock: "M12 7v5l3.5 2",
  tag: "M4 4h8l8 8-8 8-8-8V4Z",
  "chevron-left": "M15 6l-6 6 6 6",
  "chevron-right": "M9 6l6 6-6 6",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 20a2 2 0 0 0 4 0",
  repeat: "M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  play: "M7 5v14l12-7Z",
  headphones: "M4 13v-1a8 8 0 0 1 16 0v1",
  book: "M6 3h11a2 2 0 0 1 2 2v15l-6-2-6 2V5a2 2 0 0 1 2-2Z",
  "external-link": "M9 15 20 4M14 4h6v6M20 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6",
  sparkles: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  search: "M21 21l-4.3-4.3",
  trash: "M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6",
  calendar: "M16 3v4M8 3v4M3 10h18",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M12 15v2",
  sunrise: "M12 3v4M5 12l1.5 1.5M19 12l-1.5 1.5M2 20h20",
  sun: "M12 3v2M12 19v2M4 12H2M22 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4",
  sunset: "M12 21v-4M5 12l1.5-1.5M19 12l-1.5-1.5M2 20h20",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  "trending-up": "M3 17l6-6 4 4 8-8M15 7h6v6",
  grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  columns: "M3 4h6v16H3zM15 4h6v16h-6z",
  location: "M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z",
  edit: "M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 6.5l3 3",
  cloud: "M7 18a4.2 4.2 0 0 1-.6-8.36A5.5 5.5 0 0 1 16.9 8.2 4.3 4.3 0 0 1 16.3 18H7Z",
  copy: "M8 8V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3",
  upload: "M12 21V9M7 13l5-5 5 5M5 4h14",
  settings: "M10.5 3h3l.5 2.2a7 7 0 0 1 2 1.15l2.15-.75 1.5 2.6-1.7 1.5a7 7 0 0 1 0 2.3l1.7 1.5-1.5 2.6-2.15-.75a7 7 0 0 1-2 1.15L13.5 21h-3l-.5-2.2a7 7 0 0 1-2-1.15l-2.15.75-1.5-2.6 1.7-1.5a7 7 0 0 1 0-2.3l-1.7-1.5 1.5-2.6 2.15.75a7 7 0 0 1 2-1.15Z M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
};
var ICON_EXTRA = {
  clipboard: /* @__PURE__ */ React.createElement("rect", { x: "5", y: "6", width: "14", height: "15", rx: "2" }),
  home: null,
  clock: /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }),
  search: /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "7" }),
  folder: null,
  calendar: /* @__PURE__ */ React.createElement("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }),
  lock: /* @__PURE__ */ React.createElement("rect", { x: "5", y: "10", width: "14", height: "10", rx: "2" }),
  sunrise: /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "16", r: "3.5" }),
  sun: /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "4" }),
  sunset: /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "14", r: "3.5" }),
  location: /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "9", r: "2.3" }),
  copy: /* @__PURE__ */ React.createElement("rect", { x: "3", y: "8", width: "10", height: "10", rx: "2" })
};
function Ic({ name, size = 16, className = "", style = {}, color }) {
  if (!name) return null;
  return /* @__PURE__ */ React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      className,
      style: { display: "inline-block", verticalAlign: "middle", flexShrink: 0, color: color || "currentColor", ...style },
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    ICON_EXTRA[name],
    /* @__PURE__ */ React.createElement("path", { d: ICON_PATHS[name] || "" })
  );
}
function GlassCard({ children, className = "" }) {
  return /* @__PURE__ */ React.createElement("div", { className: `glass-panel rounded-2xl overflow-hidden ${className}` }, /* @__PURE__ */ React.createElement("div", { className: "glass-sheen" }), /* @__PURE__ */ React.createElement("div", { className: "relative z-[1]" }, children));
}
function GalaxyBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let raf, stars = [], w = 0, h = 0, frame = 0;
    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(110, Math.floor(w * h / 8e3));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.25,
        speed: Math.random() * 0.015 + 5e-3,
        phase: Math.random() * Math.PI * 2,
        tint: Math.random() > 0.88 ? "196,181,253" : Math.random() > 0.75 ? "125,211,252" : "255,255,255"
      }));
    }
    resize();
    window.addEventListener("resize", resize);
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t2 = 0;
    function draw() {
      frame++;
      if (!reduceMotion && frame % 2 === 0) {
        t2 += 1;
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
          const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t2 * s.speed + s.phase));
          ctx.beginPath();
          ctx.fillStyle = `rgba(${s.tint},${tw})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (reduceMotion && frame === 1) {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${s.tint},0.6)`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-0 overflow-hidden pointer-events-none", style: { background: "#050308", contain: "strict" } }, /* @__PURE__ */ React.createElement("div", { className: "nebula nebula-1" }), /* @__PURE__ */ React.createElement("div", { className: "nebula nebula-2" }), /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0", style: { background: "radial-gradient(ellipse 90% 60% at 50% 105%, rgba(0,0,0,.75), transparent 60%)" } }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0", style: { background: "radial-gradient(ellipse 70% 40% at 50% -10%, rgba(0,0,0,.55), transparent 60%)" } }));
}
function PageTransition({ pageKey, children }) {
  return /* @__PURE__ */ React.createElement("div", { style: { perspective: 1400 } }, /* @__PURE__ */ React.createElement("div", { key: pageKey, className: "glass-pane-enter" }, children));
}
function LightBackground() {
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-0 overflow-hidden pointer-events-none", style: { background: "linear-gradient(160deg,#F5F3FB 0%,#EFEAFB 45%,#F7EEF5 100%)" } }, /* @__PURE__ */ React.createElement("div", { className: "nebula", style: { width: 480, height: 480, top: -160, left: -120, background: "radial-gradient(circle,#E9A5F1,transparent 70%)", opacity: 0.5, animation: "nebulaDrift 34s ease-in-out infinite alternate" } }), /* @__PURE__ */ React.createElement("div", { className: "nebula", style: { width: 520, height: 520, bottom: -220, right: -180, background: "radial-gradient(circle,#93E4F5,transparent 70%)", opacity: 0.45, animation: "nebulaDrift 40s ease-in-out infinite alternate", animationDelay: "-9s" } }));
}
function StatPill({ icon, label, value, color }) {
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "flex items-center gap-3 px-4 py-3 flex-1 min-w-[130px]" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center shrink-0", style: { background: `${color}22` } }, /* @__PURE__ */ React.createElement(Ic, { name: icon, size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col leading-tight min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold text-base truncate" }, value), /* @__PURE__ */ React.createElement("span", { className: "text-slate-400 text-[11px] truncate" }, label)));
}
function PriorityBars({ level }) {
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-[2px]" }, [1, 2, 3, 4].map((i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "w-[3px] rounded-full", style: { height: 3 + i * 2, background: i <= level ? "#DB2777" : "rgba(255,255,255,0.12)" } })));
}
function Chip({ active, onClick, children, color = "#C026D3" }) {
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick,
      className: "rounded-lg px-2.5 py-1.5 text-[11px] font-medium border transition-all duration-200",
      style: { borderColor: active ? color : "rgba(255,255,255,.1)", background: active ? `${color}26` : "rgba(255,255,255,.03)", color: active ? color : "#94a3b8", boxShadow: active ? `0 0 12px ${color}44, inset 0 1px 0 rgba(255,255,255,.15)` : "none" }
    },
    children
  );
}
function ModalShell({ title, onClose, onSubmit, footer, children }) {
  const content = /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onClose,
      style: { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }
    },
    /* @__PURE__ */ React.createElement(
      "form",
      {
        onClick: (e) => e.stopPropagation(),
        onSubmit: (e) => {
          e.preventDefault();
          if (onSubmit) onSubmit();
        },
        className: "modal-glass-pop",
        style: {
          width: "100%",
          maxWidth: 440,
          maxHeight: "85%",
          display: "flex",
          flexDirection: "column",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(165deg, rgba(30,14,36,.92), rgba(10,7,16,.96))",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 -10px 50px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.14)"
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "glass-sheen" }),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", flexShrink: 0, position: "relative", zIndex: 1 } }, /* @__PURE__ */ React.createElement("h3", { className: "text-white font-bold text-lg", style: { margin: 0 } }, title), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10" }, /* @__PURE__ */ React.createElement(Ic, { name: "x", size: 18 }))),
      /* @__PURE__ */ React.createElement("div", { style: { padding: "0 20px", overflowY: "auto", flex: "1 1 auto", minHeight: 0, position: "relative", zIndex: 1 } }, children),
      footer && /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 20px 20px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.1)", position: "relative", zIndex: 1 } }, footer)
    )
  );
  return ReactDOM.createPortal(content, document.body);
}
function TextInput(props) {
  return /* @__PURE__ */ React.createElement("input", { ...props, className: `w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm mb-3 outline-none focus:border-fuchsia-400/60 ${props.className || ""}` });
}
function SubTabs({ options, value, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { className: "flex bg-white/[0.05] border border-white/10 rounded-xl p-1 overflow-x-auto" }, options.map(([id, label, Icon]) => /* @__PURE__ */ React.createElement("button", { key: id, onClick: () => onChange(id), className: `flex-1 shrink-0 flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-medium whitespace-nowrap ${value === id ? "bg-white/10 text-white" : "text-slate-400"}` }, Icon && /* @__PURE__ */ React.createElement(Ic, { name: Icon, size: 13 }), " ", label)));
}
function DayArc({ tasks, lang }) {
  const size = 220, stroke = 16, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const segAngle = 180 / 4, startAngle = 180;
  const polar = (a, radius) => {
    const rad = a * Math.PI / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };
  const arcPath = (a0, a1, radius) => {
    const [x0, y0] = polar(a0, radius), [x1, y1] = polar(a1, radius);
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const segments = DAYPARTS.map((dp, i) => {
    const dayTasks = tasks.filter((t2) => t2.daypart === dp.id);
    const done = dayTasks.filter((t2) => t2.status === "done").length;
    return { ...dp, ratio: dayTasks.length ? done / dayTasks.length : 0, a0: startAngle + i * segAngle, a1: startAngle + (i + 1) * segAngle };
  });
  const totalDone = tasks.filter((t2) => t2.status === "done").length;
  const pct = tasks.length ? Math.round(totalDone / tasks.length * 100) : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "relative flex flex-col items-center" }, /* @__PURE__ */ React.createElement("svg", { width: size, height: size / 2 + 20, viewBox: `0 0 ${size} ${size / 2 + 20}` }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("radialGradient", { id: "dayarc-glow", cx: "50%", cy: "100%", r: "70%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#C026D3", stopOpacity: "0.18" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#C026D3", stopOpacity: "0" }))), /* @__PURE__ */ React.createElement("path", { d: `M 8 ${size / 2 + 8} A ${size / 2 - 2} ${size / 2 - 2} 0 0 1 ${size - 8} ${size / 2 + 8}`, fill: "url(#dayarc-glow)", stroke: "none" }), segments.map((s) => /* @__PURE__ */ React.createElement("path", { key: s.id, d: arcPath(s.a0 + 3, s.a1 - 3, r), stroke: "rgba(255,255,255,.06)", strokeWidth: stroke, fill: "none", strokeLinecap: "round" })), segments.map((s) => {
    if (s.ratio <= 0) return null;
    const sweep = s.a0 + 3 + (s.a1 - s.a0 - 6) * s.ratio;
    return /* @__PURE__ */ React.createElement("path", { key: s.id + "f", d: arcPath(s.a0 + 3, sweep, r), stroke: dayColor(s.id), strokeWidth: stroke, fill: "none", strokeLinecap: "round", pathLength: "100", className: "chart-line-draw", style: { filter: `drop-shadow(0 0 6px ${dayGlow(s.id)})` } });
  })), /* @__PURE__ */ React.createElement("div", { className: "absolute top-[62%] flex flex-col items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-4xl font-extrabold leading-none", style: { background: "linear-gradient(135deg,#fff,#EAB4F2)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } }, pct, "%"), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-slate-400 mt-1.5" }, t("today_progress", lang))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-4 mt-2" }, segments.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, className: "flex flex-col items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { background: dayColor(s.id) } }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400" }, s.label)))));
}
function ProgressiveTaskBar({ task, onAddProgress }) {
  const [amount, setAmount] = useState("");
  const pct = Math.min(100, Math.round(task.progressCurrent / task.progressTarget * 100));
  const submit = () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    onAddProgress(task.id, n);
    setAmount("");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "mt-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] text-slate-400 mb-1" }, /* @__PURE__ */ React.createElement("span", null, task.progressCurrent, " / ", task.progressTarget, " ", task.progressUnit), /* @__PURE__ */ React.createElement("span", { className: "font-bold", style: { color: pct >= 100 ? "#22D3EE" : "#C026D3" } }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full", style: { width: `${pct}%`, background: pct >= 100 ? "#22D3EE" : "linear-gradient(90deg,#C026D3,#22D3EE)" } })), pct < 100 && /* @__PURE__ */ React.createElement("form", { className: "flex items-center gap-1.5", onSubmit: (e) => {
    e.preventDefault();
    submit();
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: "0",
      value: amount,
      onChange: (e) => setAmount(e.target.value),
      placeholder: `+ \u0686\u0646\u062F ${task.progressUnit}`,
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-slate-500 outline-none"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[11px] font-medium" }, "\u062B\u0628\u062A")));
}
function TaskRow({ task, onToggle, onSchedule, onDelete, onEdit, onAddProgress }) {
  const q = QUADRANTS.find((x) => x.id === task.quad) || QUADRANTS[1];
  const [openSched, setOpenSched] = useState(false);
  const isProgressive = task.progressType === "progressive";
  return /* @__PURE__ */ React.createElement("div", { className: "py-2.5 border-b border-white/[0.05] last:border-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 px-1" }, isProgressive ? /* @__PURE__ */ React.createElement("span", { className: "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", style: { borderColor: task.status === "done" ? "#22D3EE" : "rgba(255,255,255,.25)" } }, /* @__PURE__ */ React.createElement(Ic, { name: "trending-up", size: 12, className: "text-cyan-300" })) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onToggle(task.id),
      className: "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
      style: { borderColor: task.status === "done" ? q.color : "rgba(255,255,255,.25)", background: task.status === "done" ? q.color : "transparent" }
    },
    task.status === "done" && /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 14, color: "#0A0A0A", strokeWidth: 3 })
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: `text-sm ${task.status === "done" ? "text-slate-500 line-through" : "text-slate-100"}` }, task.title), isProgressive && /* @__PURE__ */ React.createElement(ProgressiveTaskBar, { task, onAddProgress }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-0.5 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-1.5 py-0.5 rounded-md", style: { background: `${q.color}22`, color: q.color } }, q.label), task.tag && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 flex items-center gap-0.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "tag", size: 10 }), task.tag), task.recurrence !== "none" && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 flex items-center gap-0.5 bg-white/[0.04] rounded-md px-1.5 py-0.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "repeat", size: 10 }), " ", recurrenceLabel(task)), task.reminder && /* @__PURE__ */ React.createElement(Ic, { name: "bell", size: 11, className: "text-slate-500" }), /* @__PURE__ */ React.createElement(PriorityBars, { level: task.priority }))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setOpenSched((v) => !v),
      className: "shrink-0 flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-white/10",
      style: { color: task.time ? "#22D3EE" : "#64748b", background: task.time ? "rgba(34,211,238,.1)" : "transparent" }
    },
    /* @__PURE__ */ React.createElement(Ic, { name: "clock", size: 12 }),
    " ",
    task.time || "\u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC"
  ), onEdit && /* @__PURE__ */ React.createElement("button", { onClick: () => onEdit(task), className: "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-fuchsia-300 hover:bg-fuchsia-500/10" }, /* @__PURE__ */ React.createElement(Ic, { name: "edit", size: 14 })), onDelete && /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(task.id), className: "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 14 }))), openSched && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2 mr-9" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      defaultValue: task.time || "08:00",
      onChange: (e) => onSchedule(task.id, e.target.value, task.duration),
      className: "bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, DURATIONS.map((d) => /* @__PURE__ */ React.createElement(Chip, { key: d, active: task.duration === d, color: "#22D3EE", onClick: () => onSchedule(task.id, task.time || "08:00", d) }, d, "\u062F")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: "5",
      step: "5",
      value: task.duration,
      onChange: (e) => onSchedule(task.id, task.time || "08:00", Math.max(5, Number(e.target.value) || 5)),
      className: "w-16 bg-white/[0.05] border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-white outline-none",
      title: "\u062F\u0642\u06CC\u0642\u0647 \u2014 \u0647\u0631 \u0645\u0642\u062F\u0627\u0631\u06CC\u060C \u062D\u062A\u06CC \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u06CC\u06A9 \u0633\u0627\u0639\u062A"
    }
  ))));
}
function AddTaskModal({ onClose, onAdd, initialTask }) {
  const isEdit = !!initialTask;
  const [title, setTitle] = useState(initialTask ? initialTask.title : ""), [desc, setDesc] = useState(initialTask ? initialTask.desc || "" : "");
  const [quad, setQuad] = useState(initialTask ? initialTask.quad : "q2"), [priority, setPriority] = useState(initialTask ? initialTask.priority : 2);
  const [daypart, setDaypart] = useState(initialTask ? initialTask.daypart : "morning"), [tag, setTag] = useState(initialTask ? initialTask.tag || "" : "");
  const [time, setTime] = useState(initialTask ? initialTask.time || "" : ""), [duration, setDuration] = useState(initialTask ? initialTask.duration : 45);
  const [recurrence, setRecurrence] = useState(initialTask ? initialTask.recurrence : "none"), [reminder, setReminder] = useState(initialTask ? initialTask.reminder : false);
  const [progressType, setProgressType] = useState(initialTask ? initialTask.progressType || "binary" : "binary");
  const [progressUnit, setProgressUnit] = useState(initialTask && initialTask.progressUnit || "");
  const [progressTarget, setProgressTarget] = useState(initialTask && initialTask.progressTarget || 10);
  const [progressCurrent] = useState(initialTask && initialTask.progressCurrent || 0);
  const [weekdays, setWeekdays] = useState(initialTask && initialTask.recurrenceWeekdays ? initialTask.recurrenceWeekdays : [(/* @__PURE__ */ new Date()).getDay()]);
  const [monthDay, setMonthDay] = useState(initialTask && initialTask.recurrenceDay ? initialTask.recurrenceDay : Jalali.toJalaliParts(/* @__PURE__ */ new Date()).jd);
  const [yearMonth, setYearMonth] = useState(initialTask && initialTask.recurrenceMonth ? initialTask.recurrenceMonth : Jalali.toJalaliParts(/* @__PURE__ */ new Date()).jm);
  const toggleWeekday = (id) => setWeekdays((p) => p.includes(id) ? p.length > 1 ? p.filter((x) => x !== id) : p : [...p, id]);
  const [subInput, setSubInput] = useState(initialTask && initialTask.subtasks ? initialTask.subtasks.map((s) => s.title).join(", ") : "");
  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      id: isEdit ? initialTask.id : uid(),
      title: title.trim(),
      desc: desc.trim(),
      quad,
      priority,
      status: isEdit ? initialTask.status : "todo",
      completedDate: isEdit ? initialTask.completedDate : null,
      daypart,
      tag: tag.trim(),
      time: time || null,
      duration,
      recurrence,
      reminder,
      recurrenceWeekdays: recurrence === "weekly" ? weekdays : void 0,
      recurrenceDay: recurrence === "monthly" || recurrence === "yearly" ? monthDay : void 0,
      recurrenceMonth: recurrence === "yearly" ? yearMonth : void 0,
      subtasks: subInput.trim() ? subInput.split(",").map((s) => ({ id: uid(), title: s.trim(), done: false })).filter((s) => s.title) : [],
      progressType,
      progressUnit: progressType === "progressive" ? progressUnit.trim() || "\u0648\u0627\u062D\u062F" : void 0,
      progressTarget: progressType === "progressive" ? Math.max(1, Number(progressTarget) || 1) : void 0,
      progressCurrent: progressType === "progressive" ? progressCurrent : void 0
    });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: isEdit ? "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u062A\u0633\u06A9" : "\u062A\u0633\u06A9 \u062C\u062F\u06CC\u062F",
      onClose,
      onSubmit: submit,
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: !title.trim(), className: "w-full rounded-xl py-3 font-bold text-sm bg-gradient-to-l from-[#C026D3] to-[#DB2777] text-white disabled:opacity-30" }, isEdit ? "\u0630\u062E\u06CC\u0631\u0647 \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A" : "\u0627\u0641\u0632\u0648\u062F\u0646 \u062A\u0633\u06A9")
    },
    /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u0639\u0646\u0648\u0627\u0646 \u062A\u0633\u06A9 \u2014 \u0645\u062B\u0644\u0627\u064B \u062D\u0644 \u0646\u0645\u0648\u0646\u0647\u200C\u0633\u0648\u0627\u0644 \u0641\u06CC\u0632\u06CC\u06A9" }),
    /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: desc,
        onChange: (e) => setDesc(e.target.value),
        placeholder: "\u062A\u0648\u0636\u06CC\u062D (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)",
        rows: 2,
        className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 text-xs mb-4 outline-none resize-none focus:border-fuchsia-400/60"
      }
    ),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0631\u0628\u0639 \u0622\u06CC\u0632\u0646\u0647\u0627\u0648\u0631"),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mb-4" }, QUADRANTS.map((q) => /* @__PURE__ */ React.createElement(Chip, { key: q.id, active: quad === q.id, color: q.color, onClick: () => setQuad(q.id) }, q.label))),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0627\u0648\u0644\u0648\u06CC\u062A"),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, PRIORITIES.map((p) => /* @__PURE__ */ React.createElement(Chip, { key: p.level, active: priority === p.level, color: "#DB2777", onClick: () => setPriority(p.level) }, p.label))),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0632\u0645\u0627\u0646 \u0631\u0648\u0632"),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, DAYPARTS.map((d) => /* @__PURE__ */ React.createElement(Chip, { key: d.id, active: daypart === d.id, onClick: () => setDaypart(d.id) }, d.label))),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u062F\u0642\u06CC\u0642 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC \u2014 \u0628\u0631\u0627\u06CC Time Blocking)"),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-4" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: time,
        onChange: (e) => setTime(e.target.value),
        className: "bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 items-center" }, DURATIONS.map((d) => /* @__PURE__ */ React.createElement(Chip, { key: d, active: duration === d, color: "#22D3EE", onClick: () => setDuration(d) }, d, " \u062F\u0642\u06CC\u0642\u0647")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "5",
        step: "5",
        value: duration,
        onChange: (e) => setDuration(Math.max(5, Number(e.target.value) || 5)),
        className: "w-20 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none",
        placeholder: "\u062F\u0642\u06CC\u0642\u0647"
      }
    ))),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0646\u0648\u0639 \u062A\u0633\u06A9"),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-3" }, /* @__PURE__ */ React.createElement(Chip, { active: progressType === "binary", onClick: () => setProgressType("binary") }, "\u0633\u0627\u062F\u0647 (\u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F/\u0646\u0634\u062F)"), /* @__PURE__ */ React.createElement(Chip, { active: progressType === "progressive", color: "#22D3EE", onClick: () => setProgressType("progressive") }, t("progress_task", "fa"), " (\u0631\u0648\u0646\u062F\u200C\u062F\u0627\u0631)")),
    progressType === "progressive" && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-white/[0.03] border border-white/10 rounded-xl p-3 flex gap-2 items-end" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-[11px] mb-1" }, "\u0648\u0627\u062D\u062F \u067E\u06CC\u0634\u0631\u0641\u062A \u2014 \u0645\u062B\u0644\u0627\u064B \u0635\u0641\u062D\u0647\u060C \u062F\u0642\u06CC\u0642\u0647"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: progressUnit,
        onChange: (e) => setProgressUnit(e.target.value),
        placeholder: "\u0635\u0641\u062D\u0647",
        className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "w-28" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-[11px] mb-1" }, "\u0647\u062F\u0641 \u06A9\u0644"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        value: progressTarget,
        onChange: (e) => setProgressTarget(e.target.value),
        className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
      }
    ))),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u062A\u06A9\u0631\u0627\u0631"),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-3 flex-wrap" }, RECURRENCE_TYPES.map(([v, l]) => /* @__PURE__ */ React.createElement(Chip, { key: v, active: recurrence === v, onClick: () => setRecurrence(v) }, l))),
    recurrence === "weekly" && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-white/[0.03] border border-white/10 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-[11px] mb-2" }, "\u062F\u0631 \u0686\u0647 \u0631\u0648\u0632\u0647\u0627\u06CC\u06CC \u0627\u0632 \u0647\u0641\u062A\u0647 \u062A\u06A9\u0631\u0627\u0631 \u0628\u0634\u0647"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 flex-wrap" }, WEEKDAYS.map((w) => /* @__PURE__ */ React.createElement(Chip, { key: w.id, active: weekdays.includes(w.id), color: "#22D3EE", onClick: () => toggleWeekday(w.id) }, w.label)))),
    recurrence === "monthly" && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-white/[0.03] border border-white/10 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-[11px] mb-2" }, "\u062F\u0631 \u0686\u0646\u062F\u0645 \u0647\u0631 \u0645\u0627\u0647 \u062A\u06A9\u0631\u0627\u0631 \u0628\u0634\u0647"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        max: "31",
        value: monthDay,
        onChange: (e) => setMonthDay(Math.min(31, Math.max(1, Number(e.target.value) || 1))),
        className: "w-24 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 mr-2" }, "\u0647\u0631 \u0645\u0627\u0647\u060C \u0631\u0648\u0632 ", monthDay)),
    recurrence === "yearly" && /* @__PURE__ */ React.createElement("div", { className: "mb-4 bg-white/[0.03] border border-white/10 rounded-xl p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-[11px] mb-2" }, "\u0647\u0631 \u0633\u0627\u0644 \u062F\u0631 \u0686\u0647 \u062A\u0627\u0631\u06CC\u062E\u06CC \u062A\u06A9\u0631\u0627\u0631 \u0628\u0634\u0647"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "1",
        max: "31",
        value: monthDay,
        onChange: (e) => setMonthDay(Math.min(31, Math.max(1, Number(e.target.value) || 1))),
        className: "w-20 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
      }
    ), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: yearMonth,
        onChange: (e) => setYearMonth(Number(e.target.value)),
        className: "bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
      },
      JALALI_MONTHS_FA.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: i, value: i + 1, className: "bg-[#120814]" }, m))
    ))),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "bell", size: 13 }), " \u06CC\u0627\u062F\u0622\u0648\u0631\u06CC"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setReminder((v) => !v), className: "w-10 h-5 rounded-full relative transition-colors", style: { background: reminder ? "#C026D3" : "rgba(255,255,255,.15)" } }, /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", style: { right: reminder ? 20 : 2 } }))),
    /* @__PURE__ */ React.createElement(TextInput, { value: tag, onChange: (e) => setTag(e.target.value), placeholder: "\u0628\u0631\u0686\u0633\u0628 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)" }),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        value: subInput,
        onChange: (e) => setSubInput(e.target.value),
        placeholder: "\u0632\u06CC\u0631\u062A\u0633\u06A9\u200C\u0647\u0627 \u0628\u0627 \u06A9\u0627\u0645\u0627 \u062C\u062F\u0627 \u06A9\u0646 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)",
        className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 text-xs mb-2 outline-none focus:border-fuchsia-400/60"
      }
    )
  );
}
function EisenhowerBoard({ tasks, onToggle, onDelete }) {
  return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, QUADRANTS.map((q) => {
    const qTasks = tasks.filter((t2) => t2.quad === q.id);
    return /* @__PURE__ */ React.createElement(GlassCard, { key: q.id, className: "p-3 min-h-[150px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { background: q.color } }), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold", style: { color: q.color } }, q.label)), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mb-2" }, q.sub), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, qTasks.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600" }, "\u062A\u0633\u06A9\u06CC \u0646\u06CC\u0633\u062A"), qTasks.map((t2) => /* @__PURE__ */ React.createElement("div", { key: t2.id, className: `flex items-center gap-1 rounded-lg border border-white/[0.06] ${t2.status === "done" ? "bg-white/[0.02]" : "bg-white/[0.03]"}` }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onToggle(t2.id),
        className: `flex-1 text-right text-[11px] px-2 py-1.5 truncate ${t2.status === "done" ? "text-slate-600 line-through" : "text-slate-200"}`
      },
      t2.title
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(t2.id), className: "shrink-0 px-1.5 text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 11 }))))));
  }));
}
function KanbanBoard({ tasks, onMove, onDelete }) {
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, STATUS_ORDER.map((st) => {
    const items = tasks.filter((t2) => t2.status === st);
    const idx = STATUS_ORDER.indexOf(st);
    return /* @__PURE__ */ React.createElement(GlassCard, { key: st, className: "p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-200" }, STATUS_LABEL[st]), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, items.length)), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, items.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600 py-1" }, "\u062E\u0627\u0644\u06CC"), items.map((t2) => {
      const q = QUADRANTS.find((x) => x.id === t2.quad) || QUADRANTS[1];
      return /* @__PURE__ */ React.createElement("div", { key: t2.id, className: "flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/[0.03] border border-white/[0.06]" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full shrink-0", style: { background: q.color } }), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 flex-1 truncate" }, t2.title), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 shrink-0" }, idx > 0 && /* @__PURE__ */ React.createElement("button", { onClick: () => onMove(t2.id, STATUS_ORDER[idx - 1]), className: "w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "chevron-right", size: 13, className: "text-slate-400" })), idx < 2 && /* @__PURE__ */ React.createElement("button", { onClick: () => onMove(t2.id, STATUS_ORDER[idx + 1]), className: "w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "chevron-left", size: 13, className: "text-slate-400" })), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(t2.id), className: "w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 12, className: "text-rose-400" }))));
    })));
  }));
}
function TimelineView({ tasks, onSchedule, onSuggest }) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const unscheduled = tasks.filter((t2) => !t2.time);
  const scheduled = tasks.filter((t2) => t2.time);
  const rowH = 44;
  const topFor = (time) => {
    const [h, m] = time.split(":").map(Number);
    return (h - 6) * rowH + m / 60 * rowH;
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "sparkles", size: 14, className: "text-fuchsia-300" }), " \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u0628\u0631\u0646\u0627\u0645\u0647 \u0647\u0648\u0634\u0645\u0646\u062F"), /* @__PURE__ */ React.createElement("button", { onClick: onSuggest, className: "text-[11px] px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 font-medium" }, "\u0627\u0639\u0645\u0627\u0644 \u06A9\u0646")), unscheduled.length > 0 && /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 mb-2" }, "\u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC\u200C\u0646\u0634\u062F\u0647 \u2014 \u06CC\u06A9 \u0632\u0645\u0627\u0646 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, unscheduled.map((t2) => /* @__PURE__ */ React.createElement("div", { key: t2.id, className: "flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 flex-1 truncate" }, t2.title), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      onChange: (e) => onSchedule(t2.id, e.target.value, t2.duration),
      className: "bg-white/[0.06] border border-white/10 rounded-md px-1.5 py-1 text-[11px] text-white outline-none w-[85px]"
    }
  ))))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("div", { className: "relative", style: { height: hours.length * rowH } }, hours.map((h, i) => /* @__PURE__ */ React.createElement("div", { key: h, className: "absolute left-0 right-0 flex items-start gap-2", style: { top: i * rowH, height: rowH } }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 w-9 shrink-0" }, String(h).padStart(2, "0"), ":\u06F0\u06F0"), /* @__PURE__ */ React.createElement("div", { className: "flex-1 border-t border-white/[0.05]" }))), scheduled.map((t2) => {
    const q = QUADRANTS.find((x) => x.id === t2.quad) || QUADRANTS[1];
    const h = t2.duration / 60 * rowH;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: t2.id,
        className: "absolute right-1 rounded-lg px-2 py-1 overflow-hidden",
        style: { top: topFor(t2.time), height: Math.max(h, 22), left: 46, background: `${q.color}22`, borderRight: `3px solid ${q.color}` }
      },
      /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-medium truncate", style: { color: q.color } }, t2.title),
      /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-400" }, t2.time, " \xB7 ", t2.duration, "\u062F")
    );
  }))));
}
function BookCard({ book, onSetStatus, onAddPages, onDelete }) {
  const st = BOOK_STATUSES.find((s) => s.id === book.status);
  const pct = book.pages ? Math.min(100, Math.round(book.pagesRead / book.pages * 100)) : 0;
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-lg shrink-0 flex items-center justify-center text-lg font-bold", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)", height: 56, width: 42 } }, book.title[0]), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-100 truncate" }, book.title), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 mb-1.5" }, book.author, book.pages ? ` \xB7 ${book.pagesRead}/${book.pages} \u0635\u0641\u062D\u0647` : ""), book.status !== "want" && /* @__PURE__ */ React.createElement("div", { className: "h-1.5 rounded-full bg-white/[0.08] overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full", style: { width: `${book.status === "finished" ? 100 : pct}%`, background: "linear-gradient(90deg,#C026D3,#22D3EE)" } }))), book.status === "reading" && /* @__PURE__ */ React.createElement("button", { onClick: () => onAddPages(book.id), className: "self-center text-[10px] px-2 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 shrink-0" }, "+\u06F1\u06F0\u0635"), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(book.id), className: "self-center w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/80 hover:bg-rose-500/10 shrink-0" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 14 }))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 mt-2.5" }, BOOK_STATUSES.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.id,
      onClick: () => onSetStatus(book.id, s.id),
      className: "flex-1 text-[10px] rounded-lg py-1.5 border transition-all",
      style: { borderColor: book.status === s.id ? s.color : "rgba(255,255,255,.1)", background: book.status === s.id ? `${s.color}22` : "transparent", color: book.status === s.id ? s.color : "#64748b" }
    },
    s.label
  ))));
}
function AddBookModal({ onClose, onAdd }) {
  const [title, setTitle] = useState(""), [author, setAuthor] = useState("");
  const [pages, setPages] = useState(""), [status, setStatus] = useState("want");
  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), author: author.trim(), pages: Number(pages) || 0, pagesRead: status === "finished" ? Number(pages) || 0 : 0, status });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: "\u0627\u0641\u0632\u0648\u062F\u0646 \u06A9\u062A\u0627\u0628",
      onClose,
      onSubmit: submit,
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: !title.trim(), className: "w-full rounded-xl py-3 font-bold text-sm bg-gradient-to-l from-[#C026D3] to-[#DB2777] text-white disabled:opacity-30" }, "\u0627\u0641\u0632\u0648\u062F\u0646")
    },
    /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u0639\u0646\u0648\u0627\u0646 \u06A9\u062A\u0627\u0628" }),
    /* @__PURE__ */ React.createElement(TextInput, { value: author, onChange: (e) => setAuthor(e.target.value), placeholder: "\u0646\u0648\u06CC\u0633\u0646\u062F\u0647" }),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: pages,
        onChange: (e) => setPages(e.target.value),
        placeholder: "\u062A\u0639\u062F\u0627\u062F \u0635\u0641\u062D\u0627\u062A",
        className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm mb-4 outline-none"
      }
    ),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0648\u0636\u0639\u06CC\u062A"),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-2" }, BOOK_STATUSES.map((s) => /* @__PURE__ */ React.createElement(Chip, { key: s.id, active: status === s.id, color: s.color, onClick: () => setStatus(s.id) }, s.label)))
  );
}
function VideoCard({ v, onToggleWatched, onDelete }) {
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3 flex gap-3" }, v.videoId ? /* @__PURE__ */ React.createElement("a", { href: `https://youtube.com/watch?v=${v.videoId}`, target: "_blank", rel: "noreferrer", className: "shrink-0 relative" }, /* @__PURE__ */ React.createElement("img", { src: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`, alt: v.title, className: "w-24 h-16 object-cover rounded-lg" }), /* @__PURE__ */ React.createElement("span", { className: "absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg" }, /* @__PURE__ */ React.createElement(Ic, { name: "external-link", size: 14, className: "text-white" }))) : v.fileData ? /* @__PURE__ */ React.createElement("video", { src: v.fileData, controls: true, className: "w-24 h-16 object-cover rounded-lg bg-black shrink-0" }) : /* @__PURE__ */ React.createElement("div", { className: "w-24 h-16 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Ic, { name: "play", size: 18, className: "text-red-400" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-100 truncate" }, v.title), v.watchAt && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-cyan-300 mt-0.5 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Ic, { name: "clock", size: 11 }), formatWhen(v.watchAt)), v.videoId && /* @__PURE__ */ React.createElement("a", { href: `https://youtube.com/watch?v=${v.videoId}`, target: "_blank", rel: "noreferrer", className: "text-[11px] text-fuchsia-300 flex items-center gap-1 mt-1" }, "\u0645\u0634\u0627\u0647\u062F\u0647 \u062F\u0631 \u06CC\u0648\u062A\u06CC\u0648\u0628 ", /* @__PURE__ */ React.createElement(Ic, { name: "external-link", size: 11 })), v.fileData && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 mt-1" }, "\u0641\u0627\u06CC\u0644 \u0645\u062D\u0644\u06CC (\u0631\u0648\u06CC \u0647\u0645\u06CC\u0646 \u06AF\u0648\u0634\u06CC/\u0645\u0631\u0648\u0631\u06AF\u0631)")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-2 shrink-0 self-center" }, /* @__PURE__ */ React.createElement("button", { onClick: onToggleWatched, className: "w-7 h-7 rounded-full flex items-center justify-center", style: { background: v.watched ? "#22D3EE" : "rgba(255,255,255,.08)" } }, v.watched && /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 14, color: "#0A0A0A", strokeWidth: 3 })), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(v.id), className: "w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/80 hover:bg-rose-500/10" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 13 }))));
}
function AddVideoModal({ onClose, onAdd }) {
  const [source, setSource] = useState("link");
  const [url, setUrl] = useState(""), [title, setTitle] = useState(""), [watchAt, setWatchAt] = useState("");
  const [error, setError] = useState("");
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileTooBig, setFileTooBig] = useState(false);
  const MAX_BYTES = 4 * 1024 * 1024;
  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setFileTooBig(file.size > MAX_BYTES);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result);
    reader.readAsDataURL(file);
  };
  const submit = () => {
    if (source === "link") {
      const videoId = parseYouTubeId(url.trim());
      if (!videoId) {
        setError("\u0627\u06CC\u0646 \u0644\u06CC\u0646\u06A9 \u06CC\u0648\u062A\u06CC\u0648\u0628 \u0645\u0639\u062A\u0628\u0631 \u0628\u0647 \u0646\u0638\u0631 \u0646\u0645\u06CC\u200C\u0631\u0633\u0647");
        return;
      }
      onAdd({ videoId, url: url.trim(), title: title.trim() || "\u0648\u06CC\u062F\u06CC\u0648\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628", watchAt, watched: false });
    } else {
      if (!fileData) {
        setError("\u06CC\u0647 \u0641\u0627\u06CC\u0644 \u0648\u06CC\u062F\u06CC\u0648\u06CC\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646");
        return;
      }
      onAdd({ videoId: null, fileData, title: title.trim() || fileName || "\u0648\u06CC\u062F\u06CC\u0648\u06CC \u0645\u062D\u0644\u06CC", watchAt, watched: false });
    }
    onClose();
  };
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: "\u0627\u0641\u0632\u0648\u062F\u0646 \u0648\u06CC\u062F\u06CC\u0648",
      onClose,
      onSubmit: submit,
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: source === "link" ? !url.trim() : !fileData, className: "w-full rounded-xl py-3 font-bold text-sm bg-gradient-to-l from-[#DB2777] to-[#C026D3] text-white disabled:opacity-30" }, "\u0627\u0641\u0632\u0648\u062F\u0646")
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, /* @__PURE__ */ React.createElement(Chip, { active: source === "link", onClick: () => {
      setSource("link");
      setError("");
    } }, "\u0644\u06CC\u0646\u06A9 \u06CC\u0648\u062A\u06CC\u0648\u0628"), /* @__PURE__ */ React.createElement(Chip, { active: source === "file", onClick: () => {
      setSource("file");
      setError("");
    } }, "\u0641\u0627\u06CC\u0644 \u0627\u0632 \u06AF\u0648\u0634\u06CC")),
    source === "link" ? /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: url, onChange: (e) => {
      setUrl(e.target.value);
      setError("");
    }, placeholder: "\u0644\u06CC\u0646\u06A9 \u0648\u06CC\u062F\u06CC\u0648\u06CC \u06CC\u0648\u062A\u06CC\u0648\u0628" }) : /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center justify-center gap-2 w-full border border-dashed border-white/15 rounded-xl py-4 text-sm text-slate-300 cursor-pointer" }, /* @__PURE__ */ React.createElement(Ic, { name: "folder", size: 16 }), fileName || "\u0627\u0646\u062A\u062E\u0627\u0628 \u0648\u06CC\u062F\u06CC\u0648 \u0627\u0632 \u06AF\u0627\u0644\u0631\u06CC \u06AF\u0648\u0634\u06CC", /* @__PURE__ */ React.createElement("input", { type: "file", accept: "video/*", onChange: onPickFile, className: "hidden" })), fileTooBig && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-pink-400 mt-2" }, "\u0627\u06CC\u0646 \u0641\u0627\u06CC\u0644 \u062D\u062C\u0645\u0634 \u0632\u06CC\u0627\u062F\u0647 \u2014 \u0641\u0642\u0637 \u062A\u0627 \u0648\u0642\u062A\u06CC \u0627\u06CC\u0646 \u062A\u0628 \u0628\u0627\u0632 \u0628\u0627\u0634\u0647 \u0642\u0627\u0628\u0644 \u067E\u062E\u0634\u0647 \u0648 \u0628\u0639\u062F \u0627\u0632 \u0628\u0633\u062A\u0646 \u0645\u0631\u0648\u0631\u06AF\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0646\u0645\u06CC\u200C\u0645\u0648\u0646\u0647. \u0628\u0631\u0627\u06CC \u0630\u062E\u06CC\u0631\u0647\u200C\u06CC \u0647\u0645\u06CC\u0634\u06AF\u06CC\u060C \u06CC\u0647 \u0644\u06CC\u0646\u06A9 (\u0645\u062B\u0644\u0627\u064B \u06CC\u0648\u062A\u06CC\u0648\u0628) \u0628\u0647\u062A\u0631\u0647.")),
    error && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-rose-400 -mt-2 mb-3" }, error),
    /* @__PURE__ */ React.createElement(TextInput, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u0639\u0646\u0648\u0627\u0646 \u0648\u06CC\u062F\u06CC\u0648 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)" }),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0686\u0647 \u0632\u0645\u0627\u0646\u06CC \u0645\u06CC\u200C\u062E\u0648\u0627\u0645 \u0628\u0628\u06CC\u0646\u0645 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)"),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "datetime-local",
        value: watchAt,
        onChange: (e) => setWatchAt(e.target.value),
        className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-2 outline-none"
      }
    )
  );
}
function PodcastCard({ p, onToggleListened, onDelete }) {
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3 flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-11 h-11 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Ic, { name: "headphones", size: 17, className: "text-cyan-300" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-100 truncate" }, p.title), p.listenAt && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-cyan-300 mt-0.5 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Ic, { name: "clock", size: 11 }), formatWhen(p.listenAt)), p.link && /* @__PURE__ */ React.createElement("a", { href: p.link, target: "_blank", rel: "noreferrer", className: "text-[11px] text-fuchsia-300 flex items-center gap-1 mt-1" }, "\u0628\u0627\u0632 \u062F\u0631 \u0627\u0633\u067E\u0627\u062A\u06CC\u0641\u0627\u06CC ", /* @__PURE__ */ React.createElement(Ic, { name: "external-link", size: 11 })), p.fileData && /* @__PURE__ */ React.createElement("audio", { src: p.fileData, controls: true, className: "w-full h-8 mt-1.5" })), /* @__PURE__ */ React.createElement("button", { onClick: onToggleListened, className: "w-7 h-7 rounded-full flex items-center justify-center shrink-0", style: { background: p.listened ? "#22D3EE" : "rgba(255,255,255,.08)" } }, p.listened && /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 14, color: "#0A0A0A", strokeWidth: 3 })), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(p.id), className: "w-7 h-7 rounded-lg flex items-center justify-center text-rose-400/80 hover:bg-rose-500/10 shrink-0" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 13 })));
}
function AddPodcastModal({ onClose, onAdd }) {
  const [source, setSource] = useState("link");
  const [link, setLink] = useState(""), [title, setTitle] = useState(""), [listenAt, setListenAt] = useState("");
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileTooBig, setFileTooBig] = useState(false);
  const [error, setError] = useState("");
  const MAX_BYTES = 4 * 1024 * 1024;
  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setFileTooBig(file.size > MAX_BYTES);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result);
    reader.readAsDataURL(file);
  };
  const submit = () => {
    if (source === "file" && !fileData) {
      setError("\u06CC\u0647 \u0641\u0627\u06CC\u0644 \u0635\u0648\u062A\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646");
      return;
    }
    if (source === "link" && !title.trim()) {
      setError("\u06CC\u0647 \u0639\u0646\u0648\u0627\u0646 \u0628\u0646\u0648\u06CC\u0633");
      return;
    }
    onAdd({ title: title.trim() || fileName || "\u067E\u0627\u062F\u06A9\u0633\u062A", link: source === "link" ? link.trim() : "", fileData: source === "file" ? fileData : null, listenAt, listened: false });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: "\u0627\u0641\u0632\u0648\u062F\u0646 \u067E\u0627\u062F\u06A9\u0633\u062A",
      onClose,
      onSubmit: submit,
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: source === "file" ? !fileData : !title.trim(), className: "w-full rounded-xl py-3 font-bold text-sm bg-gradient-to-l from-[#22D3EE] to-[#C026D3] text-white disabled:opacity-30" }, "\u0627\u0641\u0632\u0648\u062F\u0646")
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, /* @__PURE__ */ React.createElement(Chip, { active: source === "link", onClick: () => {
      setSource("link");
      setError("");
    } }, "\u0644\u06CC\u0646\u06A9 \u0627\u0633\u067E\u0627\u062A\u06CC\u0641\u0627\u06CC"), /* @__PURE__ */ React.createElement(Chip, { active: source === "file", onClick: () => {
      setSource("file");
      setError("");
    } }, "\u0641\u0627\u06CC\u0644 \u0627\u0632 \u06AF\u0648\u0634\u06CC")),
    source === "link" ? /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: link, onChange: (e) => setLink(e.target.value), placeholder: "\u0644\u06CC\u0646\u06A9 \u0627\u0633\u067E\u0627\u062A\u06CC\u0641\u0627\u06CC" }) : /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-center justify-center gap-2 w-full border border-dashed border-white/15 rounded-xl py-4 text-sm text-slate-300 cursor-pointer" }, /* @__PURE__ */ React.createElement(Ic, { name: "folder", size: 16 }), fileName || "\u0627\u0646\u062A\u062E\u0627\u0628 \u0641\u0627\u06CC\u0644 \u0635\u0648\u062A\u06CC \u0627\u0632 \u06AF\u0648\u0634\u06CC", /* @__PURE__ */ React.createElement("input", { type: "file", accept: "audio/*", onChange: onPickFile, className: "hidden" })), fileTooBig && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-pink-400 mt-2" }, "\u062D\u062C\u0645 \u0641\u0627\u06CC\u0644 \u0632\u06CC\u0627\u062F\u0647 \u2014 \u0645\u0645\u06A9\u0646\u0647 \u0628\u0639\u062F \u0627\u0632 \u0628\u0633\u062A\u0646 \u0645\u0631\u0648\u0631\u06AF\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0646\u0645\u0648\u0646\u0647.")),
    error && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-rose-400 mb-3" }, error),
    /* @__PURE__ */ React.createElement(TextInput, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u0639\u0646\u0648\u0627\u0646 \u0627\u067E\u06CC\u0632\u0648\u062F" }),
    /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-2" }, "\u0686\u0647 \u0632\u0645\u0627\u0646\u06CC \u06AF\u0648\u0634 \u0628\u062F\u0645 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)"),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "datetime-local",
        value: listenAt,
        onChange: (e) => setListenAt(e.target.value),
        className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-2 outline-none"
      }
    )
  );
}
function smoothSvgPath(points) {
  if (points.length < 2) return points.length ? `M ${points[0][0]} ${points[0][1]}` : "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}
function SimpleBarChart({ data, xKey, yKey, color = "#C026D3", height = 140 }) {
  const gid = useId();
  const max = Math.max(...data.map((d) => d[yKey]), 1);
  return /* @__PURE__ */ React.createElement("div", { style: { height }, className: "relative flex items-end gap-2.5 px-1" }, /* @__PURE__ */ React.createElement("svg", { width: "0", height: "0" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: `bar-${gid}`, x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: "1" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0.35" })))), [0.25, 0.5, 0.75, 1].map((f) => /* @__PURE__ */ React.createElement("div", { key: f, className: "absolute left-0 right-0 border-t border-white/[0.06]", style: { bottom: `${f * 100}%` } })), data.map((d, i) => {
    const pct = Math.max(d[yKey] / max * 100, 4);
    return /* @__PURE__ */ React.createElement("div", { key: i, className: "relative z-[1] flex-1 flex flex-col items-center justify-end gap-1.5 h-full" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-slate-300" }, d[yKey]), /* @__PURE__ */ React.createElement("div", { className: "w-full rounded-[7px] chart-bar-grow", style: { height: `${pct}%`, background: `url(#bar-${gid}) ${color}`, backgroundImage: `linear-gradient(180deg, ${color}, ${color}59)`, boxShadow: `0 6px 16px -4px ${color}88, inset 0 1px 0 rgba(255,255,255,.35)`, animationDelay: `${i * 60}ms` } }), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-500" }, d[xKey]));
  }));
}
function SimpleLineChart({ data, xKey, yKey, color = "#22D3EE", height = 140 }) {
  const gid = useId();
  const max = Math.max(...data.map((d) => d[yKey]), 1);
  const w = 300, pad = 10;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const yFor = (v) => height - pad - v / max * (height - pad * 2);
  const pts = data.map((d, i) => [pad + i * stepX, yFor(d[yKey])]);
  const linePath = smoothSvgPath(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${height - pad} L ${pts[0][0]} ${height - pad} Z`;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${height}`, width: "100%", height, preserveAspectRatio: "none" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: `area-${gid}`, x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: "0.45" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" }))), [0.25, 0.5, 0.75, 1].map((f) => /* @__PURE__ */ React.createElement("line", { key: f, x1: pad, x2: w - pad, y1: height - pad - f * (height - pad * 2), y2: height - pad - f * (height - pad * 2), stroke: "rgba(255,255,255,.06)" })), /* @__PURE__ */ React.createElement("path", { d: areaPath, fill: `url(#area-${gid})`, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { d: linePath, fill: "none", stroke: color, strokeWidth: "2.5", strokeLinecap: "round", style: { filter: `drop-shadow(0 0 5px ${color}aa)` }, pathLength: "100", className: "chart-line-draw" }), pts.map(([x, y], i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: x, cy: y, r: "3.2", fill: "#0A0A0A", stroke: color, strokeWidth: "2" }))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between mt-1 px-1" }, data.map((d, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "text-[9px] text-slate-500" }, d[xKey]))));
}
function MiniBarChart(data, dataKey, color) {
  return /* @__PURE__ */ React.createElement(SimpleBarChart, { data, xKey: "day", yKey: dataKey, color, height: 140 });
}
function StudyProgress({ books, videos, podcasts }) {
  const weekData = [{ day: "\u0634", pages: 12 }, { day: "\u06CC", pages: 20 }, { day: "\u062F", pages: 8 }, { day: "\u0633", pages: 25 }, { day: "\u0686", pages: 15 }, { day: "\u067E", pages: 30 }, { day: "\u062C", pages: 18 }];
  const finished = books.filter((b) => b.status === "finished").length;
  const reading = books.filter((b) => b.status === "reading").length;
  const watchedVideos = videos.filter((v) => v.watched).length;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement(StatPill, { icon: "book", label: "\u06A9\u062A\u0627\u0628 \u062A\u0645\u0627\u0645\u200C\u0634\u062F\u0647", value: finished, color: "#C026D3" }), /* @__PURE__ */ React.createElement(StatPill, { icon: "trending-up", label: "\u062F\u0631 \u062D\u0627\u0644 \u0645\u0637\u0627\u0644\u0639\u0647", value: reading, color: "#22D3EE" })), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u0635\u0641\u062D\u0627\u062A \u062E\u0648\u0627\u0646\u062F\u0647\u200C\u0634\u062F\u0647 \u2014 \u06F7 \u0631\u0648\u0632 \u0627\u062E\u06CC\u0631"), MiniBarChart(weekData, "pages", "#C026D3")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement(StatPill, { icon: "\u25B6\uFE0F", label: "\u0648\u06CC\u062F\u06CC\u0648 \u062F\u06CC\u062F\u0647\u200C\u0634\u062F\u0647", value: watchedVideos, color: "#C026D3" }), /* @__PURE__ */ React.createElement(StatPill, { icon: "headphones", label: "\u067E\u0627\u062F\u06A9\u0633\u062A \u062A\u0645\u0627\u0645\u200C\u0634\u062F\u0647", value: podcasts.filter((p) => p.listened).length, color: "#DB2777" })));
}
function StudyHub({ books, videos, podcasts, setBooks, setVideos, setPodcasts }) {
  const [sub, setSub] = useState("books");
  const [showAdd, setShowAdd] = useState(false);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(SubTabs, { value: sub, onChange: setSub, options: [["books", "\u06A9\u062A\u0627\u0628\u200C\u0647\u0627", "book"], ["videos", "\u0648\u06CC\u062F\u06CC\u0648", "play"], ["podcasts", "\u067E\u0627\u062F\u06A9\u0633\u062A", "headphones"], ["progress", "\u067E\u06CC\u0634\u0631\u0641\u062A", "trending-up"]] }), sub === "books" && /* @__PURE__ */ React.createElement("div", null, books.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-4" }, "\u0647\u0646\u0648\u0632 \u06A9\u062A\u0627\u0628\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3" }, books.map((b) => /* @__PURE__ */ React.createElement(
    BookCard,
    {
      key: b.id,
      book: b,
      onSetStatus: (id, status) => setBooks((p) => p.map((x) => x.id === id ? { ...x, status, pagesRead: status === "finished" ? x.pages : x.pagesRead } : x)),
      onAddPages: (id) => setBooks((p) => p.map((x) => x.id === id ? { ...x, pagesRead: Math.min(x.pages, x.pagesRead + 10) } : x)),
      onDelete: (id) => setBooks((p) => p.filter((x) => x.id !== id))
    }
  ))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAdd(true), className: "w-full mt-2.5 rounded-xl py-3 text-sm font-medium text-slate-300 border border-dashed border-white/15 flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15 }), " \u0627\u0641\u0632\u0648\u062F\u0646 \u06A9\u062A\u0627\u0628")), sub === "videos" && /* @__PURE__ */ React.createElement("div", null, videos.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-4" }, "\u0647\u0646\u0648\u0632 \u0648\u06CC\u062F\u06CC\u0648\u06CC\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3" }, videos.map((v) => /* @__PURE__ */ React.createElement(VideoCard, { key: v.id, v, onToggleWatched: () => setVideos((p) => p.map((x) => x.id === v.id ? { ...x, watched: !x.watched } : x)), onDelete: (id) => setVideos((p) => p.filter((x) => x.id !== id)) }))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAdd(true), className: "w-full mt-2.5 rounded-xl py-3 text-sm font-medium text-slate-300 border border-dashed border-white/15 flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15 }), " \u0627\u0641\u0632\u0648\u062F\u0646 \u0648\u06CC\u062F\u06CC\u0648")), sub === "podcasts" && /* @__PURE__ */ React.createElement("div", null, podcasts.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-4" }, "\u0647\u0646\u0648\u0632 \u067E\u0627\u062F\u06A9\u0633\u062A\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3" }, podcasts.map((p) => /* @__PURE__ */ React.createElement(PodcastCard, { key: p.id, p, onToggleListened: () => setPodcasts((prev) => prev.map((x) => x.id === p.id ? { ...x, listened: !x.listened } : x)), onDelete: (id) => setPodcasts((prev) => prev.filter((x) => x.id !== id)) }))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAdd(true), className: "w-full mt-2.5 rounded-xl py-3 text-sm font-medium text-slate-300 border border-dashed border-white/15 flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15 }), " \u0627\u0641\u0632\u0648\u062F\u0646 \u067E\u0627\u062F\u06A9\u0633\u062A")), sub === "progress" && /* @__PURE__ */ React.createElement(StudyProgress, { books, videos, podcasts }), showAdd && sub === "books" && /* @__PURE__ */ React.createElement(AddBookModal, { onClose: () => setShowAdd(false), onAdd: (b) => setBooks((p) => [{ id: uid(), ...b }, ...p]) }), showAdd && sub === "videos" && /* @__PURE__ */ React.createElement(AddVideoModal, { onClose: () => setShowAdd(false), onAdd: (v) => setVideos((p) => [{ id: uid(), ...v }, ...p]) }), showAdd && sub === "podcasts" && /* @__PURE__ */ React.createElement(AddPodcastModal, { onClose: () => setShowAdd(false), onAdd: (pc) => setPodcasts((p) => [{ id: uid(), ...pc }, ...p]) }));
}
var EXERCISE_TYPES = [
  { id: "\u0642\u062F\u0631\u062A\u06CC", mode: "sets" },
  { id: "\u06A9\u0634\u0634\u06CC", mode: "sets" },
  { id: "\u06A9\u0627\u0631\u062F\u06CC\u0648", mode: "duration" },
  { id: "\u062F\u0648\u06CC\u062F\u0646", mode: "duration" }
];
function FitnessProgress({ exercises }) {
  const weekData = [{ day: "\u0634", volume: 240 }, { day: "\u06CC", volume: 300 }, { day: "\u062F", volume: 180 }, { day: "\u0633", volume: 420 }, { day: "\u0686", volume: 260 }, { day: "\u067E", volume: 500 }, { day: "\u062C", volume: 320 }];
  const strengthVolume = exercises.reduce((s, e) => s + (e.mode === "sets" ? e.sets * e.reps : 0), 0);
  const cardioMinutes = exercises.reduce((s, e) => s + (e.mode === "duration" ? e.duration : 0), 0);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement(StatPill, { icon: "dumbbell", label: "\u062D\u062C\u0645 \u0642\u062F\u0631\u062A\u06CC", value: strengthVolume, color: "#C026D3" }), /* @__PURE__ */ React.createElement(StatPill, { icon: "flame", label: "\u062F\u0642\u0627\u06CC\u0642 \u06A9\u0627\u0631\u062F\u06CC\u0648", value: cardioMinutes, color: "#DB2777" })), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u062D\u062C\u0645 \u062A\u0645\u0631\u06CC\u0646 \u0647\u0641\u062A\u06AF\u06CC"), /* @__PURE__ */ React.createElement(SimpleLineChart, { data: weekData, xKey: "day", yKey: "volume", color: "#22D3EE", height: 140 })));
}
function FitnessHub({ exercises, setExercises }) {
  const [sub, setSub] = useState("log");
  const [showAdd, setShowAdd] = useState(false);
  const [moodFor, setMoodFor] = useState(null);
  const streak = 5;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(SubTabs, { value: sub, onChange: setSub, options: [["log", "\u062A\u0645\u0631\u06CC\u0646", "dumbbell"], ["progress", "\u067E\u06CC\u0634\u0631\u0641\u062A", "trending-up"]] }), sub === "log" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(StatPill, { icon: "flame", label: "\u0627\u0633\u062A\u0631\u06CC\u06A9 \u0648\u0631\u0632\u0634", value: `${streak} \u0631\u0648\u0632`, color: "#DB2777" }), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, exercises.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-4" }, "\u0647\u0646\u0648\u0632 \u062A\u0645\u0631\u06CC\u0646\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC"), exercises.map((e) => /* @__PURE__ */ React.createElement("div", { key: e.id, className: "py-2.5 border-b border-white/[0.05] last:border-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const willBeDone = !e.done;
        setExercises((p) => p.map((x) => x.id === e.id ? { ...x, done: willBeDone } : x));
        if (willBeDone) setMoodFor(e.id);
      },
      className: "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
      style: { borderColor: e.done ? "#22D3EE" : "rgba(255,255,255,.25)", background: e.done ? "#22D3EE" : "transparent" }
    },
    e.done && /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 14, color: "#0A0A0A", strokeWidth: 3 })
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: `text-sm ${e.done ? "text-slate-500 line-through" : "text-slate-100"}` }, e.name), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500" }, e.mode === "sets" ? `${e.sets}\xD7${e.reps}` : `${e.duration} \u062F\u0642\u06CC\u0642\u0647`)), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-2 py-1 rounded-md bg-white/[0.05] text-slate-400" }, e.type), /* @__PURE__ */ React.createElement("button", { onClick: () => setExercises((p) => p.filter((x) => x.id !== e.id)), className: "w-6 h-6 rounded-md flex items-center justify-center text-rose-400/80 hover:bg-rose-500/10 shrink-0" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 12 }))), moodFor === e.id && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2 mr-9" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-slate-400" }, "\u062D\u0633 \u0628\u0639\u062F \u0627\u0632 \u062A\u0645\u0631\u06CC\u0646:"), ["\u{1F61E}", "\u{1F610}", "\u{1F642}", "\u{1F4AA}", "\u{1F525}"].map((em, i) => /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => {
    setExercises((p) => p.map((x) => x.id === e.id ? { ...x, mood: i + 1 } : x));
    setMoodFor(null);
  }, className: "text-lg" }, em)))))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAdd(true), className: "w-full rounded-xl py-3 text-sm font-medium text-slate-300 border border-dashed border-white/15 flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15 }), " \u0627\u0641\u0632\u0648\u062F\u0646 \u062A\u0645\u0631\u06CC\u0646")), sub === "progress" && /* @__PURE__ */ React.createElement(FitnessProgress, { exercises }), showAdd && /* @__PURE__ */ React.createElement(AddExerciseModal, { onClose: () => setShowAdd(false), onAdd: (ex) => setExercises((p) => [{ id: uid(), done: false, mood: null, ...ex }, ...p]) }));
}
function AddExerciseModal({ onClose, onAdd }) {
  const [name, setName] = useState(""), [type, setType] = useState("\u0642\u062F\u0631\u062A\u06CC");
  const [sets, setSets] = useState(3), [reps, setReps] = useState(10), [duration, setDuration] = useState(20);
  const mode = EXERCISE_TYPES.find((t2) => t2.id === type).mode;
  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, mode, sets: mode === "sets" ? sets : 0, reps: mode === "sets" ? reps : 0, duration: mode === "duration" ? duration : 0 });
    onClose();
  };
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: "\u062A\u0645\u0631\u06CC\u0646 \u062C\u062F\u06CC\u062F",
      onClose,
      onSubmit: submit,
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: !name.trim(), className: "w-full rounded-xl py-3 font-bold text-sm bg-gradient-to-l from-[#67E8F9] to-[#22D3EE] text-white disabled:opacity-30" }, "\u0627\u0641\u0632\u0648\u062F\u0646")
    },
    /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "\u0646\u0627\u0645 \u062A\u0645\u0631\u06CC\u0646 \u2014 \u0645\u062B\u0644\u0627\u064B \u0628\u0627\u0631\u0641\u06CC\u06A9\u0633" }),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4 flex-wrap" }, EXERCISE_TYPES.map((t2) => /* @__PURE__ */ React.createElement(Chip, { key: t2.id, active: type === t2.id, onClick: () => setType(t2.id) }, t2.id))),
    mode === "sets" ? /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-[11px] mb-1" }, "\u062A\u0639\u062F\u0627\u062F \u0633\u062A"), /* @__PURE__ */ React.createElement("input", { type: "number", value: sets, onChange: (e) => setSets(Number(e.target.value)), className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-[11px] mb-1" }, "\u062A\u06A9\u0631\u0627\u0631 \u062F\u0631 \u0647\u0631 \u0633\u062A"), /* @__PURE__ */ React.createElement("input", { type: "number", value: reps, onChange: (e) => setReps(Number(e.target.value)), className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none" }))) : /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-[11px] mb-1" }, "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 (\u062F\u0642\u06CC\u0642\u0647)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: duration, onChange: (e) => setDuration(Number(e.target.value)), className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none" }))
  );
}
function LearningGoalEditor({ topic, onChange }) {
  const g = topic.goal || {};
  const nowJ = Jalali ? Jalali.toJalaliParts(/* @__PURE__ */ new Date()) : { jy: 1404, jm: 1, jd: 1 };
  const jy = g.targetJy || nowJ.jy, jm = g.targetJm || nowJ.jm, jd = g.targetJd || nowJ.jd;
  const hasTarget = !!g.targetJy;
  const daysLeft = hasTarget && Jalali ? Math.round((Jalali.fromJalaliParts(g.targetJy, g.targetJm, g.targetJd) - /* @__PURE__ */ new Date()) / 864e5) : null;
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u0647\u062F\u0641"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: g.description || "",
      onChange: (e) => onChange({ ...g, description: e.target.value }),
      rows: 2,
      placeholder: "\u0645\u062B\u0644\u0627\u064B: \u062A\u0627 \u067E\u0627\u06CC\u0627\u0646 \u0633\u0627\u0644 \u06A9\u0644 \u062C\u0632\u0621 \u0639\u0645 \u0631\u0648 \u062D\u0641\u0638 \u06A9\u0646\u0645",
      className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none resize-none mb-3"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => onChange(hasTarget ? { ...g, targetJy: null } : { ...g, targetJy: jy, targetJm: jm, targetJd: jd }),
      className: "text-[11px] px-2.5 py-1.5 rounded-lg border",
      style: { borderColor: hasTarget ? "#C026D3" : "rgba(255,255,255,.1)", background: hasTarget ? "rgba(192,38,211,.15)" : "transparent", color: hasTarget ? "#EAB4F2" : "#94a3b8" }
    },
    hasTarget ? "\u062A\u0627\u0631\u06CC\u062E \u0647\u062F\u0641 \u062F\u0627\u0631\u062F" : "+ \u0627\u0641\u0632\u0648\u062F\u0646 \u062A\u0627\u0631\u06CC\u062E \u0647\u062F\u0641 (\u0634\u0645\u0633\u06CC)"
  ), daysLeft !== null && /* @__PURE__ */ React.createElement("span", { className: "text-[11px]", style: { color: daysLeft < 0 ? "#DB2777" : "#22D3EE" } }, daysLeft >= 0 ? `${daysLeft} \u0631\u0648\u0632 \u0645\u0648\u0646\u062F\u0647` : `${-daysLeft} \u0631\u0648\u0632 \u06AF\u0630\u0634\u062A\u0647`)), hasTarget && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2.5" }, /* @__PURE__ */ React.createElement("input", { type: "number", value: jy, onChange: (e) => onChange({ ...g, targetJy: Number(e.target.value) }), className: "w-20 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none" }), /* @__PURE__ */ React.createElement("select", { value: jm, onChange: (e) => onChange({ ...g, targetJm: Number(e.target.value) }), className: "bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none" }, JALALI_MONTHS_FA.map((m, i) => /* @__PURE__ */ React.createElement("option", { key: i, value: i + 1, className: "bg-[#120814]" }, m))), /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", max: "31", value: jd, onChange: (e) => onChange({ ...g, targetJd: Number(e.target.value) }), className: "w-16 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none" })));
}
function LearningRoutineEditor({ topic, onChange }) {
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u0631\u0648\u062A\u06CC\u0646 \u062A\u06A9\u0631\u0627\u0631 \u2014 \u0628\u0631\u0627\u06CC \u0647\u0645\u0647\u200C\u06CC \u0632\u06CC\u0631\u0628\u062E\u0634\u200C\u0647\u0627\u06CC \u0627\u06CC\u0646 \u0645\u0648\u0636\u0648\u0639"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap mb-2" }, RECURRENCE_TYPES.filter(([v]) => v !== "none").map(([v, l]) => /* @__PURE__ */ React.createElement(Chip, { key: v, active: topic.recurrence === v, color: "#22D3EE", onClick: () => onChange({ ...topic, recurrence: v }) }, l))), topic.recurrence === "weekly" && /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 flex-wrap" }, WEEKDAYS.map((w) => /* @__PURE__ */ React.createElement(
    Chip,
    {
      key: w.id,
      active: (topic.recurrenceWeekdays || []).includes(w.id),
      color: "#22D3EE",
      onClick: () => onChange({ ...topic, recurrenceWeekdays: (topic.recurrenceWeekdays || []).includes(w.id) ? topic.recurrenceWeekdays.filter((x) => x !== w.id) : [...topic.recurrenceWeekdays || [], w.id] })
    },
    w.label
  ))), (topic.recurrence === "monthly" || topic.recurrence === "yearly") && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500" }, "\u0631\u0648\u0632 \u062F\u0642\u06CC\u0642 \u062A\u06A9\u0631\u0627\u0631 \u0645\u0627\u0647\u0627\u0646\u0647/\u0633\u0627\u0644\u0627\u0646\u0647 \u0631\u0648 \u0645\u06CC\u200C\u062A\u0648\u0646\u06CC \u0627\u0632 \u062A\u0628 \xAB\u062A\u0633\u06A9\u200C\u0647\u0627\xBB\u060C \u0631\u0648\u06CC \u062A\u0633\u06A9\u0650 \u0647\u0645\u0648\u0646 \u0632\u06CC\u0631\u0628\u062E\u0634\u060C \u062F\u0642\u06CC\u0642\u200C\u062A\u0631 \u062A\u0646\u0638\u06CC\u0645 \u06A9\u0646\u06CC."));
}
function SubsectionCard({ subsection, task, onUpdateSubsection, onDeleteSubsection, onAddProgress }) {
  const [editing, setEditing] = useState(false);
  const [unit, setUnit] = useState(subsection.unit);
  const [target, setTarget] = useState(subsection.target);
  const saveEdit = () => {
    onUpdateSubsection(subsection.id, { unit: unit.trim() || "\u0648\u0627\u062D\u062F", target: Math.max(1, Number(target) || 1) });
    setEditing(false);
  };
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-100" }, subsection.title), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setEditing((v) => !v), className: "text-slate-400 hover:text-fuchsia-300" }, /* @__PURE__ */ React.createElement(Ic, { name: "edit", size: 13 })), /* @__PURE__ */ React.createElement("button", { onClick: () => onDeleteSubsection(subsection.id), className: "text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 13 })))), editing ? /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 items-end" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mb-1" }, "\u0648\u0627\u062D\u062F \u2014 \u0645\u062B\u0644\u0627\u064B \u0635\u0641\u062D\u0647"), /* @__PURE__ */ React.createElement("input", { value: unit, onChange: (e) => setUnit(e.target.value), className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "w-24" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mb-1" }, "\u0647\u062F\u0641 \u06A9\u0644"), /* @__PURE__ */ React.createElement("input", { type: "number", value: target, onChange: (e) => setTarget(e.target.value), className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none" })), /* @__PURE__ */ React.createElement("button", { onClick: saveEdit, className: "px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 text-xs font-medium shrink-0" }, "\u0630\u062E\u06CC\u0631\u0647")) : task ? /* @__PURE__ */ React.createElement(ProgressiveTaskBar, { task, onAddProgress }) : /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600" }, "\u062A\u0633\u06A9 \u0645\u062A\u0646\u0627\u0638\u0631 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F"));
}
function AddSubsectionForm({ onAdd }) {
  const [val, setVal] = useState("");
  return /* @__PURE__ */ React.createElement("form", { className: "flex gap-2 mt-2.5", onSubmit: (e) => {
    e.preventDefault();
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: val,
      onChange: (e) => setVal(e.target.value),
      placeholder: "\u0632\u06CC\u0631\u0628\u062E\u0634 \u062C\u062F\u06CC\u062F \u2014 \u0645\u062B\u0644\u0627\u064B \u0645\u0631\u0648\u0631",
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-3 rounded-lg bg-fuchsia-500/20 text-fuchsia-300" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 14 })));
}
function NewLearningTopicModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const submit = () => {
    if (title.trim()) onAdd(title.trim());
  };
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: "\u0645\u0648\u0636\u0648\u0639 \u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC \u062C\u062F\u06CC\u062F",
      onClose,
      onSubmit: submit,
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: !title.trim(), className: "w-full rounded-xl py-3 font-bold text-sm bg-gradient-to-l from-[#C026D3] to-[#DB2777] text-white disabled:opacity-30" }, "\u0627\u06CC\u062C\u0627\u062F \u0645\u0648\u0636\u0648\u0639")
    },
    /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u0645\u062B\u0644\u0627\u064B \u062D\u0641\u0638 \u0642\u0631\u0622\u0646" })
  );
}
function LearningHub({ projects, setProjects, tasks, onAddProgress, saveTask, deleteTask }) {
  const [activeId, setActiveId] = useState(projects[0]?.id ?? null);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const topic = projects.find((p) => p.id === activeId);
  const updateTopic = (fn) => setProjects((prev) => prev.map((p) => p.id === activeId ? fn(p) : p));
  const subsectionTasks = (t2) => (t2?.subsections || []).map((sec) => tasks.find((tk) => tk.id === sec.linkedTaskId)).filter(Boolean);
  const topicProgress = (t2) => {
    const stasks = subsectionTasks(t2);
    if (!stasks.length) return 0;
    return Math.round(stasks.reduce((s, tk) => s + Math.min(100, tk.progressCurrent / tk.progressTarget * 100), 0) / stasks.length);
  };
  const addSubsection = (title) => {
    if (!topic) return;
    const newTaskId = uid();
    saveTask({
      id: newTaskId,
      title: `${topic.title} \u2014 ${title}`,
      desc: "",
      quad: "q2",
      priority: 2,
      status: "todo",
      completedDate: null,
      daypart: "morning",
      tag: "\u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC",
      time: null,
      duration: 45,
      recurrence: topic.recurrence || "daily",
      reminder: false,
      recurrenceWeekdays: topic.recurrence === "weekly" ? topic.recurrenceWeekdays && topic.recurrenceWeekdays.length ? topic.recurrenceWeekdays : [(/* @__PURE__ */ new Date()).getDay()] : void 0,
      recurrenceDay: topic.recurrence === "monthly" || topic.recurrence === "yearly" ? 1 : void 0,
      recurrenceMonth: topic.recurrence === "yearly" ? 1 : void 0,
      subtasks: [],
      progressType: "progressive",
      progressUnit: "\u0648\u0627\u062D\u062F",
      progressTarget: 10,
      progressCurrent: 0
    });
    updateTopic((p) => ({ ...p, subsections: [...p.subsections, { id: uid(), title, unit: "\u0648\u0627\u062D\u062F", target: 10, linkedTaskId: newTaskId }] }));
  };
  const updateSubsection = (id, patch) => {
    if (!topic) return;
    const sec = topic.subsections.find((s) => s.id === id);
    if (!sec) return;
    updateTopic((p) => ({ ...p, subsections: p.subsections.map((s) => s.id === id ? { ...s, ...patch } : s) }));
    const linkedTask = tasks.find((tk) => tk.id === sec.linkedTaskId);
    if (linkedTask) saveTask({ ...linkedTask, progressUnit: patch.unit ?? linkedTask.progressUnit, progressTarget: patch.target ?? linkedTask.progressTarget });
  };
  const deleteSubsection = (id) => {
    if (!topic) return;
    const sec = topic.subsections.find((s) => s.id === id);
    updateTopic((p) => ({ ...p, subsections: p.subsections.filter((s) => s.id !== id) }));
    if (sec && sec.linkedTaskId) deleteTask(sec.linkedTaskId);
  };
  if (!topic) {
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(GlassCard, { className: "p-8 flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "graduation-cap", size: 26, className: "text-fuchsia-300 mb-2" }), /* @__PURE__ */ React.createElement("p", { className: "text-slate-300 text-sm" }, "\u0647\u0646\u0648\u0632 \u0645\u0648\u0636\u0648\u0639 \u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC \u0646\u0633\u0627\u062E\u062A\u06CC")), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNewTopic(true), className: "w-full rounded-xl py-3 text-sm font-medium text-slate-300 border border-dashed border-white/15 flex items-center justify-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15 }), " \u0645\u0648\u0636\u0648\u0639 \u062C\u062F\u06CC\u062F"), showNewTopic && /* @__PURE__ */ React.createElement(NewLearningTopicModal, { onClose: () => setShowNewTopic(false), onAdd: (title) => {
      const p = { id: uid(), title, subsections: [], goal: {}, recurrence: "daily", recurrenceWeekdays: [] };
      setProjects([p]);
      setActiveId(p.id);
      setShowNewTopic(false);
    } }));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1" }, projects.map((p) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      onClick: () => setActiveId(p.id),
      className: "shrink-0 rounded-xl px-3 py-2 text-xs font-medium border",
      style: { borderColor: p.id === activeId ? "#C026D3" : "rgba(255,255,255,.1)", background: p.id === activeId ? "rgba(192,38,211,.15)" : "rgba(255,255,255,.03)", color: p.id === activeId ? "#EAB4F2" : "#94a3b8" }
    },
    p.title
  )), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNewTopic(true), className: "shrink-0 w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15, className: "text-slate-400" }))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-white" }, topic.title), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-fuchsia-300 font-bold" }, topicProgress(topic), "%"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    topic.subsections.forEach((s) => s.linkedTaskId && deleteTask(s.linkedTaskId));
    setProjects((prev) => prev.filter((p) => p.id !== topic.id));
    setActiveId(null);
  }, className: "text-rose-400/80 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 14 })))), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 rounded-full bg-white/[0.08] overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full", style: { width: `${topicProgress(topic)}%`, background: "linear-gradient(90deg,#C026D3,#22D3EE)" } }))), /* @__PURE__ */ React.createElement(LearningGoalEditor, { topic, onChange: (goal) => updateTopic((p) => ({ ...p, goal })) }), /* @__PURE__ */ React.createElement(LearningRoutineEditor, { topic, onChange: (next) => updateTopic(() => next) }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u0632\u06CC\u0631\u0628\u062E\u0634\u200C\u0647\u0627"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, topic.subsections.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600" }, "\u0647\u0646\u0648\u0632 \u0632\u06CC\u0631\u0628\u062E\u0634\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC \u2014 \u0645\u062B\u0644\u0627\u064B \xAB\u062A\u062B\u0628\u06CC\u062A\xBB\u060C \xAB\u0645\u0631\u0648\u0631\xBB\u060C \xAB\u062D\u0641\u0638\xBB"), topic.subsections.map((sec) => /* @__PURE__ */ React.createElement(
    SubsectionCard,
    {
      key: sec.id,
      subsection: sec,
      task: tasks.find((tk) => tk.id === sec.linkedTaskId),
      onUpdateSubsection: updateSubsection,
      onDeleteSubsection: deleteSubsection,
      onAddProgress
    }
  ))), /* @__PURE__ */ React.createElement(AddSubsectionForm, { onAdd: addSubsection })), showNewTopic && /* @__PURE__ */ React.createElement(NewLearningTopicModal, { onClose: () => setShowNewTopic(false), onAdd: (title) => {
    const p = { id: uid(), title, subsections: [], goal: {}, recurrence: "daily", recurrenceWeekdays: [] };
    setProjects((prev) => [...prev, p]);
    setActiveId(p.id);
    setShowNewTopic(false);
  } }));
}
function todayKey() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = ["\u06CC", "\u062F", "\u0633", "\u0686", "\u067E", "\u062C", "\u0634"][d.getDay()];
    out.push({ key, label });
  }
  return out;
}
function getPersianDateLabel(now) {
  try {
    const dayNames = ["\u06CC\u06A9\u0634\u0646\u0628\u0647", "\u062F\u0648\u0634\u0646\u0628\u0647", "\u0633\u0647\u200C\u0634\u0646\u0628\u0647", "\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647", "\u067E\u0646\u062C\u0634\u0646\u0628\u0647", "\u062C\u0645\u0639\u0647", "\u0634\u0646\u0628\u0647"];
    const dayName = dayNames[now.getDay()];
    const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long" });
    return `${dayName}\u060C ${formatter.format(now)}`;
  } catch (e) {
    return now.toLocaleDateString("fa-IR");
  }
}
function GroupCard({ group, onAddTask, onToggleTask, onDeleteTask, onDeleteGroup }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState(2);
  const submit = () => {
    if (!taskTitle.trim()) return;
    onAddTask({ id: uid(), title: taskTitle.trim(), priority, done: false });
    setTaskTitle("");
  };
  const done = group.tasks.filter((t2) => t2.done).length;
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-100 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Ic, { name: "location", size: 13, className: "text-fuchsia-300" }), group.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, done, "/", group.tasks.length), /* @__PURE__ */ React.createElement("button", { onClick: onDeleteGroup, className: "text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 12 })))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 mb-2" }, group.tasks.map((t2) => /* @__PURE__ */ React.createElement("div", { key: t2.id, className: "flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/[0.03] border border-white/[0.06]" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onToggleTask(t2.id),
      className: "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
      style: { borderColor: t2.done ? "#22D3EE" : "rgba(255,255,255,.25)", background: t2.done ? "#22D3EE" : "transparent" }
    },
    t2.done && /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 9, color: "#0A0A0A", strokeWidth: 3 })
  ), /* @__PURE__ */ React.createElement("span", { className: `text-xs flex-1 truncate ${t2.done ? "text-slate-500 line-through" : "text-slate-200"}` }, t2.title), /* @__PURE__ */ React.createElement(PriorityBars, { level: t2.priority }), /* @__PURE__ */ React.createElement("button", { onClick: () => onDeleteTask(t2.id), className: "shrink-0 text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 11 }))))), /* @__PURE__ */ React.createElement("form", { className: "flex items-center gap-1.5", onSubmit: (e) => {
    e.preventDefault();
    submit();
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: taskTitle,
      onChange: (e) => setTaskTitle(e.target.value),
      placeholder: "\u06A9\u0627\u0631 \u062C\u062F\u06CC\u062F \u062A\u0648\u06CC \u0627\u06CC\u0646 \u0628\u062E\u0634...",
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, PRIORITIES.map((p) => /* @__PURE__ */ React.createElement(Chip, { key: p.level, active: priority === p.level, color: "#DB2777", onClick: () => setPriority(p.level) }, p.level))), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "shrink-0 px-2.5 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 13 }))));
}
function DaypartSection({ id, label, groups, onChange }) {
  const [open, setOpen] = useState(true);
  const [groupName, setGroupName] = useState("");
  const addGroup = () => {
    if (!groupName.trim()) return;
    onChange([...groups, { id: uid(), name: groupName.trim(), tasks: [] }]);
    setGroupName("");
  };
  const updateGroup = (gid, fn) => onChange(groups.map((g) => g.id === gid ? fn(g) : g));
  const deleteGroup = (gid) => onChange(groups.filter((g) => g.id !== gid));
  const totalTasks = groups.reduce((s, g) => s + g.tasks.length, 0);
  const doneTasks = groups.reduce((s, g) => s + g.tasks.filter((t2) => t2.done).length, 0);
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "overflow-hidden" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOpen((v) => !v), className: "w-full flex items-center justify-between px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-100 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Ic, { name: { morning: "sunrise", noon: "sun", evening: "sunset", night: "moon" }[id], size: 16 }), " ", label), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-slate-500" }, doneTasks, "/", totalTasks, " \xB7 ", open ? "\u25B2" : "\u25BC")), open && /* @__PURE__ */ React.createElement("div", { className: "px-3 pb-3 space-y-2.5" }, groups.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600 px-1" }, "\u0647\u0646\u0648\u0632 \u0628\u062E\u0634\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC \u2014 \u0645\u062B\u0644\u0627\u064B \xAB\u06A9\u062A\u0627\u0628\u062E\u0627\u0646\u0647\xBB \u06CC\u0627 \xAB\u062E\u0648\u0646\u0647\xBB"), groups.map((g) => /* @__PURE__ */ React.createElement(
    GroupCard,
    {
      key: g.id,
      group: g,
      onAddTask: (t2) => updateGroup(g.id, (gr) => ({ ...gr, tasks: [...gr.tasks, t2] })),
      onToggleTask: (tid) => updateGroup(g.id, (gr) => ({ ...gr, tasks: gr.tasks.map((t2) => t2.id === tid ? { ...t2, done: !t2.done } : t2) })),
      onDeleteTask: (tid) => updateGroup(g.id, (gr) => ({ ...gr, tasks: gr.tasks.filter((t2) => t2.id !== tid) })),
      onDeleteGroup: () => deleteGroup(g.id)
    }
  )), /* @__PURE__ */ React.createElement("form", { className: "flex gap-2", onSubmit: (e) => {
    e.preventDefault();
    addGroup();
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: groupName,
      onChange: (e) => setGroupName(e.target.value),
      placeholder: "\u0628\u062E\u0634 \u062C\u062F\u06CC\u062F \u2014 \u0645\u062B\u0644\u0627\u064B \u06A9\u062A\u0627\u0628\u062E\u0627\u0646\u0647",
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-3 rounded-lg bg-fuchsia-500/20 text-fuchsia-300" }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 14 })))));
}
function GoalsView({ goals, setGoals }) {
  const [hoursInput, setHoursInput] = useState(String(goals.log[todayKey()] || ""));
  const days = lastNDays(7);
  const max = Math.max(goals.targetHours, ...days.map((d) => goals.log[d.key] || 0), 1);
  const saveTarget = (v) => setGoals((g) => ({ ...g, targetHours: v }));
  const logToday = () => {
    const h = Number(hoursInput);
    if (isNaN(h) || h < 0) return;
    setGoals((g) => ({ ...g, log: { ...g.log, [todayKey()]: h } }));
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mb-2" }, "\u0647\u062F\u0641 \u0645\u0637\u0627\u0644\u0639\u0647\u200C\u06CC \u0631\u0648\u0632\u0627\u0646\u0647 (\u0633\u0627\u0639\u062A)"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [1, 1.5, 2, 3, 4].map((h) => /* @__PURE__ */ React.createElement(Chip, { key: h, active: goals.targetHours === h, color: "#22D3EE", onClick: () => saveTarget(h) }, h, " \u0633\u0627\u0639\u062A")))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mb-2" }, "\u0627\u0645\u0631\u0648\u0632 \u0686\u0642\u062F\u0631 \u0645\u0637\u0627\u0644\u0639\u0647 \u06A9\u0631\u062F\u06CC\u061F"), /* @__PURE__ */ React.createElement("form", { className: "flex gap-2", onSubmit: (e) => {
    e.preventDefault();
    logToday();
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      step: "0.5",
      value: hoursInput,
      onChange: (e) => setHoursInput(e.target.value),
      placeholder: "\u0645\u062B\u0644\u0627\u064B 2",
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-5 rounded-xl bg-gradient-to-l from-[#22D3EE] to-[#C026D3] text-white text-sm font-bold" }, "\u062B\u0628\u062A")), goals.log[todayKey()] !== void 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] mt-2", style: { color: goals.log[todayKey()] >= goals.targetHours ? "#22D3EE" : "#DB2777" } }, goals.log[todayKey()] >= goals.targetHours ? "\u2714\uFE0F \u0627\u0645\u0631\u0648\u0632 \u0628\u0647 \u0647\u062F\u0641\u062A \u0631\u0633\u06CC\u062F\u06CC" : `\u0647\u0646\u0648\u0632 ${(goals.targetHours - goals.log[todayKey()]).toFixed(1)} \u0633\u0627\u0639\u062A \u0645\u0648\u0646\u062F\u0647`)), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-3" }, "\u0633\u0627\u0639\u062A \u0645\u0637\u0627\u0644\u0639\u0647 \u2014 \u06F7 \u0631\u0648\u0632 \u0627\u062E\u06CC\u0631 (\u0647\u062F\u0641: ", goals.targetHours, " \u0633\u0627\u0639\u062A)"), /* @__PURE__ */ React.createElement("div", { style: { height: 140 }, className: "flex items-end gap-2 px-1" }, days.map((d) => {
    const val = goals.log[d.key] || 0;
    const hit = val >= goals.targetHours;
    return /* @__PURE__ */ React.createElement("div", { key: d.key, className: "flex-1 flex flex-col items-center justify-end gap-1.5 h-full" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-500" }, val || ""), /* @__PURE__ */ React.createElement("div", { className: "w-full rounded-t-md", style: { height: `${Math.max(val / max * 100, val > 0 ? 6 : 2)}%`, background: val === 0 ? "rgba(255,255,255,.08)" : hit ? "#22D3EE" : "#DB2777" } }), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-500" }, d.label));
  }))));
}
function PlanningHub({ planning, setPlanning, goals, setGoals }) {
  const [sub, setSub] = useState("plan");
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(SubTabs, { value: sub, onChange: setSub, options: [["plan", "\u0628\u0631\u0646\u0627\u0645\u0647 \u0631\u0648\u0632\u0627\u0646\u0647"], ["goals", "\u0627\u0647\u062F\u0627\u0641", "trending-up"]] }), sub === "plan" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, DAYPARTS.map((dp) => /* @__PURE__ */ React.createElement(
    DaypartSection,
    {
      key: dp.id,
      id: dp.id,
      label: dp.label,
      groups: planning[dp.id] || [],
      onChange: (groups) => setPlanning((p) => ({ ...p, [dp.id]: groups }))
    }
  ))), sub === "goals" && /* @__PURE__ */ React.createElement(GoalsView, { goals, setGoals }));
}
function WeeklyOverviewChart({ goals, tasks }) {
  const days = lastNDays(7);
  const studySeries = days.map((d) => goals.log[d.key] || 0);
  const todayTasks = tasks.filter((t2) => t2.status === "done").length;
  const taskSeries = [3, 4, 2, 5, todayTasks, 6, todayTasks].map((v, i) => i === 4 || i === 6 ? todayTasks : v);
  const exerciseSeries = [1, 0, 1, 1, 0, 1, 1];
  const gid = useId();
  const w = 640, h = 220, padX = 30, padY = 20;
  const maxVal = Math.max(...studySeries, ...taskSeries, 6, 1);
  const stepX = (w - padX * 2) / (days.length - 1);
  const yFor = (v) => h - padY - v / maxVal * (h - padY * 2);
  const ptsFor = (series2) => series2.map((v, i) => [padX + i * stepX, yFor(v)]);
  const series = [
    { data: studySeries, color: "#22D3EE", label: "\u0633\u0627\u0639\u062A \u0645\u0637\u0627\u0644\u0639\u0647" },
    { data: taskSeries, color: "#C026D3", label: "\u062A\u0633\u06A9 \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647" },
    { data: exerciseSeries, color: "#DB2777", label: "\u062C\u0644\u0633\u0647\u200C\u06CC \u062A\u0645\u0631\u06CC\u0646" }
  ];
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4 flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-200" }, "\u0646\u0645\u0627\u06CC \u06A9\u0644\u06CC \u0647\u0641\u062A\u0647"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, series.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "flex items-center gap-1.5 text-[11px] text-slate-300 rounded-full px-2.5 py-1 border border-white/[0.06]", style: { background: `${s.color}14` } }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { background: s.color, boxShadow: `0 0 6px ${s.color}` } }), " ", s.label)))), /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: h }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: `weekarea-${gid}`, x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: series[0].color, stopOpacity: "0.35" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: series[0].color, stopOpacity: "0" }))), [0.25, 0.5, 0.75, 1].map((f) => /* @__PURE__ */ React.createElement("line", { key: f, x1: padX, x2: w - padX, y1: h - padY - f * (h - padY * 2), y2: h - padY - f * (h - padY * 2), stroke: "rgba(255,255,255,.06)" })), (() => {
    const pts = ptsFor(series[0].data);
    const line = smoothSvgPath(pts);
    const area = `${line} L ${pts[pts.length - 1][0]} ${h - padY} L ${pts[0][0]} ${h - padY} Z`;
    return /* @__PURE__ */ React.createElement("path", { d: area, fill: `url(#weekarea-${gid})`, stroke: "none" });
  })(), series.map((s) => {
    const pts = ptsFor(s.data);
    return /* @__PURE__ */ React.createElement("g", { key: s.label }, /* @__PURE__ */ React.createElement("path", { d: smoothSvgPath(pts), fill: "none", stroke: s.color, strokeWidth: "2.5", strokeLinejoin: "round", strokeLinecap: "round", pathLength: "100", className: "chart-line-draw", style: { filter: `drop-shadow(0 0 4px ${s.color}99)` } }), pts.map(([x, y], i) => /* @__PURE__ */ React.createElement("circle", { key: i, cx: x, cy: y, r: "3.5", fill: "#0A0A0A", stroke: s.color, strokeWidth: "2" })));
  }), days.map((d, i) => /* @__PURE__ */ React.createElement("text", { key: d.key, x: padX + i * stepX, y: h - 2, textAnchor: "middle", fontSize: "10", fill: "#64748b" }, d.label))));
}
var BACKUPS_KEY = "lifeflow_backups_v1";
var MAX_BACKUP_BYTES = 3 * 1024 * 1024;
var BACKUP_DATA_KEYS = ["tasks", "books", "videos", "podcasts", "exercises", "projects", "planning", "goals", "journal", "pomodoro"];
function loadBackupsList() {
  try {
    const raw = storage.get(BACKUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveBackupsList(list) {
  try {
    storage.set(BACKUPS_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}
function validateBackupShape(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "\u0627\u06CC\u0646 \u0641\u0627\u06CC\u0644 \u06CC\u06A9 \u0628\u06A9\u0627\u067E \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A (\u0633\u0627\u062E\u062A\u0627\u0631 JSON \u062F\u0631\u0633\u062A\u06CC \u0646\u062F\u0627\u0631\u0647).";
  }
  const hasKnownKey = BACKUP_DATA_KEYS.some((k) => k in parsed);
  if (!hasKnownKey) {
    return "\u0627\u06CC\u0646 \u0641\u0627\u06CC\u0644 \u0634\u0628\u06CC\u0647 \u0628\u06A9\u0627\u067E \u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645 \u0646\u06CC\u0633\u062A \u2014 \u0647\u06CC\u0686\u200C\u06A9\u062F\u0648\u0645 \u0627\u0632 \u0628\u062E\u0634\u200C\u0647\u0627\u06CC \u0622\u0634\u0646\u0627 (\u062A\u0633\u06A9\u060C \u06A9\u062A\u0627\u0628\u060C ...) \u062A\u0648\u0634 \u0646\u0628\u0648\u062F.";
  }
  return null;
}
function humanFileSize(bytes) {
  if (bytes < 1024) return `${bytes} \u0628\u0627\u06CC\u062A`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} \u06A9\u06CC\u0644\u0648\u0628\u0627\u06CC\u062A`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A`;
}
function formatBackupDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
  } catch (e) {
    return iso;
  }
}
function BackupModal({ onClose, currentData, onRestore, onDownload }) {
  const [backups, setBackups] = useState(() => loadBackupsList());
  const [selectedId, setSelectedId] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = React.useRef(null);
  const [syncCfg, setSyncCfg] = useState(() => {
    const cfg = loadSyncConfig();
    if (!cfg.code) cfg.code = genSyncCode();
    return cfg;
  });
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncErr, setSyncErr] = useState("");
  const [confirmPull, setConfirmPull] = useState(false);
  useEffect(() => {
    saveSyncConfig(syncCfg);
  }, [syncCfg]);
  const copyCode = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(syncCfg.code).catch(() => {
    });
    setSyncMsg("\u06A9\u062F \u06A9\u067E\u06CC \u0634\u062F.");
    setTimeout(() => setSyncMsg(""), 1500);
  };
  const pushToCloud = async () => {
    setSyncErr("");
    setSyncMsg("");
    setSyncBusy(true);
    try {
      const res = await fetch(`${syncCfg.url.replace(/\/$/, "")}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: syncCfg.code, data: currentData })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 (${res.status})`);
      setSyncMsg("\u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0631\u0648\u06CC \u0641\u0636\u0627\u06CC \u0627\u0628\u0631\u06CC \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F. \u2705");
    } catch (e) {
      setSyncErr(e.message === "Failed to fetch" ? "\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 Worker \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F \u2014 \u0622\u062F\u0631\u0633 \u0631\u0648 \u0686\u06A9 \u06A9\u0646." : e.message);
    } finally {
      setSyncBusy(false);
    }
  };
  const pullFromCloud = async () => {
    setSyncErr("");
    setSyncMsg("");
    setSyncBusy(true);
    try {
      const res = await fetch(`${syncCfg.url.replace(/\/$/, "")}/sync?code=${encodeURIComponent(syncCfg.code)}`);
      if (res.status === 404) throw new Error("\u0647\u0646\u0648\u0632 \u062F\u0627\u062F\u0647\u200C\u0627\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u06A9\u062F \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F\u0647 \u2014 \u0627\u0648\u0644 \u0627\u0632 \u06CC\u0647 \u062F\u0633\u062A\u06AF\u0627\u0647 \u062F\u06CC\u06AF\u0647 \xAB\u0627\u0631\u0633\u0627\u0644\xBB \u0628\u0632\u0646.");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `\u062E\u0637\u0627\u06CC \u0633\u0631\u0648\u0631 (${res.status})`);
      const result = await res.json();
      onRestore(result.data);
      setSyncMsg("\u062F\u0627\u062F\u0647\u200C\u0647\u0627 \u0627\u0632 \u0641\u0636\u0627\u06CC \u0627\u0628\u0631\u06CC \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u06CC \u0634\u062F. \u2705");
      setConfirmPull(false);
      setTimeout(() => {
        onClose();
      }, 1100);
    } catch (e) {
      setSyncErr(e.message === "Failed to fetch" ? "\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 Worker \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F \u2014 \u0622\u062F\u0631\u0633 \u0631\u0648 \u0686\u06A9 \u06A9\u0646." : e.message);
    } finally {
      setSyncBusy(false);
    }
  };
  const persist = (list) => {
    setBackups(list);
    const ok = saveBackupsList(list);
    if (!ok) setError("\u062D\u0627\u0641\u0638\u0647\u200C\u06CC \u0645\u0631\u0648\u0631\u06AF\u0631 \u067E\u0631\u0647 \u2014 \u06CC\u0647 \u0628\u06A9\u0627\u067E \u0642\u062F\u06CC\u0645\u06CC \u0631\u0648 \u062D\u0630\u0641 \u06A9\u0646 \u0648 \u062F\u0648\u0628\u0627\u0631\u0647 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646.");
  };
  const addBackupEntry = (name, source, data) => {
    const entry = { id: uid(), name, source, createdAt: (/* @__PURE__ */ new Date()).toISOString(), data };
    const next = [entry, ...backups];
    persist(next);
    setSuccess(source === "upload" ? "\u0628\u06A9\u0627\u067E \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0622\u067E\u0644\u0648\u062F \u0634\u062F." : "\u0646\u0633\u062E\u0647\u200C\u06CC \u0641\u0639\u0644\u06CC \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F.");
    setError("");
  };
  const handleFile = (file) => {
    setError("");
    setSuccess("");
    if (!file) return;
    const looksLikeJson = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
    if (!looksLikeJson) {
      setError("\u0641\u0642\u0637 \u0641\u0627\u06CC\u0644 JSON \u0642\u0627\u0628\u0644 \u0642\u0628\u0648\u0644\u0647.");
      return;
    }
    if (file.size > MAX_BACKUP_BYTES) {
      setError(`\u062D\u062C\u0645 \u0641\u0627\u06CC\u0644 \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632\u0647 (\u062D\u062F\u0627\u06A9\u062B\u0631 ${humanFileSize(MAX_BACKUP_BYTES)}).`);
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        setUploading(false);
        setError("\u0641\u0627\u06CC\u0644 \u0642\u0627\u0628\u0644 \u062E\u0648\u0646\u062F\u0646 \u0646\u06CC\u0633\u062A \u2014 \u06CC\u0647 JSON \u062E\u0631\u0627\u0628 \u06CC\u0627 \u0646\u0627\u0642\u0635\u0647.");
        return;
      }
      const shapeError = validateBackupShape(parsed);
      if (shapeError) {
        setUploading(false);
        setError(shapeError);
        return;
      }
      addBackupEntry(file.name.replace(/\.json$/i, ""), "upload", parsed);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      setError("\u062E\u0637\u0627 \u062F\u0631 \u062E\u0648\u0646\u062F\u0646 \u0641\u0627\u06CC\u0644.");
    };
    reader.readAsText(file);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  };
  const saveCurrentAsBackup = () => {
    const name = `\u0646\u0633\u062E\u0647\u200C\u06CC ${(/* @__PURE__ */ new Date()).toLocaleDateString("fa-IR")}`;
    addBackupEntry(name, "manual", currentData);
  };
  const deleteBackup = (id) => {
    persist(backups.filter((b) => b.id !== id));
    if (String(selectedId) === String(id)) setSelectedId("");
  };
  const [restored, setRestored] = useState(false);
  const restoreSelected = () => {
    const backup = backups.find((b) => String(b.id) === String(selectedId));
    if (!backup) return;
    onRestore(backup.data);
    setConfirming(false);
    setRestored(true);
    setSuccess("\u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u06CC \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.");
    setTimeout(() => {
      onClose();
    }, 1100);
  };
  return /* @__PURE__ */ React.createElement(ModalShell, { title: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u0628\u06A9\u0627\u067E", onClose }, /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-3.5 mb-5" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-2" }, /* @__PURE__ */ React.createElement(Ic, { name: "cloud", size: 14 }), " \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0627\u0628\u0631\u06CC (Cloudflare)"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 mb-3 leading-5" }, "\u0622\u062F\u0631\u0633 Worker \u062E\u0648\u062F\u062A \u0631\u0648 \u06CC\u0647 \u0628\u0627\u0631 \u0648\u0627\u0631\u062F \u06A9\u0646\u060C \u0628\u0639\u062F \u0628\u0627 \u0647\u0645\u06CC\u0646 \xAB\u06A9\u062F \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC\xBB \u062A\u0648 \u0647\u0631 \u062F\u0633\u062A\u06AF\u0627\u0647 \u062F\u06CC\u06AF\u0647\u200C\u0627\u06CC \u06A9\u0647 \u0627\u06CC\u0646 \u06A9\u062F \u0631\u0648 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u060C \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u062A \u0631\u0648 \u0645\u06CC\u200C\u06AF\u06CC\u0631\u06CC."), /* @__PURE__ */ React.createElement("label", { className: "block text-[11px] text-slate-500 mb-1" }, "\u0622\u062F\u0631\u0633 Worker"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "url",
      placeholder: "https://lifeflow-sync.your-name.workers.dev",
      value: syncCfg.url,
      onChange: (e) => setSyncCfg((c) => ({ ...c, url: e.target.value.trim() })),
      className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none mb-3",
      dir: "ltr"
    }
  ), /* @__PURE__ */ React.createElement("label", { className: "block text-[11px] text-slate-500 mb-1" }, "\u06A9\u062F \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: syncCfg.code,
      onChange: (e) => setSyncCfg((c) => ({ ...c, code: e.target.value.toUpperCase() })),
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none font-mono tracking-wider",
      dir: "ltr"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: copyCode, className: "w-9 h-9 shrink-0 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "copy", size: 14 }))), syncErr && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-rose-400 mb-2" }, syncErr), syncMsg && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-emerald-400 mb-2" }, syncMsg), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: syncBusy || !syncCfg.url,
      onClick: pushToCloud,
      className: "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white disabled:opacity-40",
      style: { background: "linear-gradient(135deg,#22D3EE,#0891B2)" }
    },
    /* @__PURE__ */ React.createElement(Ic, { name: "upload", size: 13 }),
    " \u0627\u0631\u0633\u0627\u0644 \u0628\u0647 \u0627\u0628\u0631"
  ), !confirmPull ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: syncBusy || !syncCfg.url,
      onClick: () => setConfirmPull(true),
      className: "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-cyan-300 bg-white/[0.05] border border-white/10 disabled:opacity-40"
    },
    /* @__PURE__ */ React.createElement(Ic, { name: "download", size: 13 }),
    " \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0632 \u0627\u0628\u0631"
  ) : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: syncBusy,
      onClick: pullFromCloud,
      className: "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold text-white bg-rose-500/80"
    },
    "\u0645\u0637\u0645\u0626\u0646\u06CC\u061F (\u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0645\u06CC\u200C\u0634\u0647)"
  ))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onDownload, className: "w-full flex items-center justify-center gap-2 rounded-xl py-3 mb-4 text-sm font-semibold bg-white/[0.05] border border-white/10 hover:bg-white/10 transition" }, /* @__PURE__ */ React.createElement(Ic, { name: "download", size: 15 }), " \u062F\u0627\u0646\u0644\u0648\u062F \u0628\u06A9\u0627\u067E \u0641\u0639\u0644\u06CC"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: saveCurrentAsBackup, className: "w-full flex items-center justify-center gap-2 rounded-xl py-3 mb-5 text-sm font-semibold text-white transition", style: { background: "linear-gradient(135deg,#22D3EE,#C026D3)" } }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 15 }), " \u0630\u062E\u06CC\u0631\u0647\u200C\u06CC \u0646\u0633\u062E\u0647\u200C\u06CC \u0641\u0639\u0644\u06CC"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mb-2" }, "\u0622\u067E\u0644\u0648\u062F \u0641\u0627\u06CC\u0644 \u0628\u06A9\u0627\u067E"), /* @__PURE__ */ React.createElement(
    "div",
    {
      onDragOver: (e) => {
        e.preventDefault();
        setDragActive(true);
      },
      onDragLeave: () => setDragActive(false),
      onDrop,
      onClick: () => fileInputRef.current && fileInputRef.current.click(),
      className: "w-full border border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition mb-2",
      style: { borderColor: dragActive ? "#C026D3" : "rgba(255,255,255,.15)", background: dragActive ? "rgba(192,38,211,.08)" : "transparent" }
    },
    /* @__PURE__ */ React.createElement(Ic, { name: "folder", size: 22, className: "text-slate-400" }),
    /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-300" }, "\u0641\u0627\u06CC\u0644 \u0628\u06A9\u0627\u067E (.json) \u0631\u0648 \u0628\u06A9\u0634 \u0627\u06CC\u0646\u062C\u0627\u060C \u06CC\u0627 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646"),
    /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500" }, "\u062D\u062F\u0627\u06A9\u062B\u0631 ", humanFileSize(MAX_BACKUP_BYTES)),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "application/json,.json",
        className: "hidden",
        onChange: (e) => handleFile(e.target.files && e.target.files[0])
      }
    )
  ), uploading && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-cyan-300 mb-3" }, "\u062F\u0631 \u062D\u0627\u0644 \u0628\u0631\u0631\u0633\u06CC \u0641\u0627\u06CC\u0644..."), error && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-400 mb-3" }, error), success && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-cyan-300 mb-3" }, success), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-4 mb-2" }, "\u0628\u06A9\u0627\u067E\u200C\u0647\u0627\u06CC \u0630\u062E\u06CC\u0631\u0647\u200C\u0634\u062F\u0647 (", backups.length, ")"), backups.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600 mb-3" }, "\u0647\u0646\u0648\u0632 \u0628\u06A9\u0627\u067E\u06CC \u0622\u067E\u0644\u0648\u062F \u06CC\u0627 \u0630\u062E\u06CC\u0631\u0647 \u0646\u06A9\u0631\u062F\u06CC."), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 mb-4 max-h-40 overflow-y-auto" }, backups.map((b) => /* @__PURE__ */ React.createElement("div", { key: b.id, className: "flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/[0.03] border border-white/[0.06]" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] px-1.5 py-0.5 rounded-md shrink-0", style: { background: b.source === "upload" ? "rgba(34,211,238,.15)" : "rgba(192,38,211,.15)", color: b.source === "upload" ? "#22D3EE" : "#EAB4F2" } }, b.source === "upload" ? "\u0622\u067E\u0644\u0648\u062F\u0634\u062F\u0647" : "\u062F\u0633\u062A\u06CC"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 truncate" }, b.name), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500" }, formatBackupDate(b.createdAt))), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => deleteBackup(b.id), className: "shrink-0 text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 13 }))))), backups.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mb-2" }, "\u0627\u0646\u062A\u062E\u0627\u0628 \u0646\u0633\u062E\u0647 \u0628\u0631\u0627\u06CC \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u06CC"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedId,
      onChange: (e) => {
        setSelectedId(e.target.value);
        setConfirming(false);
      },
      className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 outline-none"
    },
    /* @__PURE__ */ React.createElement("option", { value: "", className: "bg-[#120814]" }, "\u2014 \u06CC\u06A9\u06CC \u0631\u0648 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646 \u2014"),
    backups.map((b) => /* @__PURE__ */ React.createElement("option", { key: b.id, value: b.id, className: "bg-[#120814]" }, b.name, " \u2014 ", formatBackupDate(b.createdAt)))
  ), restored ? /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4 flex items-center gap-2 justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 16, className: "text-cyan-300" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-cyan-300" }, "\u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u06CC \u0634\u062F \u2014 \u062F\u0631 \u062D\u0627\u0644 \u0628\u0633\u062A\u0646...")) : !confirming ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      disabled: !selectedId,
      onClick: () => setConfirming(true),
      className: "w-full rounded-xl py-3 font-bold text-sm bg-white/[0.05] border border-white/10 disabled:opacity-30"
    },
    "\u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u06CC \u0627\u06CC\u0646 \u0646\u0633\u062E\u0647"
  ) : /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-rose-400/30 bg-rose-500/5 p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-300 mb-3" }, "\u0645\u0637\u0645\u0626\u0646\u06CC\u061F \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0641\u0639\u0644\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0646\u0633\u062E\u0647 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0645\u06CC\u200C\u0634\u0646 (\u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0628\u0631\u06AF\u0634\u062A\u200C\u067E\u0630\u06CC\u0631 \u0646\u06CC\u0633\u062A\u060C \u0645\u06AF\u0631 \u0627\u06CC\u0646\u06A9\u0647 \u0627\u0644\u0627\u0646 \u06CC\u0647 \u0628\u06A9\u0627\u067E \u0627\u0632 \u0648\u0636\u0639\u06CC\u062A \u0641\u0639\u0644\u06CC \u0628\u06AF\u06CC\u0631\u06CC)."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setConfirming(false), className: "flex-1 rounded-lg py-2 text-xs font-medium bg-white/[0.05] border border-white/10" }, "\u0627\u0646\u0635\u0631\u0627\u0641"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: restoreSelected, className: "flex-1 rounded-lg py-2 text-xs font-bold text-white bg-rose-500" }, "\u0628\u0644\u0647\u060C \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646")))));
}
function SettingsModal({ onClose, settings, onChangeSettings }) {
  const [aiCfg, setAiCfg] = useState(() => loadAiConfig());
  const lang = settings.language;
  const updateAi = (patch) => {
    setAiCfg((c) => {
      const next = { ...c, ...patch };
      saveAiConfig(next);
      return next;
    });
  };
  return /* @__PURE__ */ React.createElement(ModalShell, { title: t("settings", lang), onClose }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, t("appearance", lang)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-5" }, [["dark", "dark_mode", "moon"], ["light", "light_mode", "sun"]].map(([id, key, icon]) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: id,
      type: "button",
      onClick: () => onChangeSettings({ ...settings, theme: id }),
      className: "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border transition-colors",
      style: { borderColor: settings.theme === id ? "#C026D3" : "rgba(255,255,255,.1)", background: settings.theme === id ? "rgba(192,38,211,.15)" : "rgba(255,255,255,.03)", color: settings.theme === id ? "#EAB4F2" : "#94a3b8" }
    },
    /* @__PURE__ */ React.createElement(Ic, { name: icon, size: 15 }),
    " ",
    t(key, lang)
  ))), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, t("language", lang)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mb-5" }, LANGUAGES.map((l) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: l.id,
      type: "button",
      onClick: () => onChangeSettings({ ...settings, language: l.id }),
      className: "rounded-xl py-2.5 text-sm font-medium border transition-colors",
      style: { borderColor: settings.language === l.id ? "#22D3EE" : "rgba(255,255,255,.1)", background: settings.language === l.id ? "rgba(34,211,238,.14)" : "rgba(255,255,255,.03)", color: settings.language === l.id ? "#67E8F9" : "#94a3b8" }
    },
    l.label
  ))), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u0627\u0639\u0644\u0627\u0646\u200C\u0647\u0627"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-5" }, [
    ["taskReminders", "\u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u062A\u0633\u06A9\u200C\u0647\u0627 (\u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC\u200C\u0634\u062F\u0647 \u0628\u0627 \u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u0631\u0648\u0634\u0646)"],
    ["pomodoroEnd", "\u067E\u0627\u06CC\u0627\u0646 \u062C\u0644\u0633\u0647\u200C\u06CC \u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648"],
    ["learningDeadlines", "\u0646\u0632\u062F\u06CC\u06A9\u200C\u0634\u062F\u0646 \u0628\u0647 \u062A\u0627\u0631\u06CC\u062E \u0647\u062F\u0641\u0650 \u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC (\u06F3 \u0631\u0648\u0632 \u0645\u0648\u0646\u062F\u0647)"],
    ["dailyDigest", "\u062E\u0644\u0627\u0635\u0647\u200C\u06CC \u0635\u0628\u062D\u06AF\u0627\u0647\u06CC \u062A\u0639\u062F\u0627\u062F \u062A\u0633\u06A9\u200C\u0647\u0627\u06CC \u0627\u0645\u0631\u0648\u0632"]
  ].map(([key, label]) => {
    const on = settings.notifications ? settings.notifications[key] : true;
    return /* @__PURE__ */ React.createElement("div", { key, className: "flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-300" }, label), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => onChangeSettings({ ...settings, notifications: { ...settings.notifications || DEFAULT_NOTIFICATIONS, [key]: !on } }),
        className: "w-10 h-5 rounded-full relative transition-colors shrink-0",
        style: { background: on ? "#C026D3" : "rgba(255,255,255,.15)" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", style: { right: on ? 20 : 2 } })
    ));
  })), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, t("ai_provider_section", lang)), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 mb-3 leading-5" }, t("ai_provider_hint", lang)), /* @__PURE__ */ React.createElement("label", { className: "block text-[11px] text-slate-500 mb-1" }, t("ai_provider", lang)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 flex-wrap mb-3" }, AI_PROVIDERS.map((p) => /* @__PURE__ */ React.createElement(Chip, { key: p.id, active: aiCfg.provider === p.id, color: "#22D3EE", onClick: () => updateAi({ provider: p.id }) }, p.label))), /* @__PURE__ */ React.createElement("label", { className: "block text-[11px] text-slate-500 mb-1" }, t("api_key", lang)), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "password",
      autoComplete: "off",
      placeholder: "sk-...",
      value: aiCfg.apiKey,
      onChange: (e) => updateAi({ apiKey: e.target.value.trim() }),
      className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs outline-none mb-1",
      dir: "ltr"
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-600 mb-2" }, "\u0627\u06CC\u0646 \u06A9\u0644\u06CC\u062F \u0641\u0642\u0637 \u062A\u0648 localStorage \u0647\u0645\u06CC\u0646 \u0645\u0631\u0648\u0631\u06AF\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u0634\u0647 \u0648 \u0628\u0647 \u0647\u06CC\u0686 \u0633\u0631\u0648\u0631\u06CC \u063A\u06CC\u0631 \u0627\u0632 \u0647\u0645\u0648\u0646 \u0627\u0631\u0627\u0626\u0647\u200C\u062F\u0647\u0646\u062F\u0647 \u0627\u0631\u0633\u0627\u0644 \u0646\u0645\u06CC\u200C\u0634\u0647."));
}
var NOTE_COLORS = ["#C026D3", "#22D3EE", "#F59E0B", "#10B981", "#DB2777", "#3B82F6"];
function NewListModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  return /* @__PURE__ */ React.createElement(
    ModalShell,
    {
      title: "\u0644\u06CC\u0633\u062A \u062C\u062F\u06CC\u062F",
      onClose,
      onSubmit: () => {
        if (title.trim()) {
          onCreate(title.trim());
          onClose();
        }
      },
      footer: /* @__PURE__ */ React.createElement("button", { type: "submit", disabled: !title.trim(), className: "w-full rounded-xl py-3 font-bold text-sm text-white disabled:opacity-30", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)" } }, "\u0633\u0627\u062E\u062A \u0644\u06CC\u0633\u062A")
    },
    /* @__PURE__ */ React.createElement(TextInput, { autoFocus: true, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "\u0645\u062B\u0644\u0627\u064B \u06A9\u062A\u0627\u0628\u200C\u0647\u0627\u06CC\u06CC \u06A9\u0647 \u0645\u06CC\u200C\u062E\u0648\u0627\u0645 \u0628\u062E\u0648\u0646\u0645" })
  );
}
function NoteListCard({ list, onUpdate, onDelete }) {
  const [newItem, setNewItem] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(list.title);
  const addItem = () => {
    if (!newItem.trim()) return;
    onUpdate({ ...list, items: [...list.items, { id: uid(), text: newItem.trim(), done: false }] });
    setNewItem("");
  };
  const toggleItem = (id) => onUpdate({ ...list, items: list.items.map((it) => it.id === id ? { ...it, done: !it.done } : it) });
  const deleteItem = (id) => onUpdate({ ...list, items: list.items.filter((it) => it.id !== id) });
  const saveTitle = () => {
    onUpdate({ ...list, title: titleDraft.trim() || list.title });
    setEditingTitle(false);
  };
  const doneCount = list.items.filter((i) => i.done).length;
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4 flex flex-col", style: { borderTop: `2.5px solid ${list.color}` } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2 mb-2.5" }, editingTitle ? /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      value: titleDraft,
      onChange: (e) => setTitleDraft(e.target.value),
      onBlur: saveTitle,
      onKeyDown: (e) => e.key === "Enter" && saveTitle(),
      className: "flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none"
    }
  ) : /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-100 flex-1 cursor-pointer", onClick: () => {
    setTitleDraft(list.title);
    setEditingTitle(true);
  } }, list.title), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(list.id), className: "shrink-0 text-slate-500 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 14 }))), list.items.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mb-2" }, doneCount, " \u0627\u0632 ", list.items.length, " \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 mb-2.5 flex-1" }, list.items.map((it) => /* @__PURE__ */ React.createElement("div", { key: it.id, className: "flex items-center gap-2 group" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => toggleItem(it.id),
      className: "w-4 h-4 shrink-0 rounded-md border flex items-center justify-center",
      style: { borderColor: it.done ? list.color : "rgba(255,255,255,.25)", background: it.done ? list.color : "transparent" }
    },
    it.done && /* @__PURE__ */ React.createElement(Ic, { name: "check", size: 11, color: "#fff" })
  ), /* @__PURE__ */ React.createElement("span", { className: `text-xs flex-1 ${it.done ? "line-through text-slate-500" : "text-slate-200"}` }, it.text), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteItem(it.id), className: "opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 shrink-0" }, /* @__PURE__ */ React.createElement(Ic, { name: "x", size: 12 })))), list.items.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600 text-center py-2" }, "\u0686\u06CC\u0632\u06CC \u062A\u0648 \u0627\u06CC\u0646 \u0644\u06CC\u0633\u062A \u0646\u06CC\u0633\u062A")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 pt-2 border-t border-white/[0.06]" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: newItem,
      onChange: (e) => setNewItem(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && addItem(),
      placeholder: "+ \u0627\u0641\u0632\u0648\u062F\u0646 \u0645\u0648\u0631\u062F",
      className: "flex-1 bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none py-1"
    }
  ), newItem && /* @__PURE__ */ React.createElement("button", { onClick: addItem }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 14, color: list.color }))));
}
function NoteListsBoard({ noteLists, setNoteLists }) {
  const [showNew, setShowNew] = useState(false);
  const createList = (title) => {
    const color = NOTE_COLORS[noteLists.length % NOTE_COLORS.length];
    setNoteLists((p) => [{ id: uid(), title, color, createdAt: Date.now(), items: [] }, ...p]);
  };
  const updateList = (updated) => setNoteLists((p) => p.map((l) => l.id === updated.id ? updated : l));
  const deleteList = (id) => setNoteLists((p) => p.filter((l) => l.id !== id));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(true), className: "w-full flex items-center justify-center gap-2 rounded-xl py-3 mb-4 text-sm font-bold text-white", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)", boxShadow: "0 6px 20px rgba(192,38,211,.3)" } }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 16 }), " \u0644\u06CC\u0633\u062A \u062C\u062F\u06CC\u062F"), noteLists.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-8" }, "\u0647\u0646\u0648\u0632 \u0644\u06CC\u0633\u062A\u06CC \u0646\u0633\u0627\u062E\u062A\u06CC \u2014 \u0645\u062B\u0644\u0627\u064B \xAB\u06A9\u062A\u0627\u0628\u200C\u0647\u0627\u06CC \u0645\u06CC\u200C\u062E\u0648\u0627\u0645 \u0628\u062E\u0648\u0646\u0645\xBB \u06CC\u0627 \xAB\u062E\u0631\u06CC\u062F\xBB \u0628\u0633\u0627\u0632"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" }, noteLists.map((list) => /* @__PURE__ */ React.createElement(NoteListCard, { key: list.id, list, onUpdate: updateList, onDelete: deleteList }))), showNew && /* @__PURE__ */ React.createElement(NewListModal, { onClose: () => setShowNew(false), onCreate: createList }));
}
function JournalFullView({ journal, setJournal }) {
  var _a;
  const [text, setText] = useState("");
  const addEntry = () => {
    if (!text.trim()) return;
    setJournal((prev) => [{ id: uid(), date: todayKey(), text: text.trim(), createdAt: Date.now() }, ...prev]);
    setText("");
  };
  const deleteEntry = (id) => setJournal((prev) => prev.filter((e) => e.id !== id));
  const byDate = {};
  for (const e of journal) (byDate[_a = e.date] || (byDate[_a] = [])).push(e);
  const dates = Object.keys(byDate).sort().reverse();
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4 mb-4" }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: text,
      onChange: (e) => setText(e.target.value),
      rows: 3,
      placeholder: "\u0627\u0645\u0631\u0648\u0632 \u0686\u0637\u0648\u0631 \u0628\u0648\u062F\u061F \u0686\u06CC \u06CC\u0627\u062F \u06AF\u0631\u0641\u062A\u06CC\u061F \u0686\u0647 \u062D\u0633\u06CC \u062F\u0627\u0634\u062A\u06CC\u061F...",
      className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none resize-none mb-2.5"
    }
  ), /* @__PURE__ */ React.createElement("button", { onClick: addEntry, disabled: !text.trim(), className: "w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-30", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)" } }, "\u062B\u0628\u062A \u06CC\u0627\u062F\u062F\u0627\u0634\u062A")), journal.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-8" }, "\u0647\u0646\u0648\u0632 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u06CC \u0646\u0646\u0648\u0634\u062A\u06CC"), dates.map((d) => /* @__PURE__ */ React.createElement("div", { key: d, className: "mb-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-fuchsia-300 mb-2" }, d), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, byDate[d].map((e) => /* @__PURE__ */ React.createElement(GlassCard, { key: e.id, className: "p-3.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 leading-relaxed whitespace-pre-wrap flex-1" }, e.text), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteEntry(e.id), className: "shrink-0 text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 12 })))))))));
}
function NotesHub({ noteLists, setNoteLists, journal, setJournal, lang }) {
  const [sub, setSub] = useState("lists");
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
    SubTabs,
    {
      options: [["lists", t("notes_lists", lang), "check-square"], ["journal", t("notes_journal", lang), "book"]],
      value: sub,
      onChange: setSub
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "mt-4" }, sub === "lists" && /* @__PURE__ */ React.createElement(NoteListsBoard, { noteLists, setNoteLists }), sub === "journal" && /* @__PURE__ */ React.createElement(JournalFullView, { journal, setJournal })));
}
function JournalCard({ journal, setJournal }) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const addEntry = () => {
    if (!text.trim()) return;
    const entry = { id: uid(), date: todayKey(), text: text.trim(), createdAt: Date.now() };
    setJournal((prev) => [entry, ...prev]);
    setText("");
  };
  const deleteEntry = (id) => setJournal((prev) => prev.filter((e) => e.id !== id));
  const visible = expanded ? journal : journal.slice(0, 3);
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement(Ic, { name: "book", size: 16, className: "text-fuchsia-300" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-200" }, "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0631\u0648\u0632")), /* @__PURE__ */ React.createElement("form", { className: "mb-3", onSubmit: (e) => {
    e.preventDefault();
    addEntry();
  } }, /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: text,
      onChange: (e) => setText(e.target.value),
      rows: 3,
      placeholder: "\u0627\u0645\u0631\u0648\u0632 \u0686\u0637\u0648\u0631 \u0628\u0648\u062F\u061F \u0686\u06CC \u06CC\u0627\u062F \u06AF\u0631\u0641\u062A\u06CC\u061F \u0686\u0647 \u062D\u0633\u06CC \u062F\u0627\u0634\u062A\u06CC\u061F...",
      className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none resize-none focus:border-fuchsia-400/50 mb-2"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !text.trim(),
      className: "w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-30 transition",
      style: { background: "linear-gradient(135deg,#C026D3,#DB2777)" }
    },
    "\u062B\u0628\u062A \u06CC\u0627\u062F\u062F\u0627\u0634\u062A"
  )), journal.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600 text-center py-2" }, "\u0647\u0646\u0648\u0632 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u06CC \u0646\u0646\u0648\u0634\u062A\u06CC") : /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, visible.map((e) => /* @__PURE__ */ React.createElement("div", { key: e.id, className: "rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-200 leading-relaxed whitespace-pre-wrap flex-1" }, e.text), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteEntry(e.id), className: "shrink-0 text-rose-400/70 hover:text-rose-400" }, /* @__PURE__ */ React.createElement(Ic, { name: "trash", size: 12 }))), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mt-1.5" }, e.date))), journal.length > 3 && /* @__PURE__ */ React.createElement("button", { onClick: () => setExpanded((v) => !v), className: "w-full text-[11px] text-fuchsia-300 text-center py-1" }, expanded ? "\u0646\u0645\u0627\u06CC\u0634 \u06A9\u0645\u062A\u0631" : `${journal.length - 3} \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0642\u062F\u06CC\u0645\u06CC\u200C\u062A\u0631 \u062F\u06CC\u06AF\u0647`)));
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function PomodoroTimerView({ pomodoro, setPomodoro, tasks, onAddProgress, onToggle, notifSettings }) {
  const { settings } = pomodoro;
  const [mode, setMode] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(settings.work * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [taskId, setTaskId] = useState("");
  const [askProgress, setAskProgress] = useState(null);
  const [progressInput, setProgressInput] = useState("");
  const startedAtRef = useRef(null);
  const durations = { work: settings.work, short: settings.shortBreak, long: settings.longBreak };
  const activeTasks = tasks.filter((t2) => t2.status !== "done");
  const activeTask = tasks.find((t2) => t2.id === taskId);
  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      finishSession(true);
      return;
    }
    const iv = setInterval(() => setSecondsLeft((s) => s - 1), 1e3);
    return () => clearInterval(iv);
  }, [running, secondsLeft]);
  const logSession = (completed) => {
    const entry = {
      id: uid(),
      type: mode,
      taskId: mode === "work" ? taskId || null : null,
      startedAt: startedAtRef.current,
      durationMin: durations[mode],
      completedAt: completed ? (/* @__PURE__ */ new Date()).toISOString() : null,
      interrupted: !completed
    };
    setPomodoro((p) => ({ ...p, sessions: [entry, ...p.sessions] }));
    return entry;
  };
  const finishSession = (completed) => {
    setRunning(false);
    const entry = logSession(completed);
    if (completed && typeof Notification !== "undefined" && Notification.permission === "granted" && notifSettings && notifSettings.pomodoroEnd !== false) {
      try {
        new Notification(mode === "work" ? "\u23F0 \u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648 \u062A\u0645\u0627\u0645 \u0634\u062F" : "\u23F0 \u0627\u0633\u062A\u0631\u0627\u062D\u062A \u062A\u0645\u0627\u0645 \u0634\u062F", { body: mode === "work" ? "\u0648\u0642\u062A \u0627\u0633\u062A\u0631\u0627\u062D\u062A\u0647" : "\u0628\u0631\u06AF\u0631\u062F \u0633\u0631 \u06A9\u0627\u0631" });
      } catch (e) {
      }
    }
    if (completed && mode === "work" && activeTask && activeTask.progressType === "progressive") {
      setAskProgress(entry);
    }
    if (completed && mode === "work") {
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      const nextMode = nextCycle % settings.cyclesUntilLong === 0 ? "long" : "short";
      setMode(nextMode);
      setSecondsLeft(durations[nextMode] * 60);
    } else if (completed) {
      setMode("work");
      setSecondsLeft(durations.work * 60);
    } else {
      setSecondsLeft(durations[mode] * 60);
    }
  };
  const start = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {
    });
    startedAtRef.current = (/* @__PURE__ */ new Date()).toISOString();
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setSecondsLeft(durations[mode] * 60);
  };
  const skip = () => {
    if (running || secondsLeft < durations[mode] * 60) logSession(false);
    const next = mode === "work" ? "short" : "work";
    setMode(next);
    setSecondsLeft(durations[next] * 60);
    setRunning(false);
  };
  const switchMode = (m) => {
    setRunning(false);
    setMode(m);
    setSecondsLeft(durations[m] * 60);
  };
  const submitProgress = () => {
    const n = Number(progressInput);
    if (askProgress && askProgress.taskId && n > 0) onAddProgress(askProgress.taskId, n);
    setAskProgress(null);
    setProgressInput("");
  };
  const total = durations[mode] * 60;
  const pct = Math.round((total - secondsLeft) / total * 100);
  const modeColor = mode === "work" ? "#DB2777" : mode === "short" ? "#22D3EE" : "#C026D3";
  const r = 84, circumference = 2 * Math.PI * r;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, [["work", t("pomodoro_work", "fa")], ["short", t("pomodoro_short_break", "fa")], ["long", t("pomodoro_long_break", "fa")]].map(([m, label]) => /* @__PURE__ */ React.createElement(Chip, { key: m, active: mode === m, color: m === "work" ? "#DB2777" : m === "short" ? "#22D3EE" : "#C026D3", onClick: () => switchMode(m) }, label))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-6 flex flex-col items-center" }, /* @__PURE__ */ React.createElement("svg", { width: 200, height: 200, viewBox: "0 0 200 200" }, /* @__PURE__ */ React.createElement("circle", { cx: "100", cy: "100", r, fill: "none", stroke: "rgba(255,255,255,.08)", strokeWidth: "12" }), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "100",
      cy: "100",
      r,
      fill: "none",
      stroke: modeColor,
      strokeWidth: "12",
      strokeLinecap: "round",
      strokeDasharray: circumference,
      strokeDashoffset: circumference * (1 - pct / 100),
      transform: "rotate(-90 100 100)",
      style: { filter: `drop-shadow(0 0 8px ${modeColor}88)`, transition: "stroke-dashoffset .3s linear" }
    }
  ), /* @__PURE__ */ React.createElement("text", { x: "100", y: "94", textAnchor: "middle", fontSize: "34", fontWeight: "800", fill: "#fff" }, pad2(Math.floor(secondsLeft / 60)), ":", pad2(secondsLeft % 60)), /* @__PURE__ */ React.createElement("text", { x: "100", y: "118", textAnchor: "middle", fontSize: "11", fill: "#94a3b8" }, "\u062F\u0648\u0631 ", cycle + 1)), /* @__PURE__ */ React.createElement("div", { className: "w-full mt-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mb-1.5" }, t("pomodoro_assign_task", "fa")), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: taskId,
      onChange: (e) => setTaskId(e.target.value),
      disabled: running,
      className: "w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none disabled:opacity-50"
    },
    /* @__PURE__ */ React.createElement("option", { value: "", className: "bg-[#120814]" }, t("pomodoro_no_task", "fa")),
    activeTasks.map((tk) => /* @__PURE__ */ React.createElement("option", { key: tk.id, value: tk.id, className: "bg-[#120814]" }, tk.title, tk.progressType === "progressive" ? ` (${tk.progressCurrent || 0}/${tk.progressTarget} ${tk.progressUnit})` : ""))
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 w-full mt-4" }, !running ? /* @__PURE__ */ React.createElement("button", { onClick: start, className: "flex-1 rounded-xl py-3 font-bold text-sm text-white", style: { background: `linear-gradient(135deg,${modeColor},#C026D3)` } }, t("pomodoro_start", "fa")) : /* @__PURE__ */ React.createElement("button", { onClick: pause, className: "flex-1 rounded-xl py-3 font-bold text-sm bg-white/[0.08] text-white" }, t("pomodoro_pause", "fa")), /* @__PURE__ */ React.createElement("button", { onClick: reset, className: "px-4 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300" }, /* @__PURE__ */ React.createElement(Ic, { name: "repeat", size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: skip, className: "px-4 rounded-xl bg-white/[0.05] border border-white/10 text-slate-300 text-xs font-medium" }, t("pomodoro_skip", "fa")))), askProgress && /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-200 mb-2" }, "\u0627\u06CC\u0646 \u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648 \u0686\u0642\u062F\u0631 \u0631\u0648 \xAB", activeTask?.title, "\xBB \u067E\u06CC\u0634\u0631\u0641\u062A \u06A9\u0631\u062F\u06CC\u061F"), /* @__PURE__ */ React.createElement("form", { className: "flex gap-2", onSubmit: (e) => {
    e.preventDefault();
    submitProgress();
  } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      type: "number",
      min: "0",
      value: progressInput,
      onChange: (e) => setProgressInput(e.target.value),
      placeholder: `\u062A\u0639\u062F\u0627\u062F ${activeTask?.progressUnit || ""}`,
      className: "flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "px-5 rounded-xl bg-gradient-to-l from-[#22D3EE] to-[#C026D3] text-white text-sm font-bold" }, "\u062B\u0628\u062A"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setAskProgress(null), className: "px-4 rounded-xl bg-white/[0.05] border border-white/10 text-slate-400 text-sm" }, "\u0631\u062F \u0634\u062F\u0646"))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-3" }, t("pomodoro_settings", "fa")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2" }, [["work", "\u06A9\u0627\u0631 (\u062F)"], ["shortBreak", "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0648\u062A\u0627\u0647"], ["longBreak", "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u0628\u0644\u0646\u062F"]].map(([key, label]) => /* @__PURE__ */ React.createElement("div", { key }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mb-1" }, label), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      min: "1",
      value: settings[key],
      disabled: running,
      onChange: (e) => setPomodoro((p) => ({ ...p, settings: { ...p.settings, [key]: Math.max(1, Number(e.target.value) || 1) } })),
      className: "w-full bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm outline-none disabled:opacity-50"
    }
  ))))));
}
function PomodoroReportView({ pomodoro, tasks }) {
  const stats = pomodoroStatsFor(pomodoro.sessions, 7);
  const chartData = stats.keys.map((k, i) => ({ day: lastNDays(7)[i].label, count: stats.byDay[k] }));
  const perTaskRows = Object.entries(stats.perTask).map(([tid, minutes]) => ({
    name: tasks.find((t2) => t2.id === Number(tid) || t2.id === tid)?.title || "\u0628\u062F\u0648\u0646 \u062A\u0633\u06A9",
    minutes
  })).sort((a, b) => b.minutes - a.minutes).slice(0, 8);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement(StatPill, { icon: "clock", label: "\u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648\u06CC \u0627\u0645\u0631\u0648\u0632", value: stats.todayCount, color: "#DB2777" }), /* @__PURE__ */ React.createElement(StatPill, { icon: "flame", label: "\u062F\u0642\u06CC\u0642\u0647\u200C\u06CC \u0627\u0645\u0631\u0648\u0632", value: stats.todayMinutes, color: "#22D3EE" })), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-2" }, "\u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648\u06CC \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647 \u2014 \u06F7 \u0631\u0648\u0632 \u0627\u062E\u06CC\u0631"), /* @__PURE__ */ React.createElement(SimpleBarChart, { data: chartData, xKey: "day", yKey: "count", color: "#DB2777", height: 140 })), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-300 mb-3" }, "\u0632\u0645\u0627\u0646 \u0635\u0631\u0641\u200C\u0634\u062F\u0647 \u0628\u0647 \u062A\u0641\u06A9\u06CC\u06A9 \u062A\u0633\u06A9"), perTaskRows.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-600" }, "\u0647\u0646\u0648\u0632 \u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648\u06CC\u06CC \u0628\u0627 \u062A\u0633\u06A9 \u062B\u0628\u062A \u0646\u0634\u062F\u0647"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, perTaskRows.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "flex justify-between text-xs text-slate-300" }, /* @__PURE__ */ React.createElement("span", { className: "truncate flex-1" }, r.name), /* @__PURE__ */ React.createElement("span", { className: "text-fuchsia-300 font-bold shrink-0 mr-2" }, r.minutes, " \u062F"))))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 text-center" }, "\u0645\u062C\u0645\u0648\u0639 \u06A9\u0644: ", stats.totalMinutes, " \u062F\u0642\u06CC\u0642\u0647 \u062F\u0631 ", pomodoro.sessions.filter((s) => s.type === "work" && s.completedAt).length, " \u067E\u0648\u0645\u0648\u062F\u0648\u0631\u0648\u06CC \u06A9\u0627\u0645\u0644\u200C\u0634\u062F\u0647"));
}
function PomodoroHub({ pomodoro, setPomodoro, tasks, onAddProgress, onToggle, lang, notifSettings }) {
  const [sub, setSub] = useState("timer");
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(SubTabs, { value: sub, onChange: setSub, options: [["timer", t("pomodoro_timer", lang), "clock"], ["report", t("pomodoro_report", lang), "trending-up"]] }), sub === "timer" && /* @__PURE__ */ React.createElement(PomodoroTimerView, { pomodoro, setPomodoro, tasks, onAddProgress, onToggle, notifSettings }), sub === "report" && /* @__PURE__ */ React.createElement(PomodoroReportView, { pomodoro, tasks }));
}
var CAL_HOURS = Array.from({ length: 36 }, (_, i) => 6 * 60 + i * 30);
function minutesToHHMM(mins) {
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}
function timeToMinutes(hhmm) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return h * 60 + m;
}
function CalendarHeader({ view, cursor, onPrev, onNext, onToday, onView }) {
  let title = "";
  if (Jalali) {
    if (view === "day") title = Jalali.formatJalali(cursor);
    else if (view === "week") {
      const start = Jalali.jalaliStartOfWeek(cursor), end = Jalali.addDays(start, 6);
      title = `${Jalali.formatJalali(start, { weekday: false, year: false })} \u062A\u0627 ${Jalali.formatJalali(end, { weekday: false })}`;
    } else if (view === "month") {
      const { jy, jm } = Jalali.toJalaliParts(cursor);
      title = `${JALALI_MONTHS_FA[jm - 1]} ${jy}`;
    } else if (view === "year") {
      title = `\u0633\u0627\u0644 ${Jalali.toJalaliParts(cursor).jy}`;
    }
  }
  return /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3 flex items-center justify-between flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("button", { onClick: onPrev, className: "w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "chevron-right", size: 15 })), /* @__PURE__ */ React.createElement("button", { onClick: onToday, className: "px-3 h-8 rounded-lg bg-white/[0.06] text-xs text-slate-300 font-medium" }, "\u0627\u0645\u0631\u0648\u0632"), /* @__PURE__ */ React.createElement("button", { onClick: onNext, className: "w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "chevron-left", size: 15 }))), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-100" }, title), /* @__PURE__ */ React.createElement("div", { className: "flex bg-white/[0.05] border border-white/10 rounded-xl p-0.5" }, [["day", "\u0631\u0648\u0632"], ["week", "\u0647\u0641\u062A\u0647"], ["month", "\u0645\u0627\u0647"], ["year", "\u0633\u0627\u0644"]].map(([v, l]) => /* @__PURE__ */ React.createElement("button", { key: v, onClick: () => onView(v), className: `px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${view === v ? "bg-white/10 text-white" : "text-slate-400"}` }, l))));
}
function DayPlannerView({ cursor, tasks, onSchedule, onToggle, onDelete, onEdit }) {
  const dayTasks = tasks.filter((tsk) => isTaskDueOn(tsk, cursor));
  const unscheduled = dayTasks.filter((tsk) => !tsk.time);
  const scheduled = dayTasks.filter((tsk) => tsk.time);
  const rowH = 26;
  const topFor = (hhmm) => (timeToMinutes(hhmm) - 360) / 30 * rowH;
  const [dragId, setDragId] = useState(null);
  const [livePreview, setLivePreview] = useState({});
  const dropAt = (mins) => {
    if (dragId == null) return;
    const tsk = tasks.find((x) => String(x.id) === String(dragId));
    if (!tsk) return;
    onSchedule(tsk.id, minutesToHHMM(Math.max(360, Math.min(1410, mins))), tsk.duration || 45);
    setDragId(null);
  };
  const startMove = (e, tsk) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    const startMins = timeToMinutes(tsk.time);
    const onMove = (ev) => {
      const deltaMin = Math.round((ev.clientY - startY) / rowH * 30 / 5) * 5;
      const newMins = Math.max(360, Math.min(1410, startMins + deltaMin));
      setLivePreview((p) => ({ ...p, [tsk.id]: { time: minutesToHHMM(newMins), duration: tsk.duration } }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setLivePreview((p) => {
        const preview = p[tsk.id];
        if (preview) onSchedule(tsk.id, preview.time, preview.duration);
        const { [tsk.id]: _drop, ...rest } = p;
        return rest;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const startResize = (e, tsk) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDuration = tsk.duration;
    const onMove = (ev) => {
      const deltaMin = Math.round((ev.clientY - startY) / rowH * 30 / 5) * 5;
      const newDuration = Math.max(5, startDuration + deltaMin);
      setLivePreview((p) => ({ ...p, [tsk.id]: { time: tsk.time, duration: newDuration } }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setLivePreview((p) => {
        const preview = p[tsk.id];
        if (preview) onSchedule(tsk.id, preview.time, preview.duration);
        const { [tsk.id]: _drop, ...rest } = p;
        return rest;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, unscheduled.length > 0 && /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 mb-2" }, "\u062A\u0633\u06A9\u200C\u0647\u0627\u06CC \u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC\u200C\u0646\u0634\u062F\u0647 \u2014 \u0628\u06A9\u0634 \u0648 \u0631\u0648\u06CC \u0633\u0627\u0639\u062A \u0645\u0648\u0631\u062F\u0646\u0638\u0631 \u0631\u0647\u0627 \u06A9\u0646"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, unscheduled.map((tsk) => {
    const q = QUADRANTS.find((x) => x.id === tsk.quad) || QUADRANTS[1];
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: tsk.id,
        draggable: true,
        onDragStart: () => setDragId(tsk.id),
        onDragEnd: () => setDragId(null),
        onClick: () => onEdit(tsk),
        className: "cursor-grab active:cursor-grabbing px-2.5 py-1.5 rounded-lg text-[11px] border",
        style: { borderColor: `${q.color}55`, background: `${q.color}18`, color: q.color }
      },
      tsk.title
    );
  }))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 mb-2" }, "\u0648\u0633\u0637 \u0628\u0644\u0648\u06A9 \u0631\u0648 \u0628\u06A9\u0634 \u0628\u0631\u0627\u06CC \u062C\u0627\u0628\u0647\u200C\u062C\u0627\u06CC\u06CC\u061B \u0644\u0628\u0647\u200C\u06CC \u067E\u0627\u06CC\u06CC\u0646\u0634 \u0631\u0648 \u0628\u06A9\u0634 \u0628\u0631\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0645\u062F\u062A \u2014 \u0647\u0631 \u0645\u0642\u062F\u0627\u0631\u06CC\u060C \u062D\u062A\u06CC \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u06CC\u06A9 \u0633\u0627\u0639\u062A"), /* @__PURE__ */ React.createElement("div", { className: "relative", style: { height: CAL_HOURS.length * rowH }, onDragOver: (e) => e.preventDefault() }, CAL_HOURS.map((mins) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: mins,
      onDragOver: (e) => e.preventDefault(),
      onDrop: () => dropAt(mins),
      className: "absolute left-0 right-0 flex items-start gap-2",
      style: { top: topFor(minutesToHHMM(mins)), height: rowH }
    },
    mins % 60 === 0 && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 w-9 shrink-0" }, pad2(mins / 60), ":\u06F0\u06F0"),
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 border-t border-white/[0.04]", style: { marginRight: mins % 60 === 0 ? 0 : 44 } })
  )), scheduled.map((tsk) => {
    const q = QUADRANTS.find((x) => x.id === tsk.quad) || QUADRANTS[1];
    const preview = livePreview[tsk.id];
    const liveTime = preview ? preview.time : tsk.time;
    const liveDur = preview ? preview.duration : tsk.duration;
    const h = Math.max(liveDur / 30 * rowH, rowH * 0.7);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: tsk.id,
        onMouseDown: (e) => startMove(e, tsk),
        onClick: () => onEdit(tsk),
        className: "absolute right-1 rounded-lg px-2 py-1 overflow-hidden cursor-grab active:cursor-grabbing group select-none",
        style: { top: topFor(liveTime), height: h, left: 46, background: `${q.color}22`, borderRight: `3px solid ${q.color}`, opacity: tsk.status === "done" ? 0.5 : 1, userSelect: "none" }
      },
      /* @__PURE__ */ React.createElement("p", { className: `text-[10px] font-medium truncate ${tsk.status === "done" ? "line-through" : ""}`, style: { color: q.color } }, tsk.title),
      /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-400" }, liveTime, " \xB7 ", liveDur, "\u062F", liveDur > 60 ? ` (${Math.floor(liveDur / 60)}\u0633\u0627\u0639\u062A${liveDur % 60 ? ` ${liveDur % 60}\u062F` : ""})` : ""),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          onMouseDown: (e) => startResize(e, tsk),
          className: "absolute left-0 right-0 bottom-0 h-2.5 cursor-ns-resize flex items-center justify-center",
          style: { touchAction: "none" }
        },
        /* @__PURE__ */ React.createElement("div", { className: "w-6 h-0.5 rounded-full bg-white/40" })
      )
    );
  }))));
}
function WeekView({ cursor, tasks, onJumpDay }) {
  if (!Jalali) return null;
  const start = Jalali.jalaliStartOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => Jalali.addDays(start, i));
  return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-1.5" }, days.map((d) => {
    const due = tasks.filter((tsk) => isTaskDueOn(tsk, d));
    const done = due.filter((tsk) => tsk.status === "done").length;
    const isToday = Jalali.isSameJalaliDay(d, /* @__PURE__ */ new Date());
    return /* @__PURE__ */ React.createElement("button", { key: d.toISOString(), onClick: () => onJumpDay(d), className: "text-right" }, /* @__PURE__ */ React.createElement(GlassCard, { className: `p-2 h-24 flex flex-col ${isToday ? "" : ""}` }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500" }, WEEKDAY_SHORT_ORDER[days.indexOf(d)] || ""), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold", style: { color: isToday ? "#EAB4F2" : "#e2e8f0" } }, Jalali.toJalaliParts(d).jd), /* @__PURE__ */ React.createElement("div", { className: "mt-auto flex flex-wrap gap-0.5" }, due.slice(0, 6).map((tsk) => /* @__PURE__ */ React.createElement("span", { key: tsk.id, className: "w-1.5 h-1.5 rounded-full", style: { background: QUADRANTS.find((q) => q.id === tsk.quad)?.color, opacity: tsk.status === "done" ? 0.35 : 1 } }))), due.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-500 mt-1" }, done, "/", due.length)));
  }));
}
var WEEKDAY_SHORT_ORDER = ["\u0634", "\u06CC", "\u062F", "\u0633", "\u0686", "\u067E", "\u062C"];
function MonthView({ cursor, tasks, onJumpDay }) {
  if (!Jalali) return null;
  const grid = Jalali.jalaliMonthGrid(cursor);
  const { jm: curJm } = Jalali.toJalaliParts(cursor);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-1 mb-1.5" }, WEEKDAY_SHORT_ORDER.map((w) => /* @__PURE__ */ React.createElement("p", { key: w, className: "text-center text-[10px] text-slate-500" }, w))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 gap-1" }, grid.map((d) => {
    const { jm, jd } = Jalali.toJalaliParts(d);
    const inMonth = jm === curJm;
    const due = tasks.filter((tsk) => isTaskDueOn(tsk, d));
    const isToday = Jalali.isSameJalaliDay(d, /* @__PURE__ */ new Date());
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: d.toISOString(),
        onClick: () => onJumpDay(d),
        className: "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border",
        style: { opacity: inMonth ? 1 : 0.3, borderColor: isToday ? "#C026D3" : "rgba(255,255,255,.06)", background: isToday ? "rgba(192,38,211,.12)" : "rgba(255,255,255,.02)" }
      },
      /* @__PURE__ */ React.createElement("span", { className: "text-[11px]", style: { color: isToday ? "#EAB4F2" : "#cbd5e1" } }, jd),
      due.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "w-1 h-1 rounded-full bg-fuchsia-400" })
    );
  })));
}
function YearView({ cursor, tasks, onJumpMonth }) {
  if (!Jalali) return null;
  const { jy } = Jalali.toJalaliParts(cursor);
  return /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3" }, JALALI_MONTHS_FA.map((name, i) => {
    const monthStart = Jalali.fromJalaliParts(jy, i + 1, 1);
    const len = Jalali.jalaliMonthLength(jy, i + 1);
    let doneCount = 0, dueCount = 0;
    for (let d = 1; d <= len; d++) {
      const dt = Jalali.fromJalaliParts(jy, i + 1, d);
      const due = tasks.filter((tsk) => isTaskDueOn(tsk, dt));
      dueCount += due.length;
      doneCount += due.filter((tsk) => tsk.status === "done").length;
    }
    const pct = dueCount ? Math.round(doneCount / dueCount * 100) : 0;
    return /* @__PURE__ */ React.createElement("button", { key: i, onClick: () => onJumpMonth(monthStart), className: "text-right" }, /* @__PURE__ */ React.createElement(GlassCard, { className: "p-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-100 mb-1.5" }, name), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 rounded-full bg-white/[0.08] overflow-hidden mb-1" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full", style: { width: `${pct}%`, background: "linear-gradient(90deg,#C026D3,#22D3EE)" } })), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500" }, doneCount, "/", dueCount, " \u0627\u0646\u062C\u0627\u0645\u200C\u0634\u062F\u0647")));
  }));
}
function CalendarViews({ tasks, onToggle, onSchedule, onDelete, onEdit }) {
  const [view, setView] = useState("day");
  const [cursor, setCursor] = useState(/* @__PURE__ */ new Date());
  const step = (dir) => {
    if (!Jalali) return;
    if (view === "day") setCursor((c) => Jalali.addDays(c, dir));
    else if (view === "week") setCursor((c) => Jalali.addDays(c, dir * 7));
    else if (view === "month") setCursor((c) => Jalali.jalaliAddMonths(c, dir));
    else setCursor((c) => Jalali.jalaliAddMonths(c, dir * 12));
  };
  const jumpDay = (d) => {
    setCursor(d);
    setView("day");
  };
  const jumpMonth = (d) => {
    setCursor(d);
    setView("month");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(CalendarHeader, { view, cursor, onPrev: () => step(-1), onNext: () => step(1), onToday: () => setCursor(/* @__PURE__ */ new Date()), onView: setView }), view === "day" && /* @__PURE__ */ React.createElement(DayPlannerView, { cursor, tasks, onSchedule, onToggle, onDelete, onEdit }), view === "week" && /* @__PURE__ */ React.createElement(WeekView, { cursor, tasks, onJumpDay: jumpDay }), view === "month" && /* @__PURE__ */ React.createElement(MonthView, { cursor, tasks, onJumpDay: jumpDay }), view === "year" && /* @__PURE__ */ React.createElement(YearView, { cursor, tasks, onJumpMonth: jumpMonth }));
}
var NAV = [
  { id: "dashboard", labelKey: "nav_dashboard", icon: "home" },
  { id: "tasks", labelKey: "nav_tasks", icon: "clipboard" },
  { id: "planning", labelKey: "nav_planning", icon: "calendar" },
  { id: "calendar", labelKey: "nav_calendar", icon: "grid" },
  { id: "study", labelKey: "nav_study", icon: "book-open" },
  { id: "fitness", labelKey: "nav_fitness", icon: "dumbbell" },
  { id: "learning", labelKey: "nav_learning", icon: "graduation-cap" },
  { id: "pomodoro", labelKey: "nav_pomodoro", icon: "clock" },
  { id: "notes", labelKey: "nav_notes", icon: "check-square" }
];
var DEFAULT_POMODORO = {
  settings: { work: 25, shortBreak: 5, longBreak: 15, cyclesUntilLong: 4, autoStartNext: false, sound: true },
  sessions: []
  // { id, type: 'work'|'short'|'long', taskId, startedAt, durationMin, completedAt, interrupted, progressAdded }
};
function pomoTodayKey() {
  return todayKey();
}
function pomodoroStatsFor(sessions, days) {
  const keys = lastNDays(days).map((d) => d.key);
  const byDay = {};
  keys.forEach((k) => byDay[k] = 0);
  let todayCount = 0, todayMinutes = 0, totalMinutes = 0;
  const perTask = {};
  sessions.forEach((s) => {
    if (s.type !== "work" || !s.completedAt) return;
    const key = s.completedAt.slice(0, 10);
    if (key in byDay) byDay[key] += 1;
    totalMinutes += s.durationMin;
    if (key === pomoTodayKey()) {
      todayCount += 1;
      todayMinutes += s.durationMin;
    }
    if (s.taskId) perTask[s.taskId] = (perTask[s.taskId] || 0) + s.durationMin;
  });
  return { byDay, keys, todayCount, todayMinutes, totalMinutes, perTask };
}
function LifeFlowApp() {
  const savedData = useMemo(() => loadSavedData(), []);
  const [tab, setTab] = useState("dashboard");
  const [settings, setSettings] = useState(() => loadSettings());
  const lang = settings.language;
  const langDir = (LANGUAGES.find((l) => l.id === lang) || LANGUAGES[0]).dir;
  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    const tick = () => setNow(/* @__PURE__ */ new Date());
    const interval = setInterval(tick, 60 * 1e3);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  const [tasks, setTasks] = useState(savedData.tasks || []);
  const [view, setView] = useState("list");
  const [showAdd, setShowAdd] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [books, setBooks] = useState(savedData.books || []);
  const [videos, setVideos] = useState(savedData.videos || []);
  const [podcasts, setPodcasts] = useState(savedData.podcasts || []);
  const [exercises, setExercises] = useState(savedData.exercises || []);
  const [projects, setProjects] = useState(savedData.projects || []);
  const [planning, setPlanning] = useState(savedData.planning || { morning: [], noon: [], evening: [], night: [] });
  const [goals, setGoals] = useState(savedData.goals || { targetHours: 2, log: {} });
  const [journal, setJournal] = useState(savedData.journal || []);
  const [noteLists, setNoteLists] = useState(savedData.noteLists || []);
  const [pomodoro, setPomodoro] = useState(savedData.pomodoro || DEFAULT_POMODORO);
  useEffect(() => {
    const fullState = { tasks, books, videos, podcasts, exercises, projects, planning, goals, journal, noteLists, pomodoro };
    try {
      storage.set(STORAGE_KEY, JSON.stringify(fullState));
    } catch (e) {
    }
    if (typeof window !== "undefined" && typeof window.__lifeflowOnStateChange === "function") {
      try {
        window.__lifeflowOnStateChange(fullState);
      } catch (e) {
      }
    }
  }, [tasks, books, videos, podcasts, exercises, projects, planning, goals, journal, noteLists, pomodoro]);
  const toggleTask = (id) => setTasks((p) => p.map((t2) => {
    if (t2.id !== id) return t2;
    const willBeDone = t2.status !== "done";
    return { ...t2, status: willBeDone ? "done" : "todo", completedDate: willBeDone ? todayKey() : t2.completedDate };
  }));
  const addTaskProgress = (id, amount) => setTasks((p) => p.map((t2) => {
    if (t2.id !== id || t2.progressType !== "progressive") return t2;
    const next = Math.min(t2.progressTarget, (t2.progressCurrent || 0) + amount);
    const done = next >= t2.progressTarget;
    return { ...t2, progressCurrent: next, status: done ? "done" : "todo", completedDate: done ? todayKey() : null };
  }));
  useEffect(() => {
    const todayDate = /* @__PURE__ */ new Date();
    const today = todayKey();
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((t2) => {
        if (t2.status !== "done" || !t2.recurrence || t2.recurrence === "none" || !t2.completedDate || t2.completedDate === today) return t2;
        if (!isTaskDueOn(t2, todayDate)) return t2;
        changed = true;
        return { ...t2, status: "todo", completedDate: null };
      });
      return changed ? next : prev;
    });
  }, [now]);
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (tasks.some((tk) => tk.reminder) && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
      });
    }
  }, [tasks]);
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (settings.notifications && settings.notifications.taskReminders === false) return;
    const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const today = todayKey();
    tasks.forEach((tk) => {
      if (!tk.reminder || !tk.time || tk.status === "done" || tk.time !== nowHM) return;
      if (!isTaskDueOn(tk, now)) return;
      const fireKey = `lifeflow_notif_${tk.id}_${today}`;
      if (storage.get(fireKey)) return;
      try {
        new Notification("\u23F0 " + tk.title, { body: "\u0632\u0645\u0627\u0646 \u0627\u0646\u062C\u0627\u0645 \u0627\u06CC\u0646 \u062A\u0633\u06A9\u0647", icon: "./icon-192.png" });
        storage.set(fireKey, "1");
      } catch (e) {
      }
    });
  }, [now, tasks, settings.notifications]);
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted" || !Jalali) return;
    if (settings.notifications && settings.notifications.learningDeadlines === false) return;
    const today = todayKey();
    projects.forEach((topic) => {
      const g = topic.goal;
      if (!g || !g.targetJy) return;
      const daysLeft = Math.round((Jalali.fromJalaliParts(g.targetJy, g.targetJm, g.targetJd) - now) / 864e5);
      if (daysLeft < 0 || daysLeft > 3) return;
      const stasks = (topic.subsections || []).map((s) => tasks.find((tk) => tk.id === s.linkedTaskId)).filter(Boolean);
      const allDone = stasks.length > 0 && stasks.every((tk) => tk.status === "done");
      if (allDone) return;
      const fireKey = `lifeflow_notif_goal_${topic.id}_${today}`;
      if (storage.get(fireKey)) return;
      try {
        new Notification("\u{1F3AF} " + topic.title, { body: daysLeft === 0 ? "\u0627\u0645\u0631\u0648\u0632 \u0622\u062E\u0631\u06CC\u0646 \u0645\u0647\u0644\u062A \u0647\u062F\u0641\u062A\u0647" : `${daysLeft} \u0631\u0648\u0632 \u062A\u0627 \u0647\u062F\u0641 \u0645\u0648\u0646\u062F\u0647`, icon: "./icon-192.png" });
        storage.set(fireKey, "1");
      } catch (e) {
      }
    });
  }, [now, projects, tasks, settings.notifications]);
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!settings.notifications || !settings.notifications.dailyDigest) return;
    const today = todayKey();
    const fireKey = `lifeflow_notif_digest_${today}`;
    if (storage.get(fireKey)) return;
    const due = tasks.filter((tk) => isTaskDueOn(tk, now) && tk.status !== "done").length;
    try {
      new Notification("\u2600\uFE0F \u0635\u0628\u062D \u0628\u062E\u06CC\u0631", { body: due > 0 ? `\u0627\u0645\u0631\u0648\u0632 ${due} \u062A\u0633\u06A9 \u062F\u0627\u0631\u06CC` : "\u0627\u0645\u0631\u0648\u0632 \u062A\u0633\u06A9\u06CC \u0646\u062F\u0627\u0631\u06CC \u2014 \u0631\u0648\u0632 \u0622\u0631\u0648\u0645\u06CC \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u06CC", icon: "./icon-192.png" });
      storage.set(fireKey, "1");
    } catch (e) {
    }
  }, [now, tasks, settings.notifications]);
  const deleteTask = (id) => setTasks((p) => p.filter((t2) => t2.id !== id));
  const saveTask = (t2) => setTasks((prev) => prev.some((x) => x.id === t2.id) ? prev.map((x) => x.id === t2.id ? t2 : x) : [t2, ...prev]);
  const moveTask = (id, status) => setTasks((p) => p.map((t2) => t2.id === id ? { ...t2, status } : t2));
  const scheduleTask = (id, time, duration) => setTasks((p) => p.map((t2) => t2.id === id ? { ...t2, time, duration } : t2));
  const suggestSchedule = () => {
    const order = ["q1", "q2", "q3", "q4"];
    let cursor = 8 * 60;
    setTasks((prev) => {
      const sorted = [...prev].sort((a, b) => order.indexOf(a.quad) - order.indexOf(b.quad));
      const taken = new Set(prev.filter((t2) => t2.time).map((t2) => t2.time));
      return prev.map((t2) => {
        if (t2.time || t2.status === "done") return t2;
        sorted.find((s) => s.id === t2.id);
        while (true) {
          const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
          const mm = String(cursor % 60).padStart(2, "0");
          const cand = `${hh}:${mm}`;
          if (!taken.has(cand)) {
            taken.add(cand);
            cursor += t2.duration + 15;
            return { ...t2, time: cand };
          }
          cursor += 15;
        }
      });
    });
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const streak = 7;
  const urgentImportant = useMemo(() => tasks.filter((t2) => t2.quad === "q1" && t2.status !== "done" && isTaskDueOn(t2, now)), [tasks, now]);
  const todaysPlan = useMemo(() => tasks.filter((t2) => isTaskDueOn(t2, now)), [tasks, now]);
  const todayDone = todaysPlan.filter((t2) => t2.status === "done").length;
  const showGlobalFab = tab === "dashboard" || tab === "tasks";
  const stats = useMemo(() => computeStats({ tasks, books, videos, podcasts, exercises, projects }), [tasks, books, videos, podcasts, exercises, projects]);
  const exportData = () => {
    const payload = { exportedAt: (/* @__PURE__ */ new Date()).toISOString(), tasks, books, videos, podcasts, exercises, projects, planning, goals, journal, noteLists, pomodoro };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lifeflow-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const restoreBackup = (data) => {
    setTasks(data.tasks || []);
    setBooks(data.books || []);
    setVideos(data.videos || []);
    setPodcasts(data.podcasts || []);
    setExercises(data.exercises || []);
    setProjects(data.projects || []);
    setPlanning(data.planning || { morning: [], noon: [], evening: [], night: [] });
    setGoals(data.goals || { targetHours: 2, log: {} });
    setJournal(data.journal || []);
    setNoteLists(data.noteLists || []);
    setPomodoro(data.pomodoro || DEFAULT_POMODORO);
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      dir: langDir,
      "data-theme": settings.theme,
      className: "lifeflow-app-root min-h-screen w-full text-white relative overflow-hidden lg:flex",
      style: { fontFamily: "'Vazirmatn', Tahoma, sans-serif" }
    },
    /* @__PURE__ */ React.createElement("style", null, `
        .lifeflow-app-root *{-webkit-tap-highlight-color:transparent}
        .lifeflow-app-root ::-webkit-scrollbar{display:none}

        /* ---------- Liquid glass core ---------- */
        .glass-panel{
          position:relative;
          background: linear-gradient(160deg, rgba(255,255,255,.075), rgba(255,255,255,.02) 60%, rgba(255,255,255,.04));
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          border:1px solid rgba(255,255,255,.10);
          box-shadow: 0 8px 24px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.2);
        }
        .glass-sheen{
          position:absolute; inset:0; pointer-events:none; z-index:0;
          background: linear-gradient(120deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 68%, rgba(255,255,255,.04) 100%);
        }
        .glass-strong{
          background: linear-gradient(165deg, rgba(255,255,255,.1), rgba(255,255,255,.03));
          backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%);
          border:1px solid rgba(255,255,255,.14);
          box-shadow: 0 6px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.16);
        }

        /* ---------- Galaxy nebula ---------- */
        .nebula{ position:absolute; border-radius:9999px; filter:blur(50px); opacity:.4; will-change:transform; }
        .nebula-1{ width:480px; height:480px; top:-160px; left:-120px; background:radial-gradient(circle,#C026D3,transparent 70%); animation:nebulaDrift 34s ease-in-out infinite alternate; }
        .nebula-2{ width:520px; height:520px; bottom:-220px; right:-180px; background:radial-gradient(circle,#22D3EE,transparent 70%); animation:nebulaDrift 40s ease-in-out infinite alternate; animation-delay:-9s; }
        @keyframes nebulaDrift{ from{ transform:translate3d(0,0,0) scale(1); } to{ transform:translate3d(28px,-20px,0) scale(1.08); } }

        /* ---------- 3D page transition (liquid glass pane swap) \u2014 light version ---------- */
        .glass-pane-enter{
          transform-style: preserve-3d;
          animation: glassPaneIn .38s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes glassPaneIn{
          0%{ opacity:0; transform: rotateY(-3deg) translateZ(-24px) translateY(6px) scale(.98); }
          100%{ opacity:1; transform: rotateY(0) translateZ(0) translateY(0) scale(1); }
        }

        /* ---------- Modal 3D pop \u2014 light version ---------- */
        .modal-glass-pop{ animation: modalPop .26s cubic-bezier(.22,1,.36,1) both; transform-origin: 50% 100%; }
        @keyframes modalPop{
          0%{ opacity:0; transform: translateY(24px) scale(.97); }
          100%{ opacity:1; transform: translateY(0) scale(1); }
        }

        /* ---------- Nav sliding glass pill ---------- */
        .nav-pill{ transition: transform .38s cubic-bezier(.22,1,.36,1); will-change:transform; }

        /* ---------- Chart animations ---------- */
        .chart-bar-grow{ transform-origin:bottom; animation: barGrow .5s cubic-bezier(.22,1,.36,1) both; }
        @keyframes barGrow{ from{ transform:scaleY(0); opacity:.5; } to{ transform:scaleY(1); opacity:1; } }
        .chart-bar-grow-h{ animation: barGrowH .55s cubic-bezier(.22,1,.36,1) both; }
        @keyframes barGrowH{ from{ width:0 !important; } }
        .chart-line-draw{ stroke-dasharray:100; animation: lineDraw .8s cubic-bezier(.22,1,.36,1) both; }
        @keyframes lineDraw{ from{ stroke-dashoffset:100; } to{ stroke-dashoffset:0; } }

        @media (prefers-reduced-motion: reduce){
          .glass-pane-enter, .modal-glass-pop, .chart-bar-grow, .chart-bar-grow-h, .chart-line-draw, .nebula{ animation:none !important; }
        }

        /* ---------- Light theme ---------- */
        /* Broad, attribute-based overrides so the whole app (including deeper tab content
           we haven't individually re-themed yet) gets a legible light appearance, without
           having to rewrite every component's Tailwind classes by hand.
           Scoped with the .lifeflow-app-root prefix (rather than a bare [data-theme="light"]
           attribute selector) since data-theme sits on THIS div \u2014 inside Obsidian, a bare
           selector would also match Obsidian's own <body data-theme="light">. */
        .lifeflow-app-root[data-theme="light"]{ color:#2b2440; }
        .lifeflow-app-root[data-theme="light"] .glass-panel{ background:linear-gradient(160deg, rgba(255,255,255,.75), rgba(255,255,255,.45) 60%, rgba(255,255,255,.6)); border-color:rgba(43,36,64,.10); box-shadow:0 8px 24px rgba(120,90,160,.12), inset 0 1px 0 rgba(255,255,255,.7); }
        .lifeflow-app-root[data-theme="light"] .glass-strong{ background:linear-gradient(165deg, rgba(255,255,255,.85), rgba(255,255,255,.55)); border-color:rgba(43,36,64,.10); box-shadow:0 6px 18px rgba(120,90,160,.14), inset 0 1px 0 rgba(255,255,255,.8); }
        .lifeflow-app-root[data-theme="light"] [class*="text-white"]{ color:#241f38 !important; }
        .lifeflow-app-root[data-theme="light"] [class*="text-slate-2"]{ color:#453d5c !important; }
        .lifeflow-app-root[data-theme="light"] [class*="text-slate-3"]{ color:#544a6e !important; }
        .lifeflow-app-root[data-theme="light"] [class*="text-slate-4"]{ color:#6b6084 !important; }
        .lifeflow-app-root[data-theme="light"] [class*="text-slate-5"]{ color:#847998 !important; }
        .lifeflow-app-root[data-theme="light"] [class*="text-slate-6"]{ color:#948aa8 !important; }
        .lifeflow-app-root[data-theme="light"] [class*="bg-white/"]{ background-color:rgba(43,36,64,.045) !important; }
        .lifeflow-app-root[data-theme="light"] [class*="border-white/"]{ border-color:rgba(43,36,64,.12) !important; }
        .lifeflow-app-root[data-theme="light"] [class*="bg-black"]{ background-color:rgba(255,255,255,.55) !important; }
        .lifeflow-app-root[data-theme="light"] input, .lifeflow-app-root[data-theme="light"] textarea, .lifeflow-app-root[data-theme="light"] select{ color:#241f38; }
        .lifeflow-app-root[data-theme="light"] ::placeholder{ color:#a89dbe !important; opacity:1; }
      `),
    settings.theme === "dark" ? /* @__PURE__ */ React.createElement(GalaxyBackground, null) : /* @__PURE__ */ React.createElement(LightBackground, null),
    /* @__PURE__ */ React.createElement("div", { className: "hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 px-4 py-6 z-10 glass-strong lg:rounded-none lg:border-l lg:border-t-0 lg:border-b-0 lg:border-r-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-2 mb-8" }, /* @__PURE__ */ React.createElement("img", { src: "./logo.png", alt: "", className: "w-8 h-8 rounded-lg" }), /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-lg" }, lang === "fa" ? "\u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645" : "LifeFlow")), /* @__PURE__ */ React.createElement("nav", { className: "flex flex-col gap-1 relative" }, NAV.map((n) => {
      const active = tab === n.id;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: n.id,
          onClick: () => setTab(n.id),
          className: "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative z-[1]",
          style: { background: active ? "rgba(192,38,211,.16)" : "transparent", color: active ? "#EAB4F2" : "#94a3b8", boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,.12), 0 0 16px rgba(192,38,211,.25)" : "none", border: active ? "1px solid rgba(192,38,211,.25)" : "1px solid transparent" }
        },
        /* @__PURE__ */ React.createElement(Ic, { name: n.icon, size: 18 }),
        " ",
        t(n.labelKey, lang)
      );
    })), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAdd(true), className: "mt-6 flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold text-sm text-white", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)", boxShadow: "0 6px 20px rgba(192,38,211,.35), inset 0 1px 0 rgba(255,255,255,.3)" } }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 16 }), " ", t("add_task", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowBackupModal(true), className: "mt-2 flex items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-sm text-slate-300 bg-white/[0.05] border border-white/10 hover:bg-white/10 transition" }, /* @__PURE__ */ React.createElement(Ic, { name: "folder", size: 15 }), " ", t("backup_manager", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowSettings(true), className: "mt-2 flex items-center justify-center gap-2 rounded-xl py-2.5 font-medium text-sm text-slate-300 bg-white/[0.05] border border-white/10 hover:bg-white/10 transition" }, /* @__PURE__ */ React.createElement(Ic, { name: "settings", size: 15 }), " ", t("settings", lang)), /* @__PURE__ */ React.createElement("div", { className: "mt-auto flex items-center gap-1.5 px-2 text-pink-400 text-sm font-bold" }, /* @__PURE__ */ React.createElement(Ic, { name: "flame", size: 15, color: "#DB2777" }), " ", streak, " \u0631\u0648\u0632 \u0627\u0633\u062A\u0631\u06CC\u06A9")),
    /* @__PURE__ */ React.createElement("div", { className: "max-w-md lg:max-w-none w-full lg:flex-1 mx-auto px-4 lg:px-10 pt-8 lg:pt-8 pb-28 lg:pb-14 relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-extrabold tracking-tight lg:hidden" }, lang === "fa" ? "\u0632\u0646\u062F\u06AF\u06CC\u200C\u0622\u0631\u0627\u0645" : "LifeFlow"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-xs mt-0.5" }, getPersianDateLabel(now))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSearchOpen(true), className: "w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Ic, { name: "search", size: 14, className: "text-slate-300" })), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowBackupModal(true), className: "w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center", title: t("backup_manager", lang) }, /* @__PURE__ */ React.createElement(Ic, { name: "folder", size: 14, className: "text-slate-300" })), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowSettings(true), className: "w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center lg:hidden", title: t("settings", lang) }, /* @__PURE__ */ React.createElement(Ic, { name: "settings", size: 14, className: "text-slate-300" })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 bg-white/[0.05] border border-white/10 rounded-full px-3 py-1.5 lg:hidden" }, /* @__PURE__ */ React.createElement(Ic, { name: "flame", size: 15, color: "#DB2777" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-pink-400" }, streak)))), /* @__PURE__ */ React.createElement(PageTransition, { pageKey: tab }, tab === "dashboard" && /* @__PURE__ */ React.createElement("div", { className: "lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start space-y-5 lg:space-y-0" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 space-y-5" }, /* @__PURE__ */ React.createElement(GlassCard, { className: "p-5 flex flex-col items-center" }, /* @__PURE__ */ React.createElement(DayArc, { tasks: todaysPlan, lang })), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement(StatPill, { icon: "clipboard", label: "\u062A\u0633\u06A9 \u0627\u0645\u0631\u0648\u0632", value: `${todayDone}/${tasks.length}`, color: "#C026D3" }), /* @__PURE__ */ React.createElement(StatPill, { icon: "book-open", label: "\u0645\u0637\u0627\u0644\u0639\u0647", value: "\u06F4\u06F5 \u062F", color: "#22D3EE" })), /* @__PURE__ */ React.createElement("div", { className: "hidden lg:block" }, /* @__PURE__ */ React.createElement(WeeklyOverviewChart, { goals, tasks })), urgentImportant.length > 0 && /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-[#C026D3]" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-rose-300" }, t("urgent_important", lang))), urgentImportant.map((task) => /* @__PURE__ */ React.createElement(TaskRow, { key: task.id, task, onToggle: toggleTask, onSchedule: scheduleTask, onDelete: deleteTask, onEdit: setEditingTask, onAddProgress: addTaskProgress }))), /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-200" }, t("todays_plan", lang)), /* @__PURE__ */ React.createElement("button", { onClick: () => setTab("tasks"), className: "text-[11px] text-fuchsia-300 flex items-center gap-0.5" }, t("see_all", lang), " ", /* @__PURE__ */ React.createElement(Ic, { name: "chevron-left", size: 13 }))), tasks.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-3" }, t("no_tasks_yet", lang)), tasks.length > 0 && todaysPlan.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-3" }, t("no_tasks_today", lang)), todaysPlan.slice(0, 4).map((task) => /* @__PURE__ */ React.createElement(TaskRow, { key: task.id, task, onToggle: toggleTask, onSchedule: scheduleTask, onDelete: deleteTask, onEdit: setEditingTask, onAddProgress: addTaskProgress })))), /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, /* @__PURE__ */ React.createElement(JournalCard, { journal, setJournal }), /* @__PURE__ */ React.createElement(GamificationCard, { stats, streak }), /* @__PURE__ */ React.createElement(AiSummaryCard, { stats, streak, lang, onOpenSettings: () => setShowSettings(true) }))), tab === "tasks" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 overflow-x-auto pb-1" }, [["list", "\u0644\u06CC\u0633\u062A", "clipboard"], ["matrix", "\u0645\u0627\u062A\u0631\u06CC\u0633", "grid"], ["kanban", "\u06A9\u0627\u0646\u0628\u0627\u0646", "columns"], ["timeline", "\u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC", "clock"]].map(([id, label, Icon]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: id,
        onClick: () => setView(id),
        className: "shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border",
        style: { borderColor: view === id ? "#C026D3" : "rgba(255,255,255,.1)", background: view === id ? "rgba(192,38,211,.15)" : "rgba(255,255,255,.03)", color: view === id ? "#EAB4F2" : "#94a3b8" }
      },
      /* @__PURE__ */ React.createElement(Ic, { name: Icon, size: 13 }),
      " ",
      label
    ))), view === "list" && /* @__PURE__ */ React.createElement(GlassCard, { className: "p-4" }, tasks.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 text-center py-4" }, "\u0647\u0646\u0648\u0632 \u062A\u0633\u06A9\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u06A9\u0631\u062F\u06CC \u2014 \u0628\u0627 \u062F\u06A9\u0645\u0647\u200C\u06CC \u0627\u0641\u0632\u0648\u062F\u0646 \u0634\u0631\u0648\u0639 \u06A9\u0646"), tasks.map((t2) => /* @__PURE__ */ React.createElement(TaskRow, { key: t2.id, task: t2, onToggle: toggleTask, onSchedule: scheduleTask, onDelete: deleteTask, onEdit: setEditingTask, onAddProgress: addTaskProgress }))), view === "matrix" && /* @__PURE__ */ React.createElement(EisenhowerBoard, { tasks, onToggle: toggleTask, onDelete: deleteTask }), view === "kanban" && /* @__PURE__ */ React.createElement(KanbanBoard, { tasks, onMove: moveTask, onDelete: deleteTask }), view === "timeline" && /* @__PURE__ */ React.createElement(TimelineView, { tasks, onSchedule: scheduleTask, onSuggest: suggestSchedule })), tab === "planning" && /* @__PURE__ */ React.createElement(PlanningHub, { planning, setPlanning, goals, setGoals }), tab === "calendar" && /* @__PURE__ */ React.createElement(CalendarViews, { tasks, onToggle: toggleTask, onSchedule: scheduleTask, onDelete: deleteTask, onEdit: setEditingTask }), tab === "study" && /* @__PURE__ */ React.createElement(StudyHub, { books, videos, podcasts, setBooks, setVideos, setPodcasts }), tab === "fitness" && /* @__PURE__ */ React.createElement(FitnessHub, { exercises, setExercises }), tab === "learning" && /* @__PURE__ */ React.createElement(LearningHub, { projects, setProjects, tasks, onAddProgress: addTaskProgress, saveTask, deleteTask }), tab === "pomodoro" && /* @__PURE__ */ React.createElement(PomodoroHub, { pomodoro, setPomodoro, tasks, onAddProgress: addTaskProgress, onToggle: toggleTask, lang, notifSettings: settings.notifications }), tab === "notes" && /* @__PURE__ */ React.createElement(NotesHub, { noteLists, setNoteLists, journal, setJournal, lang }))),
    showGlobalFab && /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAdd(true), className: "fixed bottom-24 left-1/2 -translate-x-1/2 lg:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(192,38,211,.5)] z-30", style: { background: "linear-gradient(135deg,#C026D3,#DB2777)" } }, /* @__PURE__ */ React.createElement(Ic, { name: "plus", size: 24, color: "white" })),
    /* @__PURE__ */ React.createElement("div", { className: "fixed bottom-0 left-0 right-0 z-20 lg:hidden" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-md mx-auto px-3 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "glass-strong flex items-center justify-between rounded-2xl px-2 py-2 relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "glass-sheen" }), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "nav-pill absolute top-2 bottom-2 rounded-xl z-0",
        style: {
          width: `calc(${100 / NAV.length}% - 4px)`,
          transform: `translateX(${NAV.findIndex((n) => n.id === tab) * 100}%)`,
          background: "linear-gradient(150deg, rgba(192,38,211,.32), rgba(219,39,119,.22))",
          border: "1px solid rgba(234,180,242,.35)",
          boxShadow: "0 0 18px rgba(192,38,211,.35), inset 0 1px 0 rgba(255,255,255,.25)"
        }
      }
    ), NAV.map((n) => {
      const active = tab === n.id;
      return /* @__PURE__ */ React.createElement("button", { key: n.id, onClick: () => setTab(n.id), className: "relative z-[1] flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl flex-1 transition-transform active:scale-95" }, /* @__PURE__ */ React.createElement(Ic, { name: n.icon, size: 18, color: active ? "#EAB4F2" : "#64748b" }), /* @__PURE__ */ React.createElement("span", { className: "text-[9px]", style: { color: active ? "#EAB4F2" : "#64748b" } }, t(n.labelKey, lang)));
    })))),
    (showAdd || editingTask) && (showGlobalFab || tab === "calendar" || tab === "pomodoro") && /* @__PURE__ */ React.createElement(AddTaskModal, { onClose: () => {
      setShowAdd(false);
      setEditingTask(null);
    }, onAdd: saveTask, initialTask: editingTask }),
    searchOpen && /* @__PURE__ */ React.createElement(
      GlobalSearchModal,
      {
        onClose: () => setSearchOpen(false),
        onNavigate: setTab,
        tasks,
        books,
        videos,
        podcasts,
        exercises,
        projects
      }
    ),
    showBackupModal && /* @__PURE__ */ React.createElement(
      BackupModal,
      {
        onClose: () => setShowBackupModal(false),
        currentData: { tasks, books, videos, podcasts, exercises, projects, planning, goals, journal, noteLists, pomodoro },
        onRestore: restoreBackup,
        onDownload: exportData
      }
    ),
    showSettings && /* @__PURE__ */ React.createElement(
      SettingsModal,
      {
        onClose: () => setShowSettings(false),
        settings,
        onChangeSettings: setSettings
      }
    )
  );
}
if (typeof window !== "undefined") {
  window.LifeFlowApp = LifeFlowApp;
  const __rootEl = document.getElementById("root");
  if (__rootEl) {
    const root = ReactDOM.createRoot(__rootEl);
    root.render(/* @__PURE__ */ React.createElement(LifeFlowApp, null));
  }
}

