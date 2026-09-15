import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
const STATUS_OPTIONS = ["保留", "対応中", "対応済み"];

type Property = { id: string; property_name: string; is_active: boolean };
type Room = { id: string; property_id: string; room_name: string; room_code: string | null; is_active: boolean };
type Facility = {
  id: string; property_id: string | null; property_name: string; room_name: string;
  assignee: string; content: string; start_date: string | null; end_date: string | null;
  status: string; note: string; photo_url: string | null;
};

const blankForm = (): Facility => ({
  id: "", property_id: null, property_name: "", room_name: "", assignee: "",
  content: "", start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date().toISOString().slice(0, 10), status: "保留", note: "", photo_url: null,
});

function normalizeStatus(value?: string | null) {
  if (["完了", "対応完了", "対応済み"].includes(value || "")) return "対応済み";
  return value === "対応中" ? "対応中" : "保留";
}

function authHeaders(json = false) {
  return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}` };
}

export default function AdminMobileFacilitiesPage() {
  const [items, setItems] = useState<Facility[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<Facility>(blankForm());
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    try {
      setLoading(true); setError("");
      const [facilityResponse, propertyResponse] = await Promise.all([
        fetch(`${API_BASE}/facilities`, { headers: authHeaders() }),
        fetch(`${API_BASE}/properties`, { headers: authHeaders() }),
      ]);
      if (!facilityResponse.ok || !propertyResponse.ok) throw new Error();
      const facilityData: Facility[] = await facilityResponse.json();
      const propertyData: Property[] = await propertyResponse.json();
      setItems((facilityData || []).map((item) => ({ ...item, status: normalizeStatus(item.status) })));
      setProperties((propertyData || []).filter((item) => item.is_active));
    } catch { setError("設備情報を取得できませんでした。"); }
    finally { setLoading(false); }
  }

  async function loadRooms(propertyId: string) {
    if (!propertyId) { setRooms([]); return; }
    const response = await fetch(`${API_BASE}/rooms?property_id=${encodeURIComponent(propertyId)}`, { headers: authHeaders() });
    if (!response.ok) { setRooms([]); return; }
    const data: Room[] = await response.json();
    setRooms((data || []).filter((item) => item.is_active));
  }

  useEffect(() => { void loadAll(); }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("ja");
    return items.filter((item) => status === "all" || normalizeStatus(item.status) === status)
      .filter((item) => !keyword || `${item.property_name} ${item.room_name} ${item.assignee} ${item.content} ${item.note}`.toLocaleLowerCase("ja").includes(keyword))
      .sort((a, b) => String(a.start_date || "").localeCompare(String(b.start_date || "")));
  }, [items, search, status]);

  const counts = useMemo(() => Object.fromEntries(["保留", "対応中", "対応済み"].map((value) => [value, items.filter((item) => normalizeStatus(item.status) === value).length])), [items]);

  function openNew() {
    setEditingId(""); setRooms([]); setForm(blankForm()); setFormOpen(true);
  }

  async function openEdit(item: Facility) {
    setEditingId(item.id); setForm({ ...item, status: normalizeStatus(item.status) });
    await loadRooms(item.property_id || ""); setFormOpen(true);
  }

  async function save() {
    if (!form.property_name.trim()) return alert("物件を選択してください。");
    if (!form.room_name.trim()) return alert("部屋を選択してください。");
    if (!form.content.trim()) return alert("対応内容を入力してください。");
    try {
      setSaving(true);
      const body = {
        property_id: form.property_id, property_name: form.property_name, room_name: form.room_name,
        assignee: form.assignee, content: form.content, start_date: form.start_date,
        end_date: form.end_date, status: normalizeStatus(form.status), note: form.note,
        photo_url: form.photo_url || null,
      };
      const response = await fetch(`${API_BASE}/facilities/${editingId ? "update" : "create"}`, {
        method: "POST", headers: authHeaders(true),
        body: JSON.stringify(editingId ? { facility_id: editingId, ...body } : body),
      });
      if (!response.ok) throw new Error();
      setFormOpen(false); await loadAll();
    } catch { alert("保存に失敗しました。"); }
    finally { setSaving(false); }
  }

  return <div className="min-h-full bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-lg gap-2"><div className="relative flex-1"><SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="物件・部屋・担当・内容を検索" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-orange-400" /></div><button type="button" onClick={openNew} className="h-11 shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-extrabold text-white">＋追加</button></div>
      <div className="mx-auto mt-3 flex max-w-lg gap-2 overflow-x-auto pb-0.5"><Filter active={status === "all"} onClick={() => setStatus("all")}>すべて {items.length}</Filter>{STATUS_OPTIONS.map((value) => <Filter key={value} active={status === value} onClick={() => setStatus(value)}>{value} {counts[value] || 0}</Filter>)}</div>
    </div>

    <main className="mx-auto max-w-lg space-y-3 px-4 pt-4">
      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}
      {loading ? <>{[0, 1, 2].map((key) => <div key={key} className="h-40 animate-pulse rounded-[22px] bg-white" />)}</> : null}
      {!loading && filtered.map((item) => <button key={item.id} type="button" onClick={() => void openEdit(item)} className="block w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white text-left shadow-sm">
        {item.photo_url ? <img src={item.photo_url} alt="設備対応写真" className="h-36 w-full bg-slate-100 object-cover" loading="lazy" /> : null}
        <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-xs font-extrabold text-orange-600">{item.property_name} {item.room_name}</div><h2 className="mt-1 whitespace-pre-wrap text-base font-black leading-snug">{item.content}</h2></div><StatusBadge value={item.status} /></div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs"><div><span className="text-slate-400">担当</span><div className="mt-0.5 font-extrabold">{item.assignee || "未設定"}</div></div><div><span className="text-slate-400">期間</span><div className="mt-0.5 font-extrabold">{shortDate(item.start_date)}〜{shortDate(item.end_date)}</div></div></div>
        {item.note ? <div className="mt-3 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">{item.note}</div> : null}</div>
      </button>)}
      {!loading && filtered.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">該当する設備対応はありません</div> : null}
    </main>

    {formOpen ? <div className="fixed inset-0 z-[100] flex items-end bg-black/40" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setFormOpen(false); }}><section className="flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-white"><div className="shrink-0 px-4 pt-3"><div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" /><div className="mx-auto mt-4 flex max-w-lg items-center justify-between"><div><div className="text-xs font-bold text-slate-400">{editingId ? "登録内容を変更" : "新しい対応を登録"}</div><h2 className="text-xl font-black">設備対応 {editingId ? "編集" : "追加"}</h2></div><button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold">×</button></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5"><div className="mx-auto grid max-w-lg gap-4"><Field label="物件"><select value={form.property_id || ""} onChange={(event) => { const id = event.target.value; const property = properties.find((item) => item.id === id); setForm((current) => ({ ...current, property_id: id || null, property_name: property?.property_name || "", room_name: "" })); void loadRooms(id); }} className={inputClass}><option value="">物件を選択</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.property_name}</option>)}</select></Field>
      <Field label="部屋"><select value={form.room_name} disabled={!form.property_id} onChange={(event) => setForm((current) => ({ ...current, room_name: event.target.value }))} className={`${inputClass} disabled:bg-slate-100`}><option value="">{form.property_id ? "部屋を選択" : "先に物件を選択"}</option>{rooms.map((room) => <option key={room.id} value={room.room_name}>{room.room_name}{room.room_code ? ` / ${room.room_code}` : ""}</option>)}</select></Field>
      <Field label="担当"><input value={form.assignee} onChange={(event) => setForm((current) => ({ ...current, assignee: event.target.value }))} className={inputClass} placeholder="担当者名" /></Field>
      <Field label="状態"><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClass}>{STATUS_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="開始日"><input type="date" value={form.start_date || ""} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} className={inputClass} /></Field><Field label="終了日"><input type="date" value={form.end_date || ""} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} className={inputClass} /></Field></div>
      {form.photo_url ? <Field label="報告写真"><a href={form.photo_url} target="_blank" rel="noreferrer"><img src={form.photo_url} alt="設備対応の報告写真" className="max-h-64 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain" /></a></Field> : null}
      <Field label="対応内容"><textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={4} className={`${inputClass} h-auto resize-none py-3`} placeholder="不具合や対応内容を入力" /></Field>
      <Field label="備考"><textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={4} className={`${inputClass} h-auto resize-none py-3`} placeholder="引き継ぎ事項など" /></Field></div></div>
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"><div className="mx-auto grid max-w-lg grid-cols-[1fr_2fr] gap-3"><button type="button" disabled={saving} onClick={() => setFormOpen(false)} className="h-12 rounded-xl bg-slate-100 text-sm font-extrabold text-slate-600">キャンセル</button><button type="button" disabled={saving} onClick={() => void save()} className="h-12 rounded-xl bg-slate-900 text-sm font-extrabold text-white disabled:opacity-50">{saving ? "保存中…" : "保存"}</button></div></div></section></div> : null}
  </div>;
}

const inputClass = "h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>{children}</label>; }
function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{children}</button>; }
function StatusBadge({ value }: { value: string }) { const normalized = normalizeStatus(value); const tone = normalized === "対応済み" ? "bg-emerald-50 text-emerald-700" : normalized === "対応中" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"; return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tone}`}>{normalized}</span>; }
function shortDate(value?: string | null) { return value ? value.slice(5).replace("-", "/") : "—"; }
function SearchIcon({ className = "h-6 w-6" }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
