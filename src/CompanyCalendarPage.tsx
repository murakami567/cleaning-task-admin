import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
const ORDER_MANAGEMENT_URL = import.meta.env.VITE_ORDER_MANAGEMENT_URL || "https://order-management-hoq5.onrender.com";
const GUSK_PROPERTY_MANAGEMENT_URL = import.meta.env.VITE_GUSK_PROPERTY_MANAGEMENT_URL || "https://gusk-property-management.onrender.com";
const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type Staff = { id: string; staff_name: string };
type PortalSchedule = { id: string; start_date: string; end_date: string; assignee_ids: string[]; assignee_names: string[]; title: string; description: string };
type OrderDueSchedule = { id: string; order_no: string; item_name: string; quantity: number | null; unit: string | null; usage_place: string | null; delivery_place: string | null; supplier: string | null; due_date: string };
type ConstructionSchedule = { id: string; property_name: string; contractor: string; work_content: string; status: string; start_date?: string | null; end_date?: string | null; actual_end_date?: string | null };
type Draft = { id?: string; start_date: string; end_date: string; assignee_ids: string[]; assignee_names: string[]; title: string; description: string };

function pad2(n: number) { return String(n).padStart(2, "0"); }
function dateString(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function inRange(target: string, start: string, end: string) { return target >= start && target <= end; }
function normalize(value: unknown): string[] { return Array.isArray(value) ? value.filter(Boolean).map(String) : []; }
function monthCells(year: number, month: number) {
  const first = new Date(year, month - 1, 1); const start = first.getDay(); const last = new Date(year, month, 0).getDate();
  const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < start; i++) { const d = new Date(year, month - 1, 1 - (start - i)); cells.push({ date: dateString(d), day: d.getDate(), inMonth: false }); }
  for (let day = 1; day <= last; day++) { const d = new Date(year, month - 1, day); cells.push({ date: dateString(d), day, inMonth: true }); }
  while (cells.length % 7) { const d = new Date(year, month - 1, last + (cells.length - start - last) + 1); cells.push({ date: dateString(d), day: d.getDate(), inMonth: false }); }
  return cells;
}

