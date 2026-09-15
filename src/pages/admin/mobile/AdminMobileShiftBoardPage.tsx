import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
const STATUSES = ["出勤", "定休", "休み", "有給", "欠勤", "遅刻"] as const;
type ShiftStatus = typeof STATUSES[number];
type ViewMode = "month" | "week";
type Staff = { id: string; staff_code: string | null; staff_name: string; is_active: boolean; sort_order: number | null };
type Entry = { staff_id: string; status: string };
type ShiftDay = { id: string; shift_date: string; note: string | null; shift_entries: Entry[] };

function pad(value: number) { return String(value).padStart(2, "0"); }
function iso(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
function parse(value: string) { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); }
function addDays(value: string, amount: number) { const date = parse(value); date.setDate(date.getDate() + amount); return iso(date); }
function startOfWeek(value: string) { const date = parse(value); date.setDate(date.getDate() - date.getDay()); return iso(date); }
function monthDates(year: number, month: number) { return Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => `${year}-${pad(month)}-${pad(index + 1)}`); }
function weekDates(value: string) { const start = startOfWeek(value); return Array.from({ length: 7 }, (_, index) => addDays(start, index)); }
function authHeaders(json = false) { return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}` }; }

export default function AdminMobileShiftBoardPage() {
  const now = new Date(); const today = iso(now);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView] = useState<ViewMode>("week");
  const [weekBase, setWeekBase] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [days, setDays] = useState<ShiftDay[]>([]);
  const [cleanCounts, setCleanCounts] = useState<Record<string, number>>({});
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [workload, setWorkload] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const readOnly = useMemo(() => { try { return !["admin", "sub_admin"].includes(JSON.parse(localStorage.getItem("admin_user") || "{}")?.role || ""); } catch { return true; } }, []);

  async function loadBoard(targetYear = year, targetMonth = month) {
    try {
      setLoading(true); setError("");
      const response = await fetch(`${API_BASE}/shift-board?year=${targetYear}&month=${targetMonth}`, { headers: authHeaders() });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setStaffs(Array.isArray(data.staffs) ? data.staffs : []); setDays(Array.isArray(data.days) ? data.days : []);
      setCleanCounts(data.cleaning_counts || {}); setAttendanceCounts(data.attendance_counts || {}); setWorkload(data.workload || {});
    } catch { setError("シフト表を取得できませんでした。"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadBoard(year, month); }, [year, month]);

  const dayMap = useMemo(() => new Map(days.map((day) => [day.shift_date, day])), [days]);
  const visibleDates = view === "month" ? monthDates(year, month) : weekDates(weekBase);
  const selectedDay = dayMap.get(selectedDate);
  const selectedEntries = useMemo(() => new Map((selectedDay?.shift_entries || []).map((entry) => [entry.staff_id, entry.status])), [selectedDay]);
  const filteredStaffs = useMemo(() => { const keyword = search.trim().toLocaleLowerCase("ja"); return [...staffs].filter((staff) => !activeOnly || staff.is_active).filter((staff) => !keyword || `${staff.staff_name} ${staff.staff_code || ""}`.toLocaleLowerCase("ja").includes(keyword)).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)); }, [activeOnly, search, staffs]);

  function moveMonth(amount: number) { const date = new Date(year, month - 1 + amount, 1); const nextYear = date.getFullYear(); const nextMonth = date.getMonth() + 1; setYear(nextYear); setMonth(nextMonth); setSelectedDate(`${nextYear}-${pad(nextMonth)}-01`); setWeekBase(`${nextYear}-${pad(nextMonth)}-01`); }
  function moveWeek(amount: number) { const next = addDays(weekBase, amount * 7); setWeekBase(next); setSelectedDate(next); const date = parse(next); if (date.getFullYear() !== year || date.getMonth() + 1 !== month) { setYear(date.getFullYear()); setMonth(date.getMonth() + 1); } }
  function statusOf(staffId: string): ShiftStatus { const value = selectedEntries.get(staffId); return STATUSES.includes(value as ShiftStatus) ? value as ShiftStatus : "休み"; }
  function metric(date: string) { const clean = Number(cleanCounts[date] || 0); const attendance = Number(attendanceCounts[date] || 0); const load = workload[date] ?? (attendance ? Number((clean / attendance).toFixed(1)) : 0); return { clean, attendance, load }; }

  async function save(staffId: string, status: ShiftStatus) {
    if (readOnly || savingKey) return; const key = `${selectedDate}-${staffId}`; setSavingKey(key);
    try {
      let day = dayMap.get(selectedDate);
      if (!day) { const create = await fetch(`${API_BASE}/shifts/get_or_create_day`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ shift_date: selectedDate, note: "" }) }); if (!create.ok) throw new Error(); day = await create.json(); }
      const off = ["定休", "休み", "有給", "欠勤"].includes(status);
      const response = await fetch(`${API_BASE}/shifts/upsert_entry`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ shift_day_id: day.id, staff_id: staffId, status, start_time: off ? null : "09:00", end_time: off ? null : "18:00", assigned_area: "", note: "" }) });
      if (!response.ok) throw new Error(); await loadBoard(year, month);
    } catch { setError("シフトを保存できませんでした。"); }
    finally { setSavingKey(""); }
  }

  const selectedMetric = metric(selectedDate);
  return <div className="min-h-full bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto max-w-lg"><div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><Toggle active={view === "month"} onClick={() => setView("month")}>月表示</Toggle><Toggle active={view === "week"} onClick={() => setView("week")}>週表示</Toggle></div><div className="mt-3 flex items-center justify-between"><button type="button" onClick={() => view === "month" ? moveMonth(-1) : moveWeek(-1)} className="h-10 w-10 rounded-full bg-slate-100 text-xl font-bold">‹</button><div className="text-base font-black">{view === "month" ? `${year}年 ${month}月` : `${weekDates(weekBase)[0].slice(5).replace("-", "/")}〜${weekDates(weekBase)[6].slice(5).replace("-", "/")}`}</div><button type="button" onClick={() => view === "month" ? moveMonth(1) : moveWeek(1)} className="h-10 w-10 rounded-full bg-slate-100 text-xl font-bold">›</button></div></div></div>
    <main className="mx-auto max-w-lg px-4 pt-4">
      {view === "month" ? <div className="grid grid-cols-7 gap-1"><>{["日", "月", "火", "水", "木", "金", "土"].map((day) => <div key={day} className="py-1 text-center text-[10px] font-bold text-slate-400">{day}</div>)}</><>{Array.from({ length: parse(`${year}-${pad(month)}-01`).getDay() }, (_, index) => <div key={`blank-${index}`} />)}{visibleDates.map((date) => <DateCell key={date} date={date} selected={date === selectedDate} today={date === today} metric={metric(date)} onClick={() => setSelectedDate(date)} />)}</></div> : <div className="grid grid-cols-7 gap-1">{visibleDates.map((date) => <DateCell key={date} date={date} selected={date === selectedDate} today={date === today} metric={metric(date)} onClick={() => setSelectedDate(date)} />)}</div>}
      <section className="mt-4 grid grid-cols-3 gap-2"><Summary label="清掃" value={`${selectedMetric.clean}件`} /><Summary label="出勤" value={`${selectedMetric.attendance}名`} /><Summary label="1人あたり" value={selectedMetric.attendance ? `${selectedMetric.load}件` : selectedMetric.clean ? "要員不足" : "—"} warn={!selectedMetric.attendance && selectedMetric.clean > 0} /></section>
      <div className="relative mt-4"><SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="スタッフ名・コードで検索" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-400" /></div><label className="mt-3 flex items-center justify-end gap-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} className="h-4 w-4 accent-orange-600" />有効スタッフのみ</label>
      {readOnly ? <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700">閲覧専用です。シフト変更は管理者・副管理者のみ行えます。</div> : null}{error ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600">{error}</div> : null}
      <section className="mt-4 space-y-2">{loading ? <>{[0, 1, 2].map((key) => <div key={key} className="h-20 animate-pulse rounded-2xl bg-white" />)}</> : filteredStaffs.map((staff) => { const value = statusOf(staff.id); return <article key={staff.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="min-w-0 flex-1"><div className="truncate text-sm font-black">{staff.staff_name}</div><div className="text-[10px] text-slate-400">{staff.staff_code || ""}</div></div>{readOnly ? <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${tone(value)}`}>{value}</span> : <select value={value} disabled={!!savingKey} onChange={(event) => void save(staff.id, event.target.value as ShiftStatus)} className={`h-10 min-w-24 rounded-xl border-0 px-3 text-xs font-extrabold outline-none ${tone(value)}`}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>}</article>; })}{!loading && !filteredStaffs.length ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">該当するスタッフはいません</div> : null}</section>
    </main>
  </div>;
}

