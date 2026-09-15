import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
type Worklog = { id: string; user_id: string; staff_name: string; staff_code: string; work_date: string; property_name: string; room_name: string; work_start_time: string; start_time: string; end_time: string; break_minutes: number; work_type: string; note: string; created_at: string; work_minutes: number; cleaning_started_at?: string; cleaning_completed_at?: string; cleaning_minutes?: number };
type Place = { property_name: string; room_name: string; cleaning_started_at?: string; cleaning_completed_at?: string; cleaning_minutes?: number };
type Report = { key: string; row: Worklog; places: Place[]; rows: Worklog[] };
type AlertFilter = "all" | "late" | "early" | "overtime";

function today() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function minutes(value: number) { const total = Math.max(Number(value || 0), 0); const hour = Math.floor(total / 60); const minute = total % 60; return hour ? `${hour}時間${minute ? `${minute}分` : ""}` : `${minute}分`; }
function clockMinutes(value: string) { if (!value?.includes(":")) return null; const [hour, minute] = value.split(":").map(Number); return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null; }
function alerts(row: Worklog) { const result: string[] = []; const start = clockMinutes(row.start_time); const end = clockMinutes(row.end_time); if (start !== null && start > 600) result.push("遅刻"); if (end !== null && end < 960) result.push("早退"); if (end !== null && end > 960) result.push("残業"); return result; }
function signature(row: Worklog) { return [row.user_id, row.work_date, row.work_start_time, row.start_time, row.end_time, Number(row.break_minutes || 0), row.work_type || "", row.note || ""].join("||"); }
function workType(value: string) { const labels: Record<string, string> = { cleaning: "清掃", inspection: "インスペクション", linen: "リネン", support: "補助作業" }; return (value || "").split(",").map((item) => item.trim()).filter(Boolean).map((item) => labels[item] || item).join(" / ") || "—"; }
function cleaningClock(value?: string) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }); }

