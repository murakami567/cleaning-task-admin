import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type PropertyMaster = {
  id: string;
  property_name: string;
  is_active: boolean;
};

type OpeningItem = {
  id: string;
  property_id: string | null;
  property_name: string;
  room_name: string;
  title: string;
  owner_name: string;
  due_date: string | null;
  status: string;
  priority: string;
  progress: number;
  memo: string;
};

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

function Card({ children }: any) {
  return <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">{children}</div>;
}

function Drawer({ open, title, subtitle, children, onClose, footer }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="h-full w-[560px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold">{title}</div>
            {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
          </div>
          <button className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50" onClick={onClose}>×</button>
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

function Select({ value, onChange, options, placeholder }: any) {
  return (
    <select
      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none bg-white"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function StatusBadge({ value }: { value: string }) {
  const cls =
    value === "完了"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "進行中"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : value === "保留"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{value}</span>;
}

function PriorityBadge({ value }: { value: string }) {
  const cls =
    value === "高"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : value === "中"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{value}</span>;
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="mb-1 text-xs text-slate-500">{progress}%</div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </div>
  );
}

export default function OpeningManagementPage() {
  const [items, setItems] = useState<OpeningItem[]>([]);
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<OpeningItem | null>(null);

  const [form, setForm] = useState<OpeningItem>({
    id: "",
    property_id: null,
    property_name: "",
    room_name: "",
    title: "",
    owner_name: "",
    due_date: new Date().toISOString().slice(0, 10),
    status: "未着手",
    priority: "中",
    progress: 0,
    memo: "",
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [oRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/openings`),
        fetch(`${API_BASE}/properties`),
      ]);
      const oData = await oRes.json();
      const pData = await pRes.json();
      setItems(oData);
      setProperties((pData || []).filter((x: PropertyMaster) => x.is_active));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const propertyOptions = useMemo(
    () => properties.map((p) => ({ value: p.id, label: p.property_name })),
    [properties]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items
      .filter((x) => (status === "all" ? true : x.status === status))
      .filter((x) => {
        if (!qq) return true;
        return `${x.title} ${x.property_name} ${x.room_name} ${x.owner_name}`.toLowerCase().includes(qq);
      })
      .slice()
      .sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || ""), "ja"));
  }, [items, q, status]);

  const summary = useMemo(() => {
    return {
      未着手: items.filter((x) => x.status === "未着手").length,
      進行中: items.filter((x) => x.status === "進行中").length,
      保留: items.filter((x) => x.status === "保留").length,
      完了: items.filter((x) => x.status === "完了").length,
    };
  }, [items]);

  const nearest = useMemo(() => {
    return filtered
      .filter((x) => x.status !== "完了")
      .sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || ""), "ja"))[0];
  }, [filtered]);

  const openNew = () => {
    setSelected(null);
    setForm({
      id: "",
      property_id: null,
      property_name: "",
      room_name: "",
      title: "",
      owner_name: "",
      due_date: new Date().toISOString().slice(0, 10),
      status: "未着手",
      priority: "中",
      progress: 0,
      memo: "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (item: OpeningItem) => {
    setSelected(item);
    setForm(item);
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!form.property_name.trim()) return alert("物件を入力してください。");
    if (!form.title.trim()) return alert("案件名を入力してください。");

    const body = {
      property_id: form.property_id,
      property_name: form.property_name,
      room_name: form.room_name,
      title: form.title,
      owner_name: form.owner_name,
      due_date: form.due_date,
      status: form.status,
      priority: form.priority,
      progress: Number(form.progress || 0),
      memo: form.memo,
    };

    const url = selected ? `${API_BASE}/openings/update` : `${API_BASE}/openings/create`;
    const payload = selected ? { opening_id: selected.id, ...body } : body;

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
          <div className="text-xs text-slate-500">管理画面 ＞ 新規オープン進捗</div>
          <div className="text-base font-extrabold mt-1">新規オープン 進捗管理</div>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm">🔎</span>
            <input className="bg-transparent outline-none text-sm w-[260px] max-w-[56vw]" placeholder="検索：物件/号室/担当/タイトル" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <select className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">全ステータス</option>
            {["未着手", "進行中", "保留", "完了"].map((v) => <option value={v} key={v}>{v}</option>)}
          </select>

          <button className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-black" onClick={openNew}>
            ＋案件追加
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="text-sm font-extrabold">案件一覧</div>
            <div className="text-xs text-slate-500 mt-1">行クリックで詳細編集（右ドロワー）</div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-3 py-3">案件</th>
                  <th className="text-left px-3 py-3 w-[120px]">期限</th>
                  <th className="text-left px-3 py-3 w-[110px]">担当</th>
                  <th className="text-left px-3 py-3 w-[110px]">状態</th>
                  <th className="text-left px-3 py-3 w-[110px]">優先</th>
                  <th className="text-left px-3 py-3 w-[140px]">進捗</th>
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
                      <div className="font-extrabold">{it.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{it.property_name} {it.room_name} / {it.id.slice(0, 5)}</div>
                      {it.memo ? <div className="text-xs text-slate-500 mt-2">📝 {it.memo}</div> : null}
                    </td>
                    <td className="px-3 py-4 font-semibold">{it.due_date}</td>
                    <td className="px-3 py-4">{it.owner_name || "-"}</td>
                    <td className="px-3 py-4"><StatusBadge value={it.status} /></td>
                    <td className="px-3 py-4"><PriorityBadge value={it.priority} /></td>
                    <td className="px-3 py-4"><ProgressBar progress={it.progress} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
          <div>
            <div className="text-sm font-extrabold">サマリー</div>
            <div className="text-xs text-slate-500 mt-1">ステータス別の件数・直近期限</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["未着手", "進行中", "保留", "完了"].map((k) => (
              <div key={k} className="rounded-2xl border border-slate-200 p-3">
                <div className="text-xs text-slate-500">{k}</div>
                <div className="text-4xl font-black mt-2">{(summary as any)[k]}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 font-semibold">直近期限（未完了）</div>
            {nearest ? (
              <>
                <div className="mt-2 font-extrabold text-xl">{nearest.title}</div>
                <div className="text-xs text-slate-500 mt-1">期限：{nearest.due_date} / 担当：{nearest.owner_name || "-"}</div>
                <div className="mt-3">
                  <ProgressBar progress={nearest.progress} />
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm mt-2">未完了案件なし</div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={selected ? "案件編集" : "案件追加"}
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
              onChange={(v: string) => {
                const p = properties.find((x) => x.id === v);
                setForm((s) => ({ ...s, property_id: v, property_name: p?.property_name ?? "" }));
              }}
              options={propertyOptions}
              placeholder="物件を選択"
            />
          </Field>

          <Field label="号室">
            <TextInput value={form.room_name} onChange={(v: string) => setForm((s) => ({ ...s, room_name: v }))} />
          </Field>

          <Field label="案件名">
            <TextInput value={form.title} onChange={(v: string) => setForm((s) => ({ ...s, title: v }))} />
          </Field>

          <Field label="担当">
            <TextInput value={form.owner_name} onChange={(v: string) => setForm((s) => ({ ...s, owner_name: v }))} />
          </Field>

          <Field label="期限">
            <TextInput type="date" value={form.due_date || ""} onChange={(v: string) => setForm((s) => ({ ...s, due_date: v }))} />
          </Field>

          <Field label="ステータス">
            <Select value={form.status} onChange={(v: string) => setForm((s) => ({ ...s, status: v }))} options={[
              { value: "未着手", label: "未着手" },
              { value: "進行中", label: "進行中" },
              { value: "保留", label: "保留" },
              { value: "完了", label: "完了" },
            ]} />
          </Field>

          <Field label="優先度">
            <Select value={form.priority} onChange={(v: string) => setForm((s) => ({ ...s, priority: v }))} options={[
              { value: "高", label: "高" },
              { value: "中", label: "中" },
              { value: "低", label: "低" },
            ]} />
          </Field>

          <Field label="進捗（0〜100）">
            <TextInput type="number" value={form.progress} onChange={(v: string) => setForm((s) => ({ ...s, progress: Number(v || 0) }))} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="メモ">
              <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none min-h-[96px]" value={form.memo || ""} onChange={(e) => setForm((s) => ({ ...s, memo: e.target.value }))} />
            </Field>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
