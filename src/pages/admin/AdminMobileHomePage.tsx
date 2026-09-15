import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Task = {
  id: string; property_name: string; room_name: string; task_date: string;
  checkout_date?: string; next_checkin_date?: string | null;
  next_guest_count?: number; next_stay_nights?: number; load_score?: number;
  status: string; note?: string | null; assigned_staff_name?: string | null;
  assigned_staff_names?: string[] | null; early_checkin_time?: string | null;
  late_checkout_time?: string | null;
};
type ViewMode = "today" | "future" | "date";
type TaskKind = "cleaning" | "other";
type OtherTask = {
  id: string; status: string; category: string; title: string;
  task_date: string; deadline?: string | null; assignee_names?: string[] | null;
  checker_name?: string | null; note?: string | null;
};

const categoryLabels: Record<string, string> = {
  WAREHOUSE: "倉庫作業", TRANSPORT: "運搬", LINEN: "荷受け",
  INSPECTION: "設備対応", PURCHASE: "買い出し", OTHER: "その他",
};

const statusOptions = ["未着手", "清掃開始", "清掃中", "完了", "チェック完了", "持越", "CXL"];
const otherStatusOptions = ["未着手", "対応中", "完了"];
const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const assignees = (task: Task) => task.assigned_staff_names?.filter(Boolean).join("・") || task.assigned_staff_name || "未割当";
const towelCount = (task: Task) => {
  if (["FFFホテル", "やなぎ橋"].includes(task.property_name)) return "—";
  const guests = Number(task.next_guest_count || 0);
  const nights = Number(task.next_stay_nights || 0);
  return guests && nights ? `${Math.min(nights, 3) * guests}枚` : "—";
};
const statusStyle = (status: string) => {
  if (["清掃開始", "清掃中"].includes(status)) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "完了") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "チェック完了") return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  if (status === "持越") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (status === "CXL") return "bg-slate-800 text-white ring-slate-800";
  return "bg-white text-slate-600 ring-slate-200";
};