export default function CompanyCalendarPage() {
  const navigate = useNavigate(); const token = localStorage.getItem("admin_access_token") || ""; const now = new Date();
  const [year, setYear] = useState(now.getFullYear()); const [month, setMonth] = useState(now.getMonth() + 1);
  const [staffs, setStaffs] = useState<Staff[]>([]); const [schedules, setSchedules] = useState<PortalSchedule[]>([]);
  const [orders, setOrders] = useState<OrderDueSchedule[]>([]); const [constructions, setConstructions] = useState<ConstructionSchedule[]>([]);
  const [loading, setLoading] = useState(false); const [modal, setModal] = useState(false); const [saving, setSaving] = useState(false); const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState<Draft>({ start_date: "", end_date: "", assignee_ids: [], assignee_names: [], title: "", description: "" });
  const cells = useMemo(() => monthCells(year, month), [year, month]);

  async function authFetch(url: string, init?: RequestInit) {
    const res = await fetch(url, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) { localStorage.removeItem("admin_access_token"); localStorage.removeItem("admin_user"); navigate("/admin/login"); throw new Error("認証期限が切れました。"); }
    return res;
  }

  useEffect(() => { if (!token) return; void loadStaffs(); }, [token]);
  useEffect(() => { if (!token) return; void loadMonth(); }, [token, year, month]);

  async function loadStaffs() { try { const res = await authFetch(`${API_BASE}/staffs`); const data = await res.json(); setStaffs(Array.isArray(data) ? data : []); } catch (e) { console.error(e); } }
  async function loadMonth() {
    setLoading(true);
    try {
      const [sr, or, cr] = await Promise.all([
        authFetch(`${API_BASE}/api/admin-portal/calendar-schedules?year=${year}&month=${month}`),
        authFetch(`${API_BASE}/api/admin-portal/order-due-schedules?year=${year}&month=${month}`),
        authFetch(`${API_BASE}/api/admin-portal/construction-schedules?year=${year}&month=${month}`),
      ]);
      const [sd, od, cd] = await Promise.all([sr.json(), or.json(), cr.json()]);
      setSchedules(Array.isArray(sd?.schedules) ? sd.schedules.map((x: any) => ({ id: String(x.id), start_date: x.start_date, end_date: x.end_date, assignee_ids: normalize(x.assignee_ids), assignee_names: normalize(x.assignee_names), title: x.title || "", description: x.description || "" })) : []);
      setOrders(Array.isArray(od?.items) ? od.items.filter((x: any) => x.due_date).map((x: any) => ({ ...x, id: String(x.id) })) : []);
      setConstructions(Array.isArray(cd?.items) ? cd.items.map((x: any) => ({ ...x, id: String(x.id) })) : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  function prevMonth() { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); }
  function today() { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); }
  function create(date?: string) { const base = date || dateString(new Date()); setDraft({ start_date: base, end_date: base, assignee_ids: [], assignee_names: [], title: "", description: "" }); setModal(true); }
  function edit(x: PortalSchedule) { setDraft({ ...x, assignee_ids: [...x.assignee_ids], assignee_names: [...x.assignee_names] }); setModal(true); }
  function toggleStaff(s: Staff) { setDraft(p => p.assignee_ids.includes(s.id) ? { ...p, assignee_ids: p.assignee_ids.filter(id => id !== s.id), assignee_names: p.assignee_names.filter(n => n !== s.staff_name) } : { ...p, assignee_ids: [...p.assignee_ids, s.id], assignee_names: [...p.assignee_names, s.staff_name] }); }
  async function save() {
    if (!draft.start_date || !draft.end_date || !draft.title.trim()) return alert("開始日・終了日・タイトルを入力してください。");
    if (draft.end_date < draft.start_date) return alert("終了日は開始日以降にしてください。");
    setSaving(true);
    try {
      const url = draft.id ? `${API_BASE}/api/admin-portal/calendar-schedules/${draft.id}` : `${API_BASE}/api/admin-portal/calendar-schedules`;
      const res = await authFetch(url, { method: draft.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ start_date: draft.start_date, end_date: draft.end_date, assignee_ids: draft.assignee_ids, assignee_names: draft.assignee_names, title: draft.title, description: draft.description }) });
      const data = await res.json(); if (!res.ok) throw new Error(data?.detail || "保存に失敗しました。"); setModal(false); await loadMonth();
    } catch (e) { alert(e instanceof Error ? e.message : "保存に失敗しました。"); } finally { setSaving(false); }
  }
  async function remove() {
    if (!draft.id || !confirm("このスケジュールを削除しますか？")) return; setDeleting(true);
    try { const res = await authFetch(`${API_BASE}/api/admin-portal/calendar-schedules/${draft.id}`, { method: "DELETE" }); const data = await res.json(); if (!res.ok) throw new Error(data?.detail || "削除に失敗しました。"); setModal(false); await loadMonth(); }
    catch (e) { alert(e instanceof Error ? e.message : "削除に失敗しました。"); } finally { setDeleting(false); }
  }

  return <div className="p-4 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-2xl font-bold text-slate-900">全社カレンダー</h2><p className="mt-1 text-sm text-slate-500">社内予定・発注納期・工事予定をまとめて確認します。</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={prevMonth} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">前月</button>
          <div className="min-w-[120px] text-center font-bold">{year}年 {month}月</div>
          <button onClick={nextMonth} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">次月</button>
          <button onClick={today} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">今日</button>
          <button onClick={() => create()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">＋ 予定を追加</button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[1050px] grid grid-cols-7 gap-2">
          {WEEK_LABELS.map(x => <div key={x} className="rounded-xl bg-slate-100 py-2 text-center text-sm font-bold text-slate-600">{x}</div>)}
          {cells.map(cell => {
            const daySchedules = schedules.filter(x => inRange(cell.date, x.start_date, x.end_date));
            const dayOrders = orders.filter(x => x.due_date === cell.date);
            const dayConstructions = constructions.filter(x => x.start_date && x.end_date ? inRange(cell.date, x.start_date, x.end_date) : [x.start_date, x.end_date, x.actual_end_date].filter(Boolean).includes(cell.date));
            return <div key={cell.date} className={`min-h-[180px] rounded-2xl border p-2 ${cell.inMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-400"}`}>
              <button onClick={() => create(cell.date)} className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold hover:bg-slate-100">{cell.day}</button>
              <div className="space-y-1">
                {daySchedules.slice(0, 3).map(x => <button key={`s-${x.id}`} onClick={() => edit(x)} className="block w-full rounded-lg bg-slate-900 px-2 py-1.5 text-left text-xs text-white hover:bg-slate-700"><div className="truncate font-bold">{x.title}</div>{x.assignee_names.length ? <div className="truncate text-[10px] text-slate-300">{x.assignee_names.join("・")}</div> : null}</button>)}
                {dayOrders.slice(0, 2).map(x => <button key={`o-${x.id}`} onClick={() => window.open(ORDER_MANAGEMENT_URL, "_blank", "noopener,noreferrer")} className="block w-full rounded-lg bg-amber-50 px-2 py-1.5 text-left text-xs text-amber-900 hover:bg-amber-100"><div className="truncate font-bold">発注：{x.item_name || "品名未設定"}</div><div className="truncate text-[10px]">{x.quantity ?? "-"}{x.unit || ""} / {x.delivery_place || x.usage_place || "配送先未設定"}</div></button>)}
                {dayConstructions.slice(0, 2).map(x => <button key={`c-${x.id}`} onClick={() => window.open(GUSK_PROPERTY_MANAGEMENT_URL, "_blank", "noopener,noreferrer")} className="block w-full rounded-lg bg-sky-50 px-2 py-1.5 text-left text-xs text-sky-900 hover:bg-sky-100"><div className="truncate font-bold">工事：{x.property_name || "物件未設定"}</div><div className="truncate text-[10px]">{x.work_content || "工事内容未設定"}</div></button>)}
                {daySchedules.length + dayOrders.length + dayConstructions.length > 7 ? <div className="px-1 text-[11px] font-bold text-slate-500">他 {daySchedules.length + dayOrders.length + dayConstructions.length - 7} 件</div> : null}
              </div>
            </div>;
          })}
        </div>
      </div>
      {loading ? <div className="mt-4 text-sm text-slate-500">カレンダーを読み込み中...</div> : null}
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600"><span>■ 社内予定</span><span className="text-amber-800">■ 発注納期</span><span className="text-sky-800">■ 工事予定</span></div>
    </div>

    {modal ? <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><h3 className="text-xl font-bold">{draft.id ? "社内予定を編集" : "社内予定を追加"}</h3>{draft.id ? <button onClick={remove} disabled={deleting} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{deleting ? "削除中..." : "削除"}</button> : null}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">開始日<input type="date" value={draft.start_date} onChange={e => setDraft(p => ({ ...p, start_date: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label><label className="text-sm font-bold text-slate-700">終了日<input type="date" value={draft.end_date} onChange={e => setDraft(p => ({ ...p, end_date: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" /></label></div>
        <label className="mt-4 block text-sm font-bold text-slate-700">タイトル<input value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3" placeholder="予定タイトル" /></label>
        <div className="mt-4"><div className="text-sm font-bold text-slate-700">担当者</div><div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3">{staffs.map(s => <button type="button" key={s.id} onClick={() => toggleStaff(s)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${draft.assignee_ids.includes(s.id) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{s.staff_name}</button>)}</div></div>
        <label className="mt-4 block text-sm font-bold text-slate-700">内容<textarea value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
        <div className="mt-6 flex gap-3"><button onClick={() => setModal(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold">キャンセル</button><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "保存中..." : "保存"}</button></div>
      </div>
    </div> : null}
  </div>;
}
