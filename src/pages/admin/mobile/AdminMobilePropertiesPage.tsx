import { useEffect, useMemo, useState } from "react";
import type { PrepItem, PropertyMaster, RoomMaster } from "../../../property-management/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Tab = "master" | "prep";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("admin_access_token") || ""}` };
}

export default function AdminMobilePropertiesPage() {
  const [tab, setTab] = useState<Tab>("master");
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);
  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [viewingRoom, setViewingRoom] = useState<RoomMaster | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [prepDate, setPrepDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [prepLoading, setPrepLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [propertyResponse, roomResponse] = await Promise.all([
          fetch(`${API_BASE}/properties`, { headers: authHeaders() }),
          fetch(`${API_BASE}/rooms`, { headers: authHeaders() }),
        ]);
        if (!propertyResponse.ok || !roomResponse.ok) throw new Error();
        const propertyData: PropertyMaster[] = await propertyResponse.json();
        const roomData: RoomMaster[] = await roomResponse.json();
        setProperties([...propertyData].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
        setRooms(roomData);
      } catch {
        setError("物件・客室情報を取得できませんでした。");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab !== "prep" || prepItems.length > 0) return;
    void (async () => {
      try {
        setPrepLoading(true);
        const response = await fetch(`${API_BASE}/api/admin-portal/prep-list`, { headers: authHeaders() });
        if (!response.ok) throw new Error();
        const data: PrepItem[] = await response.json();
        setPrepItems(Array.isArray(data) ? data : []);
      } catch {
        setError("準備物一覧を取得できませんでした。");
      } finally {
        setPrepLoading(false);
      }
    })();
  }, [prepItems.length, tab]);

  const selectedProperty = properties.find((item) => item.id === selectedPropertyId) ?? null;
  const keyword = search.trim().toLocaleLowerCase("ja");
  const propertyRows = useMemo(() => properties.filter((property) => {
    if (!showInactive && !property.is_active) return false;
    if (!keyword) return true;
    const propertyRooms = rooms.filter((room) => room.property_id === property.id);
    return [property.property_name, property.property_code, property.address, property.entrance_number, ...propertyRooms.flatMap((room) => [room.room_name, room.room_code, room.room_key])]
      .some((value) => String(value || "").toLocaleLowerCase("ja").includes(keyword));
  }), [keyword, properties, rooms, showInactive]);
  const roomRows = useMemo(() => rooms
    .filter((room) => room.property_id === selectedPropertyId)
    .filter((room) => !keyword || [room.room_name, room.room_code, room.room_key, room.keybox_number, room.mailbox_number, room.wifi_ssid, room.note]
      .some((value) => String(value || "").toLocaleLowerCase("ja").includes(keyword)))
    .sort((a, b) => (a.room_sort_order ?? 999) - (b.room_sort_order ?? 999)), [keyword, rooms, selectedPropertyId]);
  const prepRows = useMemo(() => prepItems
    .filter((item) => !prepDate || item.task_date === prepDate)
    .filter((item) => !keyword || `${item.property_name} ${item.room_name} ${item.room_key} ${item.note || ""}`.toLocaleLowerCase("ja").includes(keyword))
    .sort((a, b) => `${a.task_date}${a.room_key}`.localeCompare(`${b.task_date}${b.room_key}`, "ja", { numeric: true })), [keyword, prepDate, prepItems]);

  return <div className="min-h-full bg-[#f4f6f8] text-slate-900">
    <div className="sticky top-[65px] z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-2 rounded-xl bg-slate-100 p-1">
        <TabButton active={tab === "master"} onClick={() => { setTab("master"); setSearch(""); }}>物件・客室</TabButton>
        <TabButton active={tab === "prep"} onClick={() => { setTab("prep"); setSelectedPropertyId(""); setSearch(""); }}>準備物</TabButton>
      </div>
    </div>

    <main className="mx-auto max-w-lg px-4 pt-4">
      {tab === "master" && selectedProperty ? <button type="button" onClick={() => { setSelectedPropertyId(""); setSearch(""); }} className="mb-3 flex items-center gap-1 text-sm font-extrabold text-slate-600"><span className="text-xl">‹</span>物件一覧へ戻る</button> : null}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "prep" ? "日付・物件・部屋を検索" : selectedProperty ? "部屋・鍵・Wi-Fiを検索" : "物件・部屋を検索"} className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
      </div>

      {tab === "master" && !selectedProperty ? <label className="mt-3 flex items-center justify-end gap-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="h-4 w-4 accent-orange-600" />無効な物件も表示</label> : null}
      {tab === "prep" ? <input type="date" value={prepDate} onChange={(event) => setPrepDate(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold" /> : null}
      {error ? <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div> : null}

      {tab === "master" && !selectedProperty ? <section className="mt-4 space-y-3">
        {loading ? <Skeletons /> : propertyRows.map((property) => {
          const propertyRooms = rooms.filter((room) => room.property_id === property.id);
          return <button key={property.id} type="button" onClick={() => { setSelectedPropertyId(property.id); setSearch(""); }} className="block w-full rounded-[22px] border border-slate-200/80 bg-white p-4 text-left shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[11px] font-extrabold text-orange-600">{property.property_code}</div><h2 className="mt-1 text-lg font-black">{property.property_name}</h2></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${property.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{property.is_active ? "運用中" : "無効"}</span></div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><span className="text-xs font-bold text-slate-500">登録客室</span><span className="text-sm font-black">{propertyRooms.length}室 <span className="ml-1 text-slate-400">›</span></span></div>
            {property.address ? <div className="mt-3 text-xs leading-relaxed text-slate-500">{property.address}</div> : null}
          </button>;
        })}
        {!loading && propertyRows.length === 0 ? <Empty text="該当する物件はありません" /> : null}
      </section> : null}

      {tab === "master" && selectedProperty ? <section className="mt-4">
        <div className="mb-3 rounded-[22px] bg-slate-900 p-4 text-white"><div className="text-xs font-bold text-orange-300">{selectedProperty.property_code}</div><h1 className="mt-1 text-xl font-black">{selectedProperty.property_name}</h1><div className="mt-2 text-xs text-slate-300">{roomRows.length}室を表示</div></div>
        <div className="space-y-3">{roomRows.map((room) => <button key={room.id} type="button" onClick={() => setViewingRoom(room)} className="block w-full rounded-[20px] border border-slate-200 bg-white p-4 text-left shadow-sm"><div className="flex items-center justify-between gap-3"><div><div className="text-xl font-black">{room.room_name}</div><div className="mt-1 text-xs text-slate-400">定員 {room.capacity ?? "—"}名</div></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${room.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{room.is_active ? "運用中" : "無効"}</span><span className="text-xl text-slate-300">›</span></div></div></button>)}</div>
        {roomRows.length === 0 ? <Empty text="該当する客室はありません" /> : null}
      </section> : null}

      {tab === "prep" ? <section className="mt-4 space-y-3">
        {prepLoading ? <Skeletons /> : prepRows.map((item) => <article key={item.task_id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-extrabold text-orange-600">{formatDate(item.task_date)}</div><h2 className="mt-1 text-lg font-black">{item.property_name} {item.room_name}</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold">タオル {item.towel_count || "—"}</span></div><div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-slate-50 p-3 text-center"><PrepMetric label="D" value={item.prep_d} /><PrepMetric label="S" value={item.prep_s} /><PrepMetric label="予備S" value={item.prep_spare_s} /><PrepMetric label="TA" value={item.prep_ta} /></div>{item.note ? <div className="mt-3 whitespace-pre-wrap rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900"><div className="mb-1 text-[10px] font-extrabold text-amber-600">備考</div>{item.note}</div> : null}</article>)}
        {!prepLoading && prepRows.length === 0 ? <Empty text="該当する準備物はありません" /> : null}
      </section> : null}
    </main>

    {viewingRoom && selectedProperty ? <RoomDetail property={selectedProperty} room={viewingRoom} onClose={() => setViewingRoom(null)} /> : null}
  </div>;
}

function RoomDetail({ property, room, onClose }: { property: PropertyMaster; room: RoomMaster; onClose: () => void }) {
  const rows: Array<[string, string | number | null | undefined, boolean?]> = [
    ["定員", room.capacity == null ? "—" : `${room.capacity}名`], ["キーボックス", room.keybox_number], ["予備鍵", room.spare_key_number], ["ポスト", room.mailbox_number], ["Wi-Fi SSID", room.wifi_ssid], ["Wi-Fi パスワード", room.wifi_password], ["D", room.prep_d], ["S", room.prep_s], ["予備S", room.prep_spare_s], ["TA", room.prep_ta], ["備考", room.note, true],
  ];
  return <div className="fixed inset-0 z-[100] flex items-end bg-black/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="max-h-[82vh] w-full overflow-y-auto rounded-t-[28px] bg-white px-4 pb-8 pt-3"><div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" /><div className="mx-auto max-w-lg"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-bold text-orange-600">{property.property_name}</div><h2 className="mt-1 text-2xl font-black">{room.room_name}</h2></div><button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold">×</button></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">{rows.map(([label, value, wide]) => <div key={label} className={`border-b border-slate-100 px-4 py-3 last:border-b-0 ${wide ? "block" : "flex items-start justify-between gap-4"}`}><div className="text-xs font-bold text-slate-400">{label}</div><div className={`${wide ? "mt-1 whitespace-pre-wrap text-left" : "text-right"} break-all text-sm font-bold text-slate-800`}>{value === null || value === undefined || value === "" ? "—" : value}</div></div>)}</div></div></div></div>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-lg py-2.5 text-sm font-extrabold ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{children}</button>; }
function PrepMetric({ label, value }: { label: string; value: number }) { return <div><div className="text-[10px] font-bold text-slate-400">{label}</div><div className="mt-1 text-sm font-black">{value || 0}</div></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl bg-white px-5 py-12 text-center text-sm text-slate-400">{text}</div>; }
function Skeletons() { return <>{[0, 1, 2].map((key) => <div key={key} className="h-32 animate-pulse rounded-[22px] bg-white" />)}</>; }
function formatDate(value: string) { const date = String(value || "").slice(0, 10); return date ? date.replaceAll("-", "/") : "日付未設定"; }
type IconProps = { className?: string };
function SearchIcon({ className = "h-6 w-6" }: IconProps) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
