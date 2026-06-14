const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type HomeShiftEntry = {
  id?: string;
  start_time?: string | null;
  end_time?: string | null;
  assigned_area?: string | null;
  clock_in_at?: string | null;
  clockInAt?: string | null;
  jinjer_clock_in_at?: string | null;
  attendance_status?: string | null;
  attendanceStatus?: string | null;
  attendance?: {
    clock_in_at?: string | null;
    status?: string | null;
  } | null;
  staff_members?: {
    staff_name?: string | null;
  } | null;
};

let initialized = false;
let applying = false;
let latestEntries: HomeShiftEntry[] = [];
let enhanceTimer: number | null = null;

function isAdminHomePage(): boolean {
  return window.location.pathname === "/admin/home";
}

function isAfterMissingCheckTime(): boolean {
  const now = new Date();
  const threshold = new Date(now);
  threshold.setHours(10, 5, 0, 0);
  return now.getTime() >= threshold.getTime();
}

function getClockIn(entry: HomeShiftEntry): string {
  return (
    entry.clock_in_at ||
    entry.clockInAt ||
    entry.jinjer_clock_in_at ||
    entry.attendance?.clock_in_at ||
    ""
  );
}

function getAttendanceStatus(entry: HomeShiftEntry): string {
  return (
    entry.attendance_status ||
    entry.attendanceStatus ||
    entry.attendance?.status ||
    ""
  );
}

function shouldMarkMissing(entry: HomeShiftEntry): boolean {
  if (!isAfterMissingCheckTime()) return false;

  const status = getAttendanceStatus(entry);
  if (["clocked_in", "checked_in", "working", "present"].includes(status)) return false;
  if (["not_clocked_in", "missing_clock_in", "absent_unconfirmed"].includes(status)) return true;

  // Jinjer連携後は clock_in_at が入る想定。
  // 10:05以降に出勤打刻が無い場合は未打刻扱い。
  return !getClockIn(entry);
}

function findScheduleCards(): HTMLElement[] {
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h2"));
  const scheduleHeading = headings.find((el) => (el.textContent || "").includes("本日の社内スケジュール"));
  const section = scheduleHeading?.closest("section");
  if (!section) return [];

  return Array.from(section.querySelectorAll<HTMLElement>("div.rounded-xl.border"));
}

function resetCard(card: HTMLElement): void {
  card.classList.remove(
    "border-rose-300",
    "bg-rose-50",
    "ring-2",
    "ring-rose-100"
  );
  card.classList.add("border-slate-200", "bg-slate-50");
  card.querySelectorAll("[data-missing-clockin-badge='1']").forEach((el) => el.remove());
}

function markCard(card: HTMLElement): void {
  card.classList.remove("border-slate-200", "bg-slate-50");
  card.classList.add("border-rose-300", "bg-rose-50", "ring-2", "ring-rose-100");

  const nameEl = card.querySelector<HTMLElement>(".font-bold");
  if (!nameEl || nameEl.querySelector("[data-missing-clockin-badge='1']")) return;

  const badge = document.createElement("span");
  badge.dataset.missingClockinBadge = "1";
  badge.textContent = "未打刻";
  badge.className = "ml-2 inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white align-middle";
  nameEl.appendChild(badge);
}

function applyHighlight(): void {
  if (!isAdminHomePage()) return;

  const cards = findScheduleCards();
  if (!cards.length) return;

  const missingNames = new Set(
    latestEntries
      .filter(shouldMarkMissing)
      .map((entry) => entry.staff_members?.staff_name || "")
      .filter(Boolean)
  );

  cards.forEach((card) => {
    resetCard(card);
    const text = card.textContent || "";
    const matched = Array.from(missingNames).some((name) => text.includes(name));
    if (matched) markCard(card);
  });
}

async function loadHomeData(): Promise<void> {
  if (applying || !isAdminHomePage()) return;
  applying = true;

  try {
    const token = localStorage.getItem("admin_access_token") || "";
    if (!token) return;

    const res = await fetch(`${API_BASE}/api/admin-portal/home`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    const entries = data?.todayShift?.shift_entries;
    latestEntries = Array.isArray(entries) ? entries : [];
    applyHighlight();
  } catch (error) {
    console.error("missing clock-in highlight failed", error);
  } finally {
    applying = false;
  }
}

function scheduleEnhance(): void {
  if (!isAdminHomePage()) return;
  if (enhanceTimer !== null) window.clearTimeout(enhanceTimer);

  enhanceTimer = window.setTimeout(() => {
    void loadHomeData();
  }, 300);
}

function start(): void {
  if (initialized) return;
  initialized = true;

  scheduleEnhance();

  const observer = new MutationObserver(() => {
    applyHighlight();
    scheduleEnhance();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.setInterval(() => {
    void loadHomeData();
  }, 30_000);

  window.addEventListener("popstate", () => scheduleEnhance());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}

export {};