export default function AdminMobileWorklogsPage() {
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState<Worklog[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(targetDate = date) {
    try {
      setLoading(true); setError("");
      const url = new URL(`${API_BASE}/api/admin-portal/worklogs/today`); url.searchParams.set("date", targetDate);
      const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}` } });
      if (!response.ok) throw new Error(); const data = await response.json(); setRows(Array.isArray(data?.worklogs) ? data.worklogs : []);
    } catch { setRows([]); setError("実働報告を取得できませんでした。"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(date); }, [date]);

  const reports = useMemo<Report[]>(() => {
    const groups = new Map<string, Report>();
    rows.forEach((row) => {
      const key = signature(row); const group = groups.get(key);
      if (group) group.rows.push(row); else groups.set(key, { key, row, rows: [row], places: [] });
    });
    return [...groups.values()].map((group) => ({ ...group, places: [...new Map(group.rows.map((row) => [`${row.property_name}||${row.room_name}`, { property_name: row.property_name || "", room_name: row.room_name || "", cleaning_started_at: row.cleaning_started_at, cleaning_completed_at: row.cleaning_completed_at, cleaning_minutes: Number(row.cleaning_minutes || 0) }])).values()] }))
      .filter((report) => workTypeFilter === "all" || (report.row.work_type || "").split(",").map((item) => item.trim()).includes(workTypeFilter))
      .filter((report) => alertFilter === "all" || alerts(report.row).includes(alertFilter === "late" ? "遅刻" : alertFilter === "early" ? "早退" : "残業"))
      .filter((report) => { const keyword = search.trim().toLocaleLowerCase("ja"); return !keyword || `${report.row.staff_name} ${report.row.staff_code} ${report.places.map((place) => `${place.property_name} ${place.room_name}`).join(" ")} ${report.row.note}`.toLocaleLowerCase("ja").includes(keyword); })
      .sort((a, b) => String(b.row.created_at || "").localeCompare(String(a.row.created_at || "")));
  }, [alertFilter, rows, search, workTypeFilter]);
  const uniqueStaff = new Set(reports.map((report) => report.row.user_id).filter(Boolean)).size;
  const totalMinutes = reports.reduce((sum, report) => sum + Number(report.row.work_minutes || 0), 0);

  return <div className="min-h-full bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-lg gap-2"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold" /><button type="button" onClick={() => void load(date)} className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-600">更新</button></div><div className="mx-auto mt-3 grid max-w-lg grid-cols-2 gap-2"><select value={workTypeFilter} onChange={(event) => setWorkTypeFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold"><option value="all">全作業</option><option value="cleaning">清掃</option><option value="inspection">インスペクション</option><option value="linen">リネン</option><option value="support">補助作業</option></select><select value={alertFilter} onChange={(event) => setAlertFilter(event.target.value as AlertFilter)} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold"><option value="all">全報告</option><option value="late">遅刻</option><option value="early">早退</option><option value="overtime">残業</option></select></div></div>
    <main className="mx-auto max-w-lg px-4 pt-4"><section className="grid grid-cols-3 gap-2"><Summary label="報告件数" value={`${reports.length}件`} /><Summary label="スタッフ" value={`${uniqueStaff}名`} /><Summary label="総実働" value={minutes(totalMinutes)} /></section><div className="relative mt-4"><SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="スタッフ・物件・部屋を検索" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-400" /></div><div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">実働報告は閲覧専用です。</div>{error ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</div> : null}
      <section className="mt-4 space-y-3">{loading ? <>{[0, 1, 2].map((key) => <div key={key} className="h-44 animate-pulse rounded-[22px] bg-white" />)}</> : reports.map((report) => { const row = report.row; const open = expanded === report.key; return <article key={report.key} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setExpanded(open ? "" : report.key)} className="block w-full p-4 text-left"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">{row.staff_name || "—"}</h2><div className="text-xs text-slate-400">{row.staff_code || ""}</div></div><div className="flex flex-wrap justify-end gap-1">{alerts(row).map((alert) => <Alert key={alert} value={alert} />)}</div></div><div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3"><Metric label="出勤〜退勤" value={`${row.start_time || "—"}〜${row.end_time || "—"}`} /><Metric label="休憩" value={`${Number(row.break_minutes || 0)}分`} /><Metric label="実働" value={minutes(row.work_minutes)} /></div><div className="mt-3 flex items-center justify-between"><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-extrabold text-orange-700">{workType(row.work_type)}</span><span className="text-xs font-bold text-slate-500">{report.places.length}部屋 {open ? "▲" : "▼"}</span></div>{row.note ? <div className="mt-3 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">{row.note}</div> : null}</button>{open ? <div className="border-t border-slate-100 px-4 pb-4 pt-3"><div className="mb-2 text-[10px] font-extrabold text-slate-400">担当した物件・部屋</div><div className="space-y-2">{report.places.map((place, index) => <div key={`${place.property_name}-${place.room_name}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2.5"><div className="text-sm font-extrabold">{place.property_name || "—"} {place.room_name || "—"}</div><div className="mt-1 text-xs text-slate-500">清掃時間：{place.cleaning_started_at && place.cleaning_completed_at ? `${cleaningClock(place.cleaning_started_at)}〜${cleaningClock(place.cleaning_completed_at)}（${minutes(place.cleaning_minutes || 0)}）` : place.cleaning_started_at ? "清掃中" : "打刻なし"}</div></div>)}</div><div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 p-3"><Metric label="作業開始" value={row.work_start_time || "—"} /><Metric label="備考" value={row.note || "—"} wrap /></div></div> : null}</article>; })}{!loading && reports.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">該当する実働報告はありません</div> : null}</section>
    </main>
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white px-1 py-3 text-center shadow-sm"><div className="text-lg font-black">{value}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400">{label}</div></div>; }
function Metric({ label, value, wrap = false }: { label: string; value: string; wrap?: boolean }) { return <div className="min-w-0 px-2 text-center"><div className="text-[10px] font-bold text-slate-400">{label}</div><div className={`mt-1 text-xs font-extrabold text-slate-700 ${wrap ? "whitespace-pre-wrap break-words" : "truncate"}`}>{value}</div></div>; }
function Alert({ value }: { value: string }) { const tone = value === "遅刻" ? "bg-red-50 text-red-700" : value === "早退" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"; return <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${tone}`}>{value}</span>; }
function SearchIcon({ className = "h-6 w-6" }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