function DateCell({ date, selected, today, metric, onClick }: { date: string; selected: boolean; today: boolean; metric: { clean: number; attendance: number; load: number }; onClick: () => void }) { const dateValue = parse(date); return <button type="button" onClick={onClick} className={`min-h-16 rounded-xl px-0.5 py-1.5 text-center ${selected ? "bg-slate-900 text-white" : "bg-white text-slate-700"} ${today && !selected ? "ring-2 ring-orange-400" : ""}`}><div className="text-[10px] font-black">{dateValue.getDate()}</div><div className={`mt-1 text-[9px] font-bold ${selected ? "text-white/70" : "text-slate-400"}`}>{metric.clean}件</div><div className={`text-[9px] font-bold ${selected ? "text-white/70" : "text-slate-400"}`}>{metric.attendance}名</div></button>; }
function Summary({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) { return <div className={`rounded-2xl px-2 py-3 text-center shadow-sm ${warn ? "bg-red-50" : "bg-white"}`}><div className={`text-lg font-black ${warn ? "text-red-600" : "text-slate-800"}`}>{value}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400">{label}</div></div>; }
function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-lg py-2 text-xs font-extrabold ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{children}</button>; }
function tone(status: ShiftStatus) { if (status === "出勤") return "bg-emerald-50 text-emerald-700"; if (status === "定休") return "bg-blue-50 text-blue-700"; if (status === "休み") return "bg-slate-100 text-slate-600"; if (status === "有給") return "bg-violet-50 text-violet-700"; if (status === "欠勤") return "bg-red-50 text-red-700"; return "bg-amber-50 text-amber-700"; }
function SearchIcon({ className = "h-6 w-6" }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
