import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type PropertyMaster = {
  id: string;
  property_code: string;
  property_name: string;
  normalized_name: string | null;
  sort_order: number | null;
  is_active: boolean;
};

type RoomMaster = {
  id: string;
  property_id: string;
  room_name: string;
  room_code: string | null;
  room_key: string;
  normalized_room_key: string | null;
  capacity: number | null;
  room_sort_order: number | null;
  is_active: boolean;
};

function ChipButton({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-bold border transition",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function Button({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({ on }: { on: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border",
        on
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", on ? "bg-emerald-500" : "bg-rose-500"].join(" ")} />
      {on ? "ON" : "OFF"}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex justify-end bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-full w-[520px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold">{title}</div>
            {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
          </div>
          <button
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
            onClick={onClose}
            type="button"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500 font-semibold">{label}</div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function PropertyManagementPage() {
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [propertyDrawerOpen, setPropertyDrawerOpen] = useState(false);
  const [roomDrawerOpen, setRoomDrawerOpen] = useState(false);

  const [propertySearch, setPropertySearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"active" | "all">("active");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [roomSearch, setRoomSearch] = useState("");

  const [propertyForm, setPropertyForm] = useState({
    property_code: "",
    property_name: "",
    sort_order: "999",
  });

  const [roomForm, setRoomForm] = useState({
    property_id: "",
    room_name: "",
    room_code: "",
    capacity: "1",
    room_sort_order: "999",
  });

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [pRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/properties`),
        fetch(`${API_BASE}/rooms`),
      ]);

      if (!pRes.ok) throw new Error(`properties failed: ${pRes.status}`);
      if (!rRes.ok) throw new Error(`rooms failed: ${rRes.status}`);

      const pData: PropertyMaster[] = await pRes.json();
      const rData: RoomMaster[] = await rRes.json();

      const sortedProps = [...pData].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      setProperties(sortedProps);
      setRooms(rData);

      setSelectedPropertyId((prev) => {
        if (prev && sortedProps.some((p) => p.id === prev)) return prev;
        return sortedProps[0]?.id ?? "";
      });
    } catch (e) {
      console.error(e);
      setError("物件・部屋データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );

  const filteredProperties = useMemo(() => {
    const q = propertySearch.trim().toLowerCase();

    return properties
      .filter((p) => (activeFilter === "all" ? true : p.is_active))
      .filter((p) => {
        if (!q) return true;
        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [properties, propertySearch, activeFilter]);

  const filteredRooms = useMemo(() => {
    if (!selectedProperty) return [];

    const q = roomSearch.trim().toLowerCase();

    return rooms
      .filter((r) => r.property_id === selectedProperty.id)
      .filter((r) => (activeFilter === "all" ? true : r.is_active))
      .filter((r) => {
        if (!q) return true;
        return `${r.room_name} ${r.room_code ?? ""} ${r.room_key}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.room_sort_order ?? 999) - (b.room_sort_order ?? 999));
  }, [rooms, selectedProperty, roomSearch, activeFilter]);

  const propertyOptions = useMemo(
    () =>
      properties
        .filter((p) => p.is_active)
        .map((p) => ({
          value: p.id,
          label: p.property_name,
        })),
    [properties]
  );

  const createProperty = async () => {
    try {
      if (!propertyForm.property_code.trim()) {
        alert("物件コードを入力してください。");
        return;
      }
      if (!propertyForm.property_name.trim()) {
        alert("物件名を入力してください。");
        return;
      }

      const res = await fetch(`${API_BASE}/properties/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_code: propertyForm.property_code.trim(),
          property_name: propertyForm.property_name.trim(),
          normalized_name: propertyForm.property_name.trim(),
          sort_order: Number(propertyForm.sort_order || 999),
          is_active: true,
        }),
      });

      if (!res.ok) throw new Error(`property create failed: ${res.status}`);

      await res.json();
      setPropertyDrawerOpen(false);
      setPropertyForm({
        property_code: "",
        property_name: "",
        sort_order: "999",
      });
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("物件追加に失敗しました。");
    }
  };

  const createRoom = async () => {
    try {
      if (!roomForm.property_id) {
        alert("物件を選択してください。");
        return;
      }
      if (!roomForm.room_name.trim()) {
        alert("部屋名を入力してください。");
        return;
      }

      const property = properties.find((p) => p.id === roomForm.property_id);
      if (!property) {
        alert("物件が見つかりません。");
        return;
      }

      const roomCode = roomForm.room_code.trim() || roomForm.room_name.trim();
      const roomKey = `${property.property_name}${roomForm.room_name.trim()}`;

      const res = await fetch(`${API_BASE}/rooms/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: roomForm.property_id,
          room_name: roomForm.room_name.trim(),
          room_code: roomCode,
          room_key: roomKey,
          normalized_room_key: roomKey,
          capacity: Number(roomForm.capacity || 1),
          room_sort_order: Number(roomForm.room_sort_order || 999),
          is_active: true,
        }),
      });

      if (!res.ok) throw new Error(`room create failed: ${res.status}`);

      await res.json();
      setRoomDrawerOpen(false);
      setRoomForm({
        property_id: "",
        room_name: "",
        room_code: "",
        capacity: "1",
        room_sort_order: "999",
      });
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("部屋追加に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-black tracking-tight">物件管理</div>
          <div className="mt-1 text-sm text-slate-500">物件マスタ・部屋マスタを管理します。</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
            onClick={() => setPropertyDrawerOpen(true)}
          >
            ＋物件追加
          </Button>
          <Button
            className="border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
            onClick={() => {
              setRoomForm((p) => ({ ...p, property_id: selectedPropertyId || "" }));
              setRoomDrawerOpen(true);
            }}
          >
            ＋部屋追加
          </Button>
          <Button onClick={() => void loadAll()}>更新</Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          読み込み中...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* 左：物件一覧 */}
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold">物件一覧</div>
                <div className="text-xs text-slate-500 mt-1">{filteredProperties.length} 件</div>
              </div>
              <div className="flex gap-2">
                <ChipButton
                  active={activeFilter === "active"}
                  onClick={() => setActiveFilter("active")}
                >
                  有効のみ
                </ChipButton>
                <ChipButton
                  active={activeFilter === "all"}
                  onClick={() => setActiveFilter("all")}
                >
                  すべて
                </ChipButton>
              </div>
            </div>

            <div className="mb-4">
              <TextInput
                value={propertySearch}
                onChange={setPropertySearch}
                placeholder="物件名・物件コード・キーで検索"
              />
            </div>

            <div className="space-y-2">
              {filteredProperties.map((p) => {
                const selected = p.id === selectedPropertyId;
                const roomCount = rooms.filter((r) => r.property_id === p.id).length;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPropertyId(p.id)}
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold">
                          {p.sort_order ?? 999}. {p.property_name}
                        </div>
                        <div className={`mt-1 text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>
                          {p.property_code} / {p.normalized_name ?? p.property_name}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge on={p.is_active} />
                        <div className={`text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>
                          {roomCount} 室
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredProperties.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  表示できる物件がありません。
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>

        {/* 右：部屋一覧 */}
        <Card>
          <CardBody>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold">
                  部屋一覧{selectedProperty ? ` / ${selectedProperty.property_name}` : ""}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedProperty ? `${filteredRooms.length} 件` : "物件を選択してください"}
                </div>
              </div>

              <div className="w-full max-w-sm">
                <TextInput
                  value={roomSearch}
                  onChange={setRoomSearch}
                  placeholder="部屋名・部屋コード・room_keyで検索"
                />
              </div>
            </div>

            {!selectedProperty ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                左の物件一覧から対象物件を選択してください。
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋名</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋コード</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">room_key</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">定員</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">並び順</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">有効</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="border-b px-4 py-3 font-medium">{r.room_name}</td>
                        <td className="border-b px-4 py-3">{r.room_code}</td>
                        <td className="border-b px-4 py-3">{r.room_key}</td>
                        <td className="border-b px-4 py-3">{r.capacity ?? ""}</td>
                        <td className="border-b px-4 py-3">{r.room_sort_order ?? ""}</td>
                        <td className="border-b px-4 py-3">
                          <Badge on={r.is_active} />
                        </td>
                      </tr>
                    ))}

                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                          表示できる部屋がありません。
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Drawer
        open={propertyDrawerOpen}
        title="物件追加"
        subtitle="物件マスタに新しい物件を追加します。"
        onClose={() => setPropertyDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button onClick={() => setPropertyDrawerOpen(false)}>キャンセル</Button>
              <Button
                className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                onClick={createProperty}
              >
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="物件コード">
            <TextInput
              value={propertyForm.property_code}
              onChange={(v) => setPropertyForm((p) => ({ ...p, property_code: v }))}
              placeholder="例）ATLAS"
            />
          </Field>

          <Field label="物件名">
            <TextInput
              value={propertyForm.property_name}
              onChange={(v) => setPropertyForm((p) => ({ ...p, property_name: v }))}
              placeholder="例）アトラス"
            />
          </Field>

          <Field label="並び順">
            <TextInput
              type="number"
              value={propertyForm.sort_order}
              onChange={(v) => setPropertyForm((p) => ({ ...p, sort_order: v }))}
              placeholder="999"
            />
          </Field>
        </div>
      </Drawer>

      <Drawer
        open={roomDrawerOpen}
        title="部屋追加"
        subtitle="選択した物件、または指定した物件に部屋を追加します。"
        onClose={() => setRoomDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、部屋一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button onClick={() => setRoomDrawerOpen(false)}>キャンセル</Button>
              <Button
                className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                onClick={createRoom}
              >
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="物件">
            <Select
              value={roomForm.property_id}
              onChange={(v) => setRoomForm((p) => ({ ...p, property_id: v }))}
              options={propertyOptions}
              placeholder="物件を選択"
            />
          </Field>

          <Field label="部屋名">
            <TextInput
              value={roomForm.room_name}
              onChange={(v) => setRoomForm((p) => ({ ...p, room_name: v }))}
              placeholder="例）101"
            />
          </Field>

          <Field label="部屋コード">
            <TextInput
              value={roomForm.room_code}
              onChange={(v) => setRoomForm((p) => ({ ...p, room_code: v }))}
              placeholder="例）101"
            />
          </Field>

          <Field label="定員">
            <TextInput
              type="number"
              value={roomForm.capacity}
              onChange={(v) => setRoomForm((p) => ({ ...p, capacity: v }))}
              placeholder="1"
            />
          </Field>

          <Field label="並び順">
            <TextInput
              type="number"
              value={roomForm.room_sort_order}
              onChange={(v) => setRoomForm((p) => ({ ...p, room_sort_order: v }))}
              placeholder="999"
            />
          </Field>
        </div>
      </Drawer>
    </div>
  );
}
