import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
const STATUS_OPTIONS = ["出勤", "欠勤", "遅刻"];
const VISIBLE_STATUSES = new Set(STATUS_OPTIONS);
const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4); const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

type Staff = { id: string; staff_code: string | null; staff_name: string; is_active: boolean; sort_order: number | null };
type Entry = { id?: string; shift_day_id: string; staff_id: string; status: string; start_time: string | null; end_time: string | null; assigned_area: string | null; note: string | null };
type ShiftDay = { id: string; shift_date: string; note: string | null; shift_entries: Entry[] };
type Schedule = { id: string; shift_date: string; staff_id: string; start_time: string; end_time: string; place: string | null; work_category: string | null; details: string | null };
type Draft = { id?: string; start_time: string; end_time: string; place: string; work_category: string; details: string };

function token() { return localStorage.getItem("admin_access_token") || ""; }
function authHeaders(json = false) { return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token()}` }; }
function localDate() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function time(value?: string | null) { return value ? value.slice(0, 5) : ""; }

export default function AdminMobileSchedulePage() {
  const [date, setDate] = useState(localDate());
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [shiftDay, setShiftDay] = useState<ShiftDay | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [error, setError] = useState("");

  const currentUserId = useMemo(() => { try { return String(JSON.parse(localStorage.getItem("admin_user") || "{}")?.id || ""); } catch { return ""; } }, []);

  async function loadStaffs() {
    const response = await fetch(`${API_BASE}/staffs`, { headers: authHeaders() });
    if (!response.ok) throw new Error();
    const data: Staff[] = await response.json();
    setStaffs((data || []).filter((item) => item.is_active).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
  }

  async function loadDate(targetDate: string) {
    setLoading(true); setError("");
    try {
      const [shiftResponse, scheduleResponse] = await Promise.all([
        fetch(`${API_BASE}/shifts?shift_date=${encodeURIComponent(targetDate)}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/staff-schedules?shift_date=${encodeURIComponent(targetDate)}`, { headers: authHeaders() }),
      ]);
      if (!shiftResponse.ok || !scheduleResponse.ok) throw new Error();
      const shiftData: ShiftDay[] = await shiftResponse.json();
      if (shiftData?.length) setShiftDay(shiftData[0]);
      else {
        const createResponse = await fetch(`${API_BASE}/shifts/create_day`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ shift_date: targetDate, note: "" }) });
        if (!createResponse.ok) throw new Error();
        const created = await createResponse.json();
        setShiftDay({ ...created, shift_entries: [] });
      }
      const scheduleData = await scheduleResponse.json();
      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
    } catch { setError("スケジュールを取得できませんでした。"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadStaffs().catch(() => setError("スタッフ情報を取得できませんでした。")); }, []);
  useEffect(() => { void loadDate(date); }, [date]);

  const entries = useMemo(() => new Map((shiftDay?.shift_entries || []).map((entry) => [entry.staff_id, entry])), [shiftDay]);
  const visibleStaffs = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ja");
    return staffs.filter((staff) => VISIBLE_STATUSES.has(entries.get(staff.id)?.status || ""))
      .filter((staff) => !keyword || `${staff.staff_name} ${staff.staff_code || ""}`.toLocaleLowerCase("ja").includes(keyword));
  }, [entries, search, staffs]);
  const summary = useMemo(() => Object.fromEntries(STATUS_OPTIONS.map((status) => [status, [...entries.values()].filter((entry) => entry.status === status).length])), [entries]);

  async function saveStatus(staff: Staff, status: string) {
    if (!shiftDay) return;
    const current = entries.get(staff.id);
    setSavingId(staff.id);
    try {
      const response = await fetch(`${API_BASE}/shifts/upsert_entry`, {
        method: "POST", headers: authHeaders(true), body: JSON.stringify({
          shift_day_id: shiftDay.id, staff_id: staff.id, status,
          start_time: current?.start_time || "09:00", end_time: current?.end_time || "18:00",
          assigned_area: current?.assigned_area || "", note: current?.note || "",
        }),
      });
      if (!response.ok) throw new Error();
      await loadDate(date);
    } catch { alert("勤務区分を保存できませんでした。"); }
    finally { setSavingId(""); }
  }

  return <div className="min-h-full bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-lg gap-2"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold" /><button type="button" onClick={() => void loadDate(date)} className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-extrabold text-slate-600">更新</button></div></div>
    <main className="mx-auto max-w-lg px-4 pt-4">
      <section className="grid grid-cols-3 gap-2">{STATUS_OPTIONS.map((status) => <div key={status} className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm"><div className={`text-2xl font-black ${statusTone(status)}`}>{summary[status] || 0}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400">{status}</div></div>)}</section>
      <div className="relative mt-4"><SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="スタッフ名・コードで検索" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-400" /></div>
      {error ? <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}
      <section className="mt-4 space-y-3">{loading ? <>{[0, 1, 2].map((key) => <div key={key} className="h-40 animate-pulse rounded-[22px] bg-white" />)}</> : visibleStaffs.map((staff) => {
        const entry = entries.get(staff.id); const staffSchedules = schedules.filter((item) => item.staff_id === staff.id).sort((a, b) => time(a.start_time).localeCompare(time(b.start_time)));
        return <article key={staff.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setSelectedStaff(staff)} className="block w-full p-4 text-left"><div className="flex items-start justify-between"><div><h2 className="text-lg font-black">{staff.staff_name}</h2><div className="text-xs text-slate-400">{staff.staff_code || ""}</div></div><span className="text-xl text-slate-300">›</span></div>{staffSchedules.length ? <div className="mt-3 space-y-2">{staffSchedules.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2.5"><div className="text-xs font-black text-slate-700">{time(item.start_time)}〜{time(item.end_time)}　{item.place || "場所未設定"}</div><div className="mt-1 text-xs text-slate-500">{[item.work_category, item.details].filter(Boolean).join(" / ") || "詳細なし"}</div></div>)}</div> : <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-400">予定未登録</div>}</button><div className="border-t border-slate-100 px-4 py-3"><label className="text-[10px] font-bold text-slate-400">勤務区分</label><select value={entry?.status || "出勤"} disabled={savingId === staff.id} onChange={(event) => void saveStatus(staff, event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold disabled:opacity-50">{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div></article>;
      })}
      {!loading && visibleStaffs.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">出勤予定のスタッフはいません</div> : null}</section>
    </main>
    {selectedStaff ? <ScheduleSheet staff={selectedStaff} date={date} schedules={schedules.filter((item) => item.staff_id === selectedStaff.id)} canEdit={currentUserId === selectedStaff.id} onClose={() => setSelectedStaff(null)} onChanged={() => void loadDate(date)} /> : null}
  </div>;
}

function ScheduleSheet({ staff, date, schedules, canEdit, onClose, onChanged }: { staff: Staff; date: string; schedules: Schedule[]; canEdit: boolean; onClose: () => void; onChanged: () => void }) {
  const [drafts, setDrafts] = useState<Draft[]>(schedules.sort((a, b) => time(a.start_time).localeCompare(time(b.start_time))).map((item) => ({ id: item.id, start_time: time(item.start_time), end_time: time(item.end_time), place: item.place || "", work_category: item.work_category || "", details: item.details || "" })));
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  function patch(index: number, value: Partial<Draft>) { setDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item)); }
  async function save(index: number) { const draft = drafts[index]; if (draft.end_time <= draft.start_time) return alert("終了時間は開始時間より後にしてください。"); try { setSavingIndex(index); const response = await fetch(`${API_BASE}/staff-schedules/upsert`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ id: draft.id, shift_date: date, staff_id: staff.id, start_time: draft.start_time, end_time: draft.end_time, place: draft.place, work_category: draft.work_category, details: draft.details }) }); if (!response.ok) throw new Error(); const saved = await response.json(); setDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, id: saved.id } : item)); onChanged(); } catch { alert("予定を保存できませんでした。"); } finally { setSavingIndex(null); } }
  async function remove(index: number) { const draft = drafts[index]; if (!draft.id) return setDrafts((items) => items.filter((_, itemIndex) => itemIndex !== index)); if (!confirm("この予定を削除しますか？")) return; try { setSavingIndex(index); const response = await fetch(`${API_BASE}/staff-schedules/delete`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ id: draft.id }) }); if (!response.ok) throw new Error(); setDrafts((items) => items.filter((_, itemIndex) => itemIndex !== index)); onChanged(); } catch { alert("予定を削除できませんでした。"); } finally { setSavingIndex(null); } }
  return <div className="fixed inset-0 z-[100] flex items-end bg-black/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-white"><div className="shrink-0 px-4 pt-3"><div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" /><div className="mx-auto mt-4 flex max-w-lg items-start justify-between"><div><div className="text-xs font-bold text-slate-400">{date} の予定</div><h2 className="text-xl font-black">{staff.staff_name}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold">×</button></div></div><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5"><div className="mx-auto max-w-lg space-y-3">{!canEdit ? <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700">本人のみ編集できます。閲覧専用で表示しています。</div> : null}{drafts.map((draft, index) => <div key={draft.id || index} className="space-y-3 rounded-2xl border border-slate-200 p-4"><div className="grid grid-cols-2 gap-3"><Field label="開始"><select disabled={!canEdit} value={draft.start_time} onChange={(event) => patch(index, { start_time: event.target.value })} className={inputClass}>{TIME_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="終了"><select disabled={!canEdit} value={draft.end_time} onChange={(event) => patch(index, { end_time: event.target.value })} className={inputClass}>{TIME_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></Field></div><Field label="場所"><input disabled={!canEdit} value={draft.place} onChange={(event) => patch(index, { place: event.target.value })} className={inputClass} /></Field><Field label="作業分類"><input disabled={!canEdit} value={draft.work_category} onChange={(event) => patch(index, { work_category: event.target.value })} className={inputClass} /></Field><Field label="詳細"><textarea disabled={!canEdit} value={draft.details} onChange={(event) => patch(index, { details: event.target.value })} rows={3} className={`${inputClass} h-auto resize-none py-3`} /></Field>{canEdit ? <div className="grid grid-cols-2 gap-2"><button type="button" disabled={savingIndex === index} onClick={() => void remove(index)} className="h-10 rounded-xl bg-red-50 text-xs font-extrabold text-red-600">削除</button><button type="button" disabled={savingIndex === index} onClick={() => void save(index)} className="h-10 rounded-xl bg-slate-900 text-xs font-extrabold text-white">保存</button></div> : null}</div>)}{!drafts.length ? <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">予定未登録</div> : null}{canEdit ? <button type="button" onClick={() => setDrafts((items) => [...items, { start_time: "09:00", end_time: "10:00", place: "", work_category: "", details: "" }])} className="h-12 w-full rounded-xl border-2 border-dashed border-slate-300 text-sm font-extrabold text-slate-600">＋予定を追加</button> : null}</div></div></section></div>;
}

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1 block text-[10px] font-bold text-slate-400">{label}</span>{children}</label>; }
function statusTone(status: string) { return status === "出勤" ? "text-emerald-600" : status === "欠勤" ? "text-red-600" : "text-amber-600"; }
function SearchIcon({ className = "h-6 w-6" }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
