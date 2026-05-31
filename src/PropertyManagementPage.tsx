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
  prep_d?: number | null;
  prep_s?: number | null;
  prep_spare_s?: number | null;
  prep_ta?: number | null;
};

type PrepItem = {
  task_id: string;
  task_date: string;
  property_name: string;
  room_name: string;
  room_key: string;
  towel_count: number | string;
  prep_d: number;
  prep_s: number;
  prep_spare_s: number;
  prep_ta: number;
  note: string;
};

type MainTab = "rooms" | "prep";

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

  const [editPropertyDrawerOpen, setEditPropertyDrawerOpen] = useState(false);
  const [editRoomDrawerOpen, setEditRoomDrawerOpen] = useState(false);

  const [editingProperty, setEditingProperty] = useState<PropertyMaster | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomMaster | null>(null);

  const [propertyEditForm, setPropertyEditForm] = useState({
    id: "",
    property_code: "",
    property_name: "",
    sort_order: "999",
    is_active: true,
  });

  const [roomEditForm, setRoomEditForm] = useState({
    id: "",
    property_id: "",
    room_name: "",
    room_code: "",
    capacity: "1",
    room_sort_order: "999",
    is_active: true,
    prep_d: "0",
    prep_s: "0",
    prep_spare_s: "0",
    prep_ta: "0",
  });

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

  const [mainTab, setMainTab] = useState<MainTab>("rooms");

  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState("");
  const [prepNoteDrafts, setPrepNoteDrafts] = useState<Record<string, string>>({});
  const [prepSavingId, setPrepSavingId] = useState<string | null>(null);

  const [roomBulkMode, setRoomBulkMode] = useState(false);
  const [roomBulkForm, setRoomBulkForm] = useState({
    property_id: "",
    room_names_text: "",
    default_capacity: "1",
    start_sort_order: "1",
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

  const loadPrepList = async () => {
    try {
      setPrepLoading(true);
      setPrepError("");

      const token = localStorage.getItem("admin_access_token") || "";
      const res = await fetch(`${API_BASE}/api/admin-portal/prep-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`prep-list failed: ${res.status}`);

      const data = await res.json();
      const items: PrepItem[] = Array.isArray(data?.items) ? data.items : [];
      setPrepItems(items);

      const draftMap: Record<string, string> = {};
      items.forEach((it) => {
        draftMap[it.task_id] = it.note || "";
      });
      setPrepNoteDrafts(draftMap);
    } catch (e) {
      console.error(e);
      setPrepError("準備物一覧の取得に失敗しました。");
      setPrepItems([]);
    } finally {
      setPrepLoading(false);
    }
  };

  useEffect(() => {
    if (mainTab === "prep") void loadPrepList();
  }, [mainTab]);

  const savePrepNote = async (taskId: string) => {
    const note = prepNoteDrafts[taskId] ?? "";
    try {
      setPrepSavingId(taskId);
      const res = await fetch(`${API_BASE}/tasks/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, note }),
      });
      if (!res.ok) throw new Error(`note update failed: ${res.status}`);
      setPrepItems((prev) =>
        prev.map((it) => (it.task_id === taskId ? { ...it, note } : it))
      );
    } catch (e) {
      console.error(e);
      alert("備考の保存に失敗しました。");
    } finally {
      setPrepSavingId(null);
    }
  };

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

  const createRoomsBulk = async () => {
    try {
      if (!roomBulkForm.property_id) {
        alert("物件を選択してください。");
        return;
      }

      const roomNames = roomBulkForm.room_names_text
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);

      if (roomNames.length === 0) {
        alert("部屋名を1件以上入力してください。");
        return;
      }

      const res = await fetch(`${API_BASE}/rooms/bulk-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: roomBulkForm.property_id,
          room_names: roomNames,
          default_capacity: Number(roomBulkForm.default_capacity || 1),
          start_sort_order: Number(roomBulkForm.start_sort_order || 1),
        }),
      });

      if (!res.ok) throw new Error(`rooms bulk create failed: ${res.status}`);

      await res.json();

      setRoomDrawerOpen(false);
      setRoomBulkMode(false);
      setRoomBulkForm({
        property_id: "",
        room_names_text: "",
        default_capacity: "1",
        start_sort_order: "1",
      });

      await loadAll();
      alert("部屋を一括追加しました。");
    } catch (e) {
      console.error(e);
      alert("部屋の一括追加に失敗しました。");
    }
  };

  const openEditProperty = (property: PropertyMaster) => {
    setEditingProperty(property);
    setPropertyEditForm({
      id: property.id,
      property_code: property.property_code,
      property_name: property.property_name,
      sort_order: String(property.sort_order ?? 999),
      is_active: property.is_active,
    });
    setEditPropertyDrawerOpen(true);
  };

  const openEditRoom = (room: RoomMaster) => {
    setEditingRoom(room);
    setRoomEditForm({
      id: room.id,
      property_id: room.property_id,
      room_name: room.room_name,
      room_code: room.room_code ?? "",
      capacity: String(room.capacity ?? 1),
      room_sort_order: String(room.room_sort_order ?? 999),
      is_active: room.is_active,
      prep_d: String(room.prep_d ?? 0),
      prep_s: String(room.prep_s ?? 0),
      prep_spare_s: String(room.prep_spare_s ?? 0),
      prep_ta: String(room.prep_ta ?? 0),
    });
    setEditRoomDrawerOpen(true);
  };

  const savePropertyEdit = async () => {
    try {
      if (!propertyEditForm.id) return;
      if (!propertyEditForm.property_code.trim()) {
        alert("物件コードを入力してください。");
        return;
      }
      if (!propertyEditForm.property_name.trim()) {
        alert("物件名を入力してください。");
        return;
      }

      const res = await fetch(`${API_BASE}/properties/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyEditForm.id,
          property_code: propertyEditForm.property_code.trim(),
          property_name: propertyEditForm.property_name.trim(),
          normalized_name: propertyEditForm.property_name.trim(),
          sort_order: Number(propertyEditForm.sort_order || 999),
          is_active: propertyEditForm.is_active,
        }),
      });

      if (!res.ok) throw new Error(`property update failed: ${res.status}`);

      await res.json();
      setEditPropertyDrawerOpen(false);
      setEditingProperty(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("物件更新に失敗しました。");
    }
  };

  const saveRoomEdit = async () => {
    try {
      if (!roomEditForm.id) return;
      if (!roomEditForm.property_id) {
        alert("物件を選択してください。");
        return;
      }
      if (!roomEditForm.room_name.trim()) {
        alert("部屋名を入力してください。");
        return;
      }

      const property = properties.find((p) => p.id === roomEditForm.property_id);
      if (!property) {
        alert("物件が見つかりません。");
        return;
      }

      const roomCode = roomEditForm.room_code.trim() || roomEditForm.room_name.trim();
      const roomKey = `${property.property_name}${roomEditForm.room_name.trim()}`;

      const res = await fetch(`${API_BASE}/rooms/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomEditForm.id,
          property_id: roomEditForm.property_id,
          room_name: roomEditForm.room_name.trim(),
          room_code: roomCode,
          room_key: roomKey,
          normalized_room_key: roomKey,
          capacity: Number(roomEditForm.capacity || 1),
          room_sort_order: Number(roomEditForm.room_sort_order || 999),
          is_active: roomEditForm.is_active,
          prep_d: Number(roomEditForm.prep_d || 0),
          prep_s: Number(roomEditForm.prep_s || 0),
          prep_spare_s: Number(roomEditForm.prep_spare_s || 0),
          prep_ta: Number(roomEditForm.prep_ta || 0),
        }),
      });

      if (!res.ok) throw new Error(`room update failed: ${res.status}`);

      await res.json();
      setEditRoomDrawerOpen(false);
      setEditingRoom(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("部屋更新に失敗しました。");
    }
  };

  const deleteRoom = async () => {
    try {
      if (!roomEditForm.id) return;
      if (!window.confirm("この部屋を削除しますか？")) return;

      const res = await fetch(`${API_BASE}/rooms/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomEditForm.id,
        }),
      });

      if (!res.ok) throw new Error(`room delete failed: ${res.status}`);

      await res.json();
      setEditRoomDrawerOpen(false);
      setEditingRoom(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("部屋削除に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-black tracking-tight">物件管理</div>
          <div className="mt-1 text-sm text-slate-500">
            {mainTab === "rooms"
              ? "物件マスタ・部屋マスタを管理します。"
              : "翌日以降の清掃に対する準備物を確認します。"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {mainTab === "rooms" ? (
            <>
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
                  setRoomBulkForm((p) => ({ ...p, property_id: selectedPropertyId || "" }));
                  setRoomDrawerOpen(true);
                }}
              >
                ＋部屋追加
              </Button>
              <Button onClick={() => void loadAll()}>更新</Button>
            </>
          ) : (
            <Button onClick={() => void loadPrepList()}>更新</Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <ChipButton active={mainTab === "rooms"} onClick={() => setMainTab("rooms")}>
          物件・部屋一覧
        </ChipButton>
        <ChipButton active={mainTab === "prep"} onClick={() => setMainTab("prep")}>
          準備物確認
        </ChipButton>
      </div>

      {mainTab === "rooms" ? (
        <>
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
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold">物件一覧</div>
                <div className="text-xs text-slate-500 mt-1">{filteredProperties.length} 件</div>
              </div>
              <div className="flex gap-2">
                <ChipButton active={activeFilter === "active"} onClick={() => setActiveFilter("active")}>
                  有効のみ
                </ChipButton>
                <ChipButton active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>
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
                        <div className={`mt-1 text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>
                          {roomCount} 室
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge on={p.is_active} />
                        <button
                          type="button"
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            selected
                              ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProperty(p);
                          }}
                        >
                          編集
                        </button>
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
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋名</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋コード</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">room_key</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">定員</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">並び順</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">有効</th>
                      <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">操作</th>
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
                        <td className="border-b px-4 py-3">
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50"
                            onClick={() => openEditRoom(r)}
                          >
                            編集
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
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
        </>
      ) : null}

      {mainTab === "prep" ? (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold">準備物確認（翌日以降）</div>
                <div className="text-xs text-slate-500 mt-1">
                  {prepLoading ? "読み込み中..." : `${prepItems.length} 件`}
                </div>
              </div>
            </div>

            {prepError ? (
              <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {prepError}
              </div>
            ) : null}

            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="border-b px-3 py-2 text-left w-[100px]">清掃日</th>
                    <th className="border-b px-3 py-2 text-left">部屋</th>
                    <th className="border-b px-3 py-2 text-right w-[70px]">タオル</th>
                    <th className="border-b px-3 py-2 text-right w-[60px]">D</th>
                    <th className="border-b px-3 py-2 text-right w-[60px]">S</th>
                    <th className="border-b px-3 py-2 text-right w-[70px]">予備S</th>
                    <th className="border-b px-3 py-2 text-right w-[60px]">タ</th>
                    <th className="border-b px-3 py-2 text-left min-w-[220px]">備考</th>
                    <th className="border-b px-3 py-2 text-left w-[100px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {prepItems.length === 0 && !prepLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                        翌日以降の清掃タスクはありません。
                      </td>
                    </tr>
                  ) : null}

                  {prepItems.map((it) => {
                    const draft = prepNoteDrafts[it.task_id] ?? "";
                    const dirty = (draft ?? "") !== (it.note ?? "");
                    return (
                      <tr key={it.task_id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-2 align-top">{it.task_date}</td>
                        <td className="px-3 py-2 align-top">
                          <div className="font-bold text-slate-900">{it.property_name}</div>
                          <div className="text-xs text-slate-500">{it.room_name}</div>
                        </td>
                        <td className="px-3 py-2 align-top text-right">{it.towel_count}</td>
                        <td className="px-3 py-2 align-top text-right">{it.prep_d}</td>
                        <td className="px-3 py-2 align-top text-right">{it.prep_s}</td>
                        <td className="px-3 py-2 align-top text-right">{it.prep_spare_s}</td>
                        <td className="px-3 py-2 align-top text-right">{it.prep_ta}</td>
                        <td className="px-3 py-2 align-top">
                          <textarea
                            value={draft}
                            onChange={(e) =>
                              setPrepNoteDrafts((prev) => ({
                                ...prev,
                                [it.task_id]: e.target.value,
                              }))
                            }
                            placeholder="備考を入力"
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Button
                            className={
                              dirty
                                ? "bg-slate-900 text-white border-slate-900 hover:bg-black"
                                : ""
                            }
                            onClick={() => void savePrepNote(it.task_id)}
                            disabled={prepSavingId === it.task_id || !dirty}
                          >
                            {prepSavingId === it.task_id ? "保存中" : "保存"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : null}

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
        subtitle="単体追加または一括追加ができます。"
        onClose={() => {
          setRoomDrawerOpen(false);
          setRoomBulkMode(false);
        }}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、部屋一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRoomDrawerOpen(false);
                  setRoomBulkMode(false);
                }}
              >
                キャンセル
              </Button>

              <Button
                className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                onClick={roomBulkMode ? createRoomsBulk : createRoom}
              >
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <ChipButton active={!roomBulkMode} onClick={() => setRoomBulkMode(false)}>
              単体追加
            </ChipButton>
            <ChipButton active={roomBulkMode} onClick={() => setRoomBulkMode(true)}>
              一括追加
            </ChipButton>
          </div>

          {!roomBulkMode ? (
            <>
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
            </>
          ) : (
            <>
              <Field label="物件">
                <Select
                  value={roomBulkForm.property_id}
                  onChange={(v) => setRoomBulkForm((p) => ({ ...p, property_id: v }))}
                  options={propertyOptions}
                  placeholder="物件を選択"
                />
              </Field>

              <Field label="部屋名一覧（改行区切り）">
                <textarea
                  className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  value={roomBulkForm.room_names_text}
                  onChange={(e) =>
                    setRoomBulkForm((p) => ({ ...p, room_names_text: e.target.value }))
                  }
                  placeholder={`101
102
103
201
202`}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="デフォルト定員">
                  <TextInput
                    type="number"
                    value={roomBulkForm.default_capacity}
                    onChange={(v) =>
                      setRoomBulkForm((p) => ({ ...p, default_capacity: v }))
                    }
                    placeholder="1"
                  />
                </Field>

                <Field label="開始並び順">
                  <TextInput
                    type="number"
                    value={roomBulkForm.start_sort_order}
                    onChange={(v) =>
                      setRoomBulkForm((p) => ({ ...p, start_sort_order: v }))
                    }
                    placeholder="1"
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </Drawer>

      <Drawer
        open={editPropertyDrawerOpen}
        title="物件編集"
        subtitle={editingProperty ? `${editingProperty.property_name} を編集します。` : ""}
        onClose={() => setEditPropertyDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button onClick={() => setEditPropertyDrawerOpen(false)}>キャンセル</Button>
              <Button
                className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                onClick={savePropertyEdit}
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
              value={propertyEditForm.property_code}
              onChange={(v) => setPropertyEditForm((p) => ({ ...p, property_code: v }))}
            />
          </Field>

          <Field label="物件名">
            <TextInput
              value={propertyEditForm.property_name}
              onChange={(v) => setPropertyEditForm((p) => ({ ...p, property_name: v }))}
            />
          </Field>

          <Field label="並び順">
            <TextInput
              type="number"
              value={propertyEditForm.sort_order}
              onChange={(v) => setPropertyEditForm((p) => ({ ...p, sort_order: v }))}
            />
          </Field>

          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={propertyEditForm.is_active}
              onChange={(e) =>
                setPropertyEditForm((p) => ({ ...p, is_active: e.target.checked }))
              }
            />
            有効
          </label>
        </div>
      </Drawer>

      <Drawer
        open={editRoomDrawerOpen}
        title="部屋編集"
        subtitle={editingRoom ? `${editingRoom.room_key} を編集します。` : ""}
        onClose={() => setEditRoomDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button
                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                onClick={deleteRoom}
              >
                削除
              </Button>
              <Button onClick={() => setEditRoomDrawerOpen(false)}>キャンセル</Button>
              <Button
                className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                onClick={saveRoomEdit}
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
              value={roomEditForm.property_id}
              onChange={(v) => setRoomEditForm((p) => ({ ...p, property_id: v }))}
              options={propertyOptions}
              placeholder="物件を選択"
            />
          </Field>

          <Field label="部屋名">
            <TextInput
              value={roomEditForm.room_name}
              onChange={(v) => setRoomEditForm((p) => ({ ...p, room_name: v }))}
            />
          </Field>

          <Field label="部屋コード">
            <TextInput
              value={roomEditForm.room_code}
              onChange={(v) => setRoomEditForm((p) => ({ ...p, room_code: v }))}
            />
          </Field>

          <Field label="定員">
            <TextInput
              type="number"
              value={roomEditForm.capacity}
              onChange={(v) => setRoomEditForm((p) => ({ ...p, capacity: v }))}
            />
          </Field>

          <Field label="並び順">
            <TextInput
              type="number"
              value={roomEditForm.room_sort_order}
              onChange={(v) => setRoomEditForm((p) => ({ ...p, room_sort_order: v }))}
            />
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-bold text-slate-600">準備物（部屋ごと）</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="D">
                <TextInput
                  type="number"
                  value={roomEditForm.prep_d}
                  onChange={(v) => setRoomEditForm((p) => ({ ...p, prep_d: v }))}
                />
              </Field>
              <Field label="S">
                <TextInput
                  type="number"
                  value={roomEditForm.prep_s}
                  onChange={(v) => setRoomEditForm((p) => ({ ...p, prep_s: v }))}
                />
              </Field>
              <Field label="予備S">
                <TextInput
                  type="number"
                  value={roomEditForm.prep_spare_s}
                  onChange={(v) => setRoomEditForm((p) => ({ ...p, prep_spare_s: v }))}
                />
              </Field>
              <Field label="タ">
                <TextInput
                  type="number"
                  value={roomEditForm.prep_ta}
                  onChange={(v) => setRoomEditForm((p) => ({ ...p, prep_ta: v }))}
                />
              </Field>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={roomEditForm.is_active}
              onChange={(e) =>
                setRoomEditForm((p) => ({ ...p, is_active: e.target.checked }))
              }
            />
            有効
          </label>
        </div>
      </Drawer>
    </div>
  );
}
