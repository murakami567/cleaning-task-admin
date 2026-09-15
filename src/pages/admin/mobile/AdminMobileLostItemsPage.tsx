import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
type LostItem = { id: string; task_date: string; property_name: string; room_name: string; item_description: string; photo_url: string; reported_by_name: string; created_at: string };

function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}` }; }

export default function AdminMobileLostItemsPage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState("");

  async function load() {
    try {
      setLoading(true); setError("");
      const response = await fetch(`${API_BASE}/api/admin-portal/lost-items`, { headers: authHeaders() });
      if (!response.ok) throw new Error();
      const data = await response.json(); setItems(Array.isArray(data?.items) ? data.items : []);
    } catch { setItems([]); setError("忘れ物一覧を取得できませんでした。"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ja");
    return items.filter((item) => !date || item.task_date === date)
      .filter((item) => !keyword || `${item.property_name} ${item.room_name} ${item.item_description} ${item.reported_by_name}`.toLocaleLowerCase("ja").includes(keyword));
  }, [date, items, search]);

  return <div className="min-h-full bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto max-w-lg"><div className="relative"><SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="物件・部屋・品目・報告者を検索" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-400" /></div><div className="mt-2 flex gap-2"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold" />{date ? <button type="button" onClick={() => setDate("")} className="h-10 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-500">解除</button> : null}<button type="button" onClick={() => void load()} className="h-10 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600">更新</button></div></div></div>
    <main className="mx-auto max-w-lg px-4 pt-4"><div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"><span>忘れ物報告は閲覧専用です。</span><span>{filtered.length}件</span></div>{error ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</div> : null}<section className="mt-4 space-y-3">{loading ? <>{[0, 1, 2].map((key) => <div key={key} className="h-44 animate-pulse rounded-[22px] bg-white" />)}</> : filtered.map((item) => <article key={item.id} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"><div className="flex gap-3 p-4">{item.photo_url ? <button type="button" onClick={() => setPhoto(item.photo_url)} className="shrink-0"><img src={item.photo_url} alt="忘れ物" className="h-24 w-24 rounded-2xl border border-slate-200 bg-slate-100 object-cover" /></button> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-400">写真なし</div>}<div className="min-w-0 flex-1"><div className="text-xs font-extrabold text-orange-600">{item.task_date || "日付なし"}</div><h2 className="mt-1 whitespace-pre-wrap text-base font-black leading-snug">{item.item_description || "品目未入力"}</h2><div className="mt-2 text-sm font-bold text-slate-700">{item.property_name || "—"} {item.room_name || "—"}</div></div></div><div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span className="font-bold">報告者：</span>{item.reported_by_name || "—"}<span className="ml-3">{formatDateTime(item.created_at)}</span></div></article>)}{!loading && filtered.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">該当する忘れ物はありません</div> : null}</section></main>
    {photo ? <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4" onClick={() => setPhoto("")}><img src={photo} alt="忘れ物 拡大" className="max-h-[90dvh] max-w-full rounded-2xl object-contain" /></div> : null}
  </div>;
}

function formatDateTime(value: string) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function SearchIcon({ className = "h-6 w-6" }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