export default function AdminMobileHomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_access_token") || "";
  const [mode, setMode] = useState<ViewMode>("today");
  const [taskKind, setTaskKind] = useState<TaskKind>("cleaning");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [otherTasks, setOtherTasks] = useState<OtherTask[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loadTasks = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const endpoint = mode === "today" ? "/tasks/today" : mode === "future" ? "/tasks/future" : `/tasks/by-date?date=${encodeURIComponent(selectedDate)}`;
      const [response, otherResponse] = await Promise.all([
        fetch(`${API_BASE}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/non-cleaning-tasks`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("admin_access_token"); localStorage.removeItem("admin_user");
        navigate("/mobile/login", { replace: true }); return;
      }
      if (!response.ok) throw new Error();
      const data = await response.json();
      const cleaningItems = Array.isArray(data) ? data : [];
      setTasks(cleaningItems);
      if (!otherResponse.ok) throw new Error();
      const otherData = await otherResponse.json();
      const otherItems = Array.isArray(otherData) ? otherData : [];
      setOtherTasks(otherItems);
      setNoteDrafts((current) => {
        const next = { ...current };
        [...cleaningItems, ...otherItems].forEach((task) => {
          if (next[task.id] === undefined) next[task.id] = task.note || "";
        });
        return next;
      });
    } catch { setError("タスクを取得できませんでした。再読み込みしてください。"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [mode, navigate, selectedDate, token]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  async function updateStatus(task: Task, status: string) {
    const previous = task.status;
    setUpdatingId(task.id);
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status } : item));
    try {
      const response = await fetch(`${API_BASE}/tasks/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: task.id, status, note: noteDrafts[task.id] ?? task.note ?? "" }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: previous } : item));
      setError("ステータスを更新できませんでした。");
    } finally { setUpdatingId(""); }
  }

  async function updateNote(task: Task) {
    const note = noteDrafts[task.id] ?? task.note ?? "";
    setUpdatingId(task.id);
    try {
      const response = await fetch(`${API_BASE}/tasks/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: task.id, note }),
      });
      if (!response.ok) throw new Error();
      setTasks((items) => items.map((item) => item.id === task.id ? { ...item, note } : item));
    } catch { setError("備考を保存できませんでした。"); }
    finally { setUpdatingId(""); }
  }

  async function updateOtherStatus(task: OtherTask, status: string) {
    const previous = task.status;
    setUpdatingId(task.id);
    setOtherTasks((items) => items.map((item) => item.id === task.id ? { ...item, status } : item));
    try {
      const response = await fetch(`${API_BASE}/non-cleaning-tasks/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          task_id: task.id, status, category: task.category, title: task.title,
          task_date: task.task_date, deadline: task.deadline || null,
          assignee_names: task.assignee_names || [], checker_name: task.checker_name || null,
          note: noteDrafts[task.id] ?? task.note ?? "",
        }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setOtherTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: previous } : item));
      setError("ステータスを更新できませんでした。");
    } finally { setUpdatingId(""); }
  }

  async function updateOtherNote(task: OtherTask) {
    const note = noteDrafts[task.id] ?? task.note ?? "";
    setUpdatingId(task.id);
    try {
      const response = await fetch(`${API_BASE}/non-cleaning-tasks/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: task.id, status: task.status, note }),
      });
      if (!response.ok) throw new Error();
      setOtherTasks((items) => items.map((item) => item.id === task.id ? { ...item, note } : item));
    } catch { setError("備考を保存できませんでした。"); }
    finally { setUpdatingId(""); }
  }

  const visibleTasks = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ja");
    const filtered = keyword ? tasks.filter((task) => [task.property_name, task.room_name, assignees(task), task.note || ""].join(" ").toLocaleLowerCase("ja").includes(keyword)) : tasks;
    return [...filtered].sort((a, b) => `${a.task_date}-${a.property_name}-${a.room_name}`.localeCompare(`${b.task_date}-${b.property_name}-${b.room_name}`, "ja", { numeric: true }));
  }, [search, tasks]);
  const counts = useMemo(() => ({
    all: tasks.length,
    waiting: tasks.filter((task) => task.status === "未着手").length,
    working: tasks.filter((task) => ["清掃開始", "清掃中"].includes(task.status)).length,
    done: tasks.filter((task) => ["完了", "チェック完了"].includes(task.status)).length,
  }), [tasks]);
  const visibleOtherTasks = useMemo(() => {
    const dateFiltered = otherTasks.filter((task) => {
      const date = String(task.task_date || "").slice(0, 10);
      if (mode === "today") return date === todayIso();
      if (mode === "future") return date > todayIso();
      return date === selectedDate;
    });
    const keyword = search.trim().toLocaleLowerCase("ja");
    return keyword ? dateFiltered.filter((task) => [task.title, categoryLabels[task.category] || task.category, task.assignee_names?.join("・") || "", task.note || ""].join(" ").toLocaleLowerCase("ja").includes(keyword)) : dateFiltered;
  }, [mode, otherTasks, search, selectedDate]);

  return <div className="bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <div className="grid flex-1 grid-cols-3 rounded-xl bg-slate-100 p-1">
          {([['today', '今日'], ['future', '明日以降'], ['date', '日付指定']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-lg px-2 py-2 text-xs font-bold ${mode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{label}</button>)}
        </div>
        <button type="button" onClick={() => void loadTasks(true)} disabled={refreshing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50" aria-label="更新"><RefreshIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /></button>
      </div>
      {mode === "date" ? <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mx-auto mt-2 block h-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold" /> : null}
    </div>

    <main className="mx-auto max-w-lg px-4 pt-4">
      <div className="mb-4 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setTaskKind("cleaning")} className={`rounded-xl py-2.5 text-sm font-extrabold ${taskKind === "cleaning" ? "bg-slate-900 text-white" : "text-slate-500"}`}>清掃タスク <span className="ml-1 text-xs opacity-70">{tasks.length}</span></button>
        <button type="button" onClick={() => setTaskKind("other")} className={`rounded-xl py-2.5 text-sm font-extrabold ${taskKind === "other" ? "bg-slate-900 text-white" : "text-slate-500"}`}>清掃外タスク <span className="ml-1 text-xs opacity-70">{visibleOtherTasks.length}</span></button>
      </div>
      {taskKind === "cleaning" ? <section className="grid grid-cols-4 gap-2">
        <CountCard label="すべて" value={counts.all} color="text-slate-900" /><CountCard label="未着手" value={counts.waiting} color="text-slate-500" /><CountCard label="清掃中" value={counts.working} color="text-amber-600" /><CountCard label="完了" value={counts.done} color="text-emerald-600" />
      </section> : <section className="grid grid-cols-3 gap-2"><CountCard label="すべて" value={visibleOtherTasks.length} color="text-slate-900" /><CountCard label="未着手" value={visibleOtherTasks.filter((task) => task.status === "未着手").length} color="text-slate-500" /><CountCard label="対応・完了" value={visibleOtherTasks.filter((task) => task.status !== "未着手").length} color="text-emerald-600" /></section>}
      <div className="relative mt-4"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="物件・部屋・担当者を検索" className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div>
      {error ? <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

      <div className="mt-4 space-y-3">
        {loading ? <>{[0,1,2].map((key) => <div key={key} className="h-44 animate-pulse rounded-[22px] bg-white" />)}</> : null}
        {!loading && taskKind === "cleaning" && visibleTasks.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">該当する清掃タスクはありません</div> : null}
        {!loading && taskKind === "cleaning" && visibleTasks.map((task) => {
          const expanded = expandedId === task.id;
          const sameDay = task.checkout_date && task.next_checkin_date === task.checkout_date;
          return <article key={task.id} className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <button type="button" onClick={() => setExpandedId(expanded ? "" : task.id)} className="w-full p-4 text-left">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2">{mode !== "today" ? <span className="text-xs font-bold text-slate-400">{task.task_date.slice(5).replace('-', '/')}</span> : null}{sameDay ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">当日</span> : null}</div><h2 className="mt-1 truncate text-lg font-extrabold">{task.property_name}</h2><div className="mt-0.5 text-2xl font-black tracking-tight">{task.room_name}</div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${statusStyle(task.status)}`}>{task.status === "清掃開始" ? "清掃中" : task.status}</span></div>
              <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3"><div className="text-[10px] font-bold text-slate-400">担当者</div><div className="mt-1 flex flex-wrap gap-1.5">{task.assigned_staff_names?.filter(Boolean).length ? task.assigned_staff_names.filter(Boolean).map((name) => <span key={name} className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">{name}</span>) : <span className="text-xs font-extrabold text-slate-700">{task.assigned_staff_name || "未割当"}</span>}</div><div className="mt-3 grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 pt-3"><Metric label="負荷" value={`${task.load_score || 0}点`} /><Metric label="タオル" value={towelCount(task)} /></div></div>
              {(task.early_checkin_time || task.late_checkout_time) ? <div className="mt-3 flex gap-2 text-xs font-bold">{task.early_checkin_time ? <span className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-orange-700">早CI {task.early_checkin_time.slice(0,5)}</span> : null}{task.late_checkout_time ? <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-blue-700">遅CO {task.late_checkout_time.slice(0,5)}</span> : null}</div> : null}
            </button>
            {expanded ? <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3"><div><label className="text-[11px] font-bold text-slate-500">備考</label><textarea value={noteDrafts[task.id] ?? task.note ?? ""} onChange={(e) => setNoteDrafts((items) => ({ ...items, [task.id]: e.target.value }))} rows={4} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="備考を入力" /><button type="button" disabled={updatingId === task.id || (noteDrafts[task.id] ?? task.note ?? "") === (task.note ?? "")} onClick={() => void updateNote(task)} className="mt-2 h-10 w-full rounded-xl bg-slate-900 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400">備考を保存</button></div><div><label className="text-[11px] font-bold text-slate-500">ステータスを変更</label><select value={task.status} disabled={updatingId === task.id} onChange={(e) => void updateStatus(task, e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold disabled:opacity-50">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></div></div> : null}
          </article>;
        })}
        {!loading && taskKind === "other" && visibleOtherTasks.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">該当する清掃外タスクはありません</div> : null}
        {!loading && taskKind === "other" && visibleOtherTasks.map((task) => {
          const expanded = expandedId === task.id;
          return <article key={task.id} className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <button type="button" onClick={() => setExpandedId(expanded ? "" : task.id)} className="w-full p-4 text-left">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="text-[11px] font-extrabold text-orange-600">{categoryLabels[task.category] || task.category}</span><h2 className="mt-1 text-lg font-extrabold">{task.title}</h2></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${statusStyle(task.status)}`}>{task.status}</span></div>
              <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3"><div className="text-[10px] font-bold text-slate-400">担当者</div><div className="mt-1 flex flex-wrap gap-1.5">{task.assignee_names?.filter(Boolean).length ? task.assignee_names.filter(Boolean).map((name) => <span key={name} className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">{name}</span>) : <span className="text-xs font-extrabold text-slate-700">未割当</span>}</div><div className="mt-3 grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 pt-3"><Metric label="日付" value={String(task.task_date).slice(5,10).replace('-', '/')} /><Metric label="期限" value={task.deadline ? String(task.deadline).slice(0,5) : "—"} /></div></div>
            </button>
            {expanded ? <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3"><div><label className="text-[11px] font-bold text-slate-500">備考</label><textarea value={noteDrafts[task.id] ?? task.note ?? ""} onChange={(e) => setNoteDrafts((items) => ({ ...items, [task.id]: e.target.value }))} rows={4} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" placeholder="備考を入力" /><button type="button" disabled={updatingId === task.id || (noteDrafts[task.id] ?? task.note ?? "") === (task.note ?? "")} onClick={() => void updateOtherNote(task)} className="mt-2 h-10 w-full rounded-xl bg-slate-900 text-sm font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400">備考を保存</button></div><div><label className="text-[11px] font-bold text-slate-500">ステータスを変更</label><select value={task.status} disabled={updatingId === task.id} onChange={(e) => void updateOtherStatus(task, e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold disabled:opacity-50">{otherStatusOptions.map((status) => <option key={status}>{status}</option>)}</select></div></div> : null}
          </article>;
        })}
      </div>
    </main>

  </div>;
}

function CountCard({ label, value, color }: { label: string; value: number; color: string }) { return <div className="rounded-2xl bg-white px-1 py-3 text-center shadow-sm"><div className={`text-xl font-black ${color}`}>{value}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400">{label}</div></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-0 px-2 text-center"><div className="text-[10px] font-bold text-slate-400">{label}</div><div className="mt-1 truncate text-xs font-extrabold text-slate-700">{value}</div></div>; }
type IconProps = { className?: string }; type IconType = (props: IconProps) => JSX.Element;
const icon = (children: React.ReactNode): IconType => ({ className = "h-6 w-6" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>;
const RefreshIcon = icon(<><path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 1 5"/></>); const SearchIcon = icon(<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>);
