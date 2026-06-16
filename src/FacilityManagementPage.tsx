import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type PropertyMaster = {
  id: string;
  property_name: string;
  is_active: boolean;
};

type RoomMaster = {
  id: string;
  property_id: string;
  room_name: string;
  room_code: string | null;
  room_key: string;
  is_active: boolean;
};

type FacilityItem = {
  id: string;
  property_id: string | null;
  property_name: string;
  room_name: string;
  assignee: string;
  content: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  note: string;
};

const FACILITY_STATUS_OPTIONS = ["保留", "対応中", "対応済み"];

function normalizeFacilityStatus(value: string | null | undefined) {
  if (value === "完了" || value === "対応完了" || value === "対応済み") return "対応済み";
  if (value === "対応中") return "対応中";
  return "保留";
}

function Button({ children, className = "", ...props }: any) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Drawer({ open, title, subtitle, children, onClose, footer }: any) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex justify-end bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-full w-[560px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold">{title}</div>
            {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
          </div>
          <button
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">{children}</div>
        <div className="p-4 border-t border-slate-200">{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500 font-semibold">{label}</div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: any) {
  return (
    <input
      type={type}
      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Select({ value, onChange, options, placeholder, disabled = false }: any) {
  return (
    <select
      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none bg-white disabled:bg-slate-50"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = normalizeFacilityStatus(value);
  const cls =
    normalized === "対応済み"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : normalized === "対応中"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{normalized}</span>;
}

export default function FacilityManagementPage() {
  const [items, setItems] = useState<FacilityItem[]>([]);
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<FacilityItem | null>(null);

  const [form, setForm] = useState<FacilityItem>({
    id: "",
    property_id: null,
    property_name: "",
    room_name: "",
    assignee: "",
    content: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    status: "保留",
    note: "",
  });

  const loadAll = async () => {
    const [fRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/facilities`),
      fetch(`${API_BASE}/properties`),
    ]);
    const fData = await fRes.json();
    const pData = await pRes.json();
    setItems((fData || []).map((x: FacilityItem) => ({ ...x, status: normalizeFacilityStatus(x.status) })));
    setProperties((pData || []).filter((x: PropertyMaster) => x.is_active));
  };

  const loadRooms = async (propertyId: string) => {
    if (!propertyId) {
      setRooms([]);
      return;
    }
    const res = await fetch(`${API_BASE}/rooms?property_id=${propertyId}`);
    const data = await res.json();
    setRooms((data || []).filter((x: RoomMaster) => x.is_active));
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const propertyOptions = useMemo(
    () => properties.map((p) => ({ value: p.id, label: p.property_name })),
    [properties]
  );

  const roomOptions = useMemo(
    () =>
      rooms.map((r) => ({
        value: r.room_name,
        label: `${r.room_name}${r.room_code ? ` / ${r.room_code}` : ""}`,
      })),
    [rooms]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items
      .filter((x) => (status === "all" ? true : normalizeFacilityStatus(x.status) === status))
      .filter((x) => {
        if (!qq) return true;
        return `${x.property_name} ${x.room_name} ${x.assignee} ${x.content}`
          .toLowerCase()
          .includes(qq);
      })
      .slice()
      .sort((a, b) => String(a.start_date || "").localeCompare(String(b.start_date || ""), "ja"));
  }, [items, q, status]);

  const openNew = async () => {
    setSelected(null);
    setRooms([]);
    setForm({
      id: "",
      property_id: null,
      property_name: "",
      room_name: "",
      assignee: "",
      content: "",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      status: "保留",
      note: "",
    });
    setDrawerOpen(true);
  };

  const openEdit = async (item: FacilityItem) => {
    setSelected(item);
    setForm({ ...item, status: normalizeFacilityStatus(item.status) });
    if (item.property_id) {
      await loadRooms(item.property_id);
    } else {
      setRooms([]);
    }
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!form.property_name.trim()) return alert("物件を入力してください。");
    if (!form.room_name.trim()) return alert("部屋を選択してください。");
    if (!form.assignee.trim()) return alert("担当を入力してください。");
    if (!form.content.trim()) return alert("対応内容を入力してください。");

    const body = {
      property_id: form.property_id,
      property_name: form.property_name,
      room_name: form.room_name,
      assignee: form.assignee,
      content: form.content,
      start_date: form.start_date,
      end_date: form.end_date,
      status: normalizeFacilityStatus(form.status),
      note: form.note,
    };

    const url = selected ? `${API_BASE}/facilities/update` : `${API_BASE}/facilities/create`;
    const payload = selected ? { facility_id: selected.id, ...body } : body;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return alert("保存に失敗しました。");

    setDrawerOpen(false);
    await loadAll();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="min-w-[200px]">
          <div className="text-xs text-slate-500">管理画面 ＞ 設備管理</div>
          <div className="text-base font-extrabold mt-1">設備管理</div>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm">🔎</span>
            <input
              className="bg-transparent outline-none text-sm w-[320px] max-w-[70vw]"
              placeholder="検索：物件/部屋/担当/内容"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <select
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">全ステータス</option>
            {FACILITY_STATUS_OPTIONS.map((v) => (
              <option value={v} key={v}>
                {v}
              </option>
            ))}
          </select>

          <button
            className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-black"
            onClick={openNew}
          >
            ＋対応追加
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="text-sm font-extrabold">対応一覧</div>
          <div className="text-xs text-slate-500 mt-1">行クリックで詳細編集（ドロワー）</div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-3 py-3">物件/部屋</th>
                <th className="text-left px-3 py-3 w-[130px]">担当</th>
                <th className="text-left px-3 py-3">対応内容</th>
                <th className="text-left px-3 py-3 w-[150px]">期間</th>
                <th className="text-left px-3 py-3 w-[110px]">状態</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr
                  key={it.id}
                  className="border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                  onClick={() => openEdit(it)}
                >
                  <td className="px-3 py-4">
                    <div className="font-extrabold">
                      {it.property_name} {it.room_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">ID: {it.id.slice(0, 5)}</div>
                  </td>
                  <td className="px-3 py-4">{it.assignee}</td>
                  <td className="px-3 py-4">
                    <div className="font-bold">{it.content}</div>
                    {it.note ? <div className="text-xs text-slate-500 mt-1">📝 {it.note}</div> : null}
                  </td>
                  <td className="px-3 py-4 font-semibold">
                    {it.start_date}〜
                    <br />
                    {it.end_date}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge value={it.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={selected ? "設備対応 編集" : "設備対応 追加"}
        subtitle={selected ? `ID: ${selected.id}` : "新規作成"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button onClick={() => setDrawerOpen(false)}>キャンセル</Button>
              <Button className="bg-slate-900 text-white border-slate-900 hover:bg-black" onClick={save}>
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="物件">
            <Select
              value={form.property_id ?? ""}
              onChange={async (v: string) => {
                const p = properties.find((x) => x.id === v);
                setForm((s) => ({
                  ...s,
                  property_id: v,
                  property_name: p?.property_name ?? "",
                  room_name: "",
                }));
                await loadRooms(v);
              }}
              options={propertyOptions}
              placeholder="物件を選択"
            />
          </Field>

          <Field label="部屋（号室）">
            <Select
              value={form.room_name}
              onChange={(v: string) => setForm((s) => ({ ...s, room_name: v }))}
              options={roomOptions}
              placeholder={form.property_id ? "部屋を選択" : "先に物件を選択"}
              disabled={!form.property_id}
            />
          </Field>

          <Field label="担当">
            <TextInput value={form.assignee} onChange={(v: string) => setForm((s) => ({ ...s, assignee: v }))} />
          </Field>

          <Field label="状態">
            <Select
              value={form.status}
              onChange={(v: string) => setForm((s) => ({ ...s, status: v }))}
              options={FACILITY_STATUS_OPTIONS.map((v) => ({ value: v, label: v }))}
            />
          </Field>

          <Field label="開始日">
            <TextInput
              type="date"
              value={form.start_date || ""}
              onChange={(v: string) => setForm((s) => ({ ...s, start_date: v }))}
            />
          </Field>

          <Field label="終了日">
            <TextInput
              type="date"
              value={form.end_date || ""}
              onChange={(v: string) => setForm((s) => ({ ...s, end_date: v }))}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="対応内容">
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none min-h-[88px]"
                value={form.content || ""}
                onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="備考">
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none min-h-[88px]"
                value={form.note || ""}
                onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              />
            </Field>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
