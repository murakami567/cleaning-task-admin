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
      className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white shadow-sm">{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

function Drawer({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/30 transition ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-semibold">{title}</div>
          <Button onClick={onClose}>閉じる</Button>
        </div>
        <div className="h-[calc(100%-120px)] overflow-auto p-4">{children}</div>
        <div className="border-t p-4">{footer}</div>
      </div>
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
      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
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
      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs text-black/50">{label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardBody>
    </Card>
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
  const [roomSearch, setRoomSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

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

      setProperties(pData);
      setRooms(rData);
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

  const propertyNameMap = useMemo(() => {
    return Object.fromEntries(properties.map((p) => [p.id, p.property_name]));
  }, [properties]);

  const propertyOptions = useMemo(
    () =>
      properties
        .filter((p) => p.is_active)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
        .map((p) => ({
          value: p.id,
          label: p.property_name,
        })),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    return [...properties]
      .filter((p) => (showInactive ? true : p.is_active))
      .filter((p) => {
        const keyword = propertySearch.trim().toLowerCase();
        if (!keyword) return true;
        return (
          p.property_name.toLowerCase().includes(keyword) ||
          p.property_code.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [properties, propertySearch, showInactive]);

  const filteredRooms = useMemo(() => {
    return [...rooms]
      .filter((r) => (showInactive ? true : r.is_active))
      .filter((r) => {
        const keyword = roomSearch.trim().toLowerCase();
        if (!keyword) return true;
        const propertyName = propertyNameMap[r.property_id] ?? "";
        return (
          r.room_name.toLowerCase().includes(keyword) ||
          (r.room_code ?? "").toLowerCase().includes(keyword) ||
          r.room_key.toLowerCase().includes(keyword) ||
          propertyName.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const pa = properties.find((p) => p.id === a.property_id)?.sort_order ?? 999;
        const pb = properties.find((p) => p.id === b.property_id)?.sort_order ?? 999;
        if (pa !== pb) return pa - pb;
        return (a.room_sort_order ?? 999) - (b.room_sort_order ?? 999);
      });
  }, [rooms, properties, propertyNameMap, roomSearch, showInactive]);

  const groupedRooms = useMemo(() => {
    const map = new Map<string, RoomMaster[]>();

    filteredRooms.forEach((room) => {
      if (!map.has(room.property_id)) {
        map.set(room.property_id, []);
      }
      map.get(room.property_id)!.push(room);
    });

    return [...map.entries()].map(([propertyId, roomList]) => ({
      propertyId,
      propertyName: propertyNameMap[propertyId] ?? propertyId,
      rooms: roomList,
    }));
  }, [filteredRooms, propertyNameMap]);

  const propertyCount = properties.length;
  const roomCount = rooms.length;
  const activePropertyCount = properties.filter((p) => p.is_active).length;
  const activeRoomCount = rooms.filter((r) => r.is_active).length;

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
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">物件管理</div>
          <div className="text-xs text-black/60">物件マスタと部屋マスタを管理します。</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="border-blue-200 bg-blue-50 hover:bg-blue-100"
            onClick={() => setPropertyDrawerOpen(true)}
          >
            ＋物件追加
          </Button>
          <Button
            className="border-orange-200 bg-orange-50 hover:bg-orange-100"
            onClick={() => setRoomDrawerOpen(true)}
          >
            ＋部屋追加
          </Button>
          <Button onClick={() => void loadAll()}>更新</Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mb-4 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black/60">
          読み込み中...
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="物件数" value={propertyCount} />
        <StatCard label="部屋数" value={roomCount} />
        <StatCard label="有効物件" value={activePropertyCount} />
        <StatCard label="有効部屋" value={activeRoomCount} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardBody>
            <div className="mb-2 text-sm font-semibold">物件検索</div>
            <TextInput
              value={propertySearch}
              onChange={setPropertySearch}
              placeholder="物件名・物件コードで検索"
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-2 text-sm font-semibold">部屋検索</div>
            <TextInput
              value={roomSearch}
              onChange={setRoomSearch}
              placeholder="物件名・部屋名・room_keyで検索"
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-2 text-sm font-semibold">表示設定</div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              無効データも表示
            </label>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-semibold">物件一覧</div>
                <div className="text-xs text-black/50">{filteredProperties.length} 件</div>
              </div>

              <div className="overflow-auto rounded-2xl border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr>
                      <th className="border-b bg-white px-3 py-2 text-left">並び順</th>
                      <th className="border-b bg-white px-3 py-2 text-left">物件コード</th>
                      <th className="border-b bg-white px-3 py-2 text-left">物件名</th>
                      <th className="border-b bg-white px-3 py-2 text-left">有効</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((p) => (
                      <tr key={p.id} className="hover:bg-black/5">
                        <td className="border-b px-3 py-2">{p.sort_order ?? ""}</td>
                        <td className="border-b px-3 py-2">{p.property_code}</td>
                        <td className="border-b px-3 py-2">{p.property_name}</td>
                        <td className="border-b px-3 py-2">{p.is_active ? "有効" : "無効"}</td>
                      </tr>
                    ))}
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-black/60">
                          表示できる物件データがありません。
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="xl:col-span-7">
          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-semibold">部屋一覧</div>
                <div className="text-xs text-black/50">{filteredRooms.length} 件</div>
              </div>

              <div className="space-y-4">
                {groupedRooms.length === 0 ? (
                  <div className="rounded-2xl border bg-white px-3 py-8 text-center text-sm text-black/60">
                    表示できる部屋データがありません。
                  </div>
                ) : null}

                {groupedRooms.map((group) => (
                  <div key={group.propertyId} className="overflow-hidden rounded-2xl border">
                    <div className="border-b bg-neutral-50 px-4 py-3">
                      <div className="font-semibold">{group.propertyName}</div>
                      <div className="text-xs text-black/50">{group.rooms.length} 室</div>
                    </div>

                    <div className="overflow-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr>
                            <th className="border-b bg-white px-3 py-2 text-left">部屋名</th>
                            <th className="border-b bg-white px-3 py-2 text-left">部屋コード</th>
                            <th className="border-b bg-white px-3 py-2 text-left">room_key</th>
                            <th className="border-b bg-white px-3 py-2 text-left">定員</th>
                            <th className="border-b bg-white px-3 py-2 text-left">並び順</th>
                            <th className="border-b bg-white px-3 py-2 text-left">有効</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rooms.map((r) => (
                            <tr key={r.id} className="hover:bg-black/5">
                              <td className="border-b px-3 py-2">{r.room_name}</td>
                              <td className="border-b px-3 py-2">{r.room_code}</td>
                              <td className="border-b px-3 py-2">{r.room_key}</td>
                              <td className="border-b px-3 py-2">{r.capacity ?? ""}</td>
                              <td className="border-b px-3 py-2">{r.room_sort_order ?? ""}</td>
                              <td className="border-b px-3 py-2">{r.is_active ? "有効" : "無効"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Drawer
        open={propertyDrawerOpen}
        title="物件追加"
        onClose={() => setPropertyDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-black/50">物件マスタに追加します。</div>
            <div className="flex gap-2">
              <Button onClick={() => setPropertyDrawerOpen(false)}>キャンセル</Button>
              <Button
                className="border-blue-200 bg-blue-50 hover:bg-blue-100"
                onClick={createProperty}
              >
                追加
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-xs text-black/60">物件コード</div>
            <TextInput
              value={propertyForm.property_code}
              onChange={(v) => setPropertyForm((p) => ({ ...p, property_code: v }))}
              placeholder="例）ATLAS"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-black/60">物件名</div>
            <TextInput
              value={propertyForm.property_name}
              onChange={(v) => setPropertyForm((p) => ({ ...p, property_name: v }))}
              placeholder="例）アトラス"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-black/60">並び順</div>
            <TextInput
              type="number"
              value={propertyForm.sort_order}
              onChange={(v) => setPropertyForm((p) => ({ ...p, sort_order: v }))}
              placeholder="999"
            />
          </div>
        </div>
      </Drawer>

      <Drawer
        open={roomDrawerOpen}
        title="部屋追加"
        onClose={() => setRoomDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-black/50">部屋マスタに追加します。</div>
            <div className="flex gap-2">
              <Button onClick={() => setRoomDrawerOpen(false)}>キャンセル</Button>
              <Button
                className="border-orange-200 bg-orange-50 hover:bg-orange-100"
                onClick={createRoom}
              >
                追加
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-xs text-black/60">物件</div>
            <Select
              value={roomForm.property_id}
              onChange={(v) => setRoomForm((p) => ({ ...p, property_id: v }))}
              options={propertyOptions}
              placeholder="物件を選択"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-black/60">部屋名</div>
            <TextInput
              value={roomForm.room_name}
              onChange={(v) => setRoomForm((p) => ({ ...p, room_name: v }))}
              placeholder="例）101"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-black/60">部屋コード</div>
            <TextInput
              value={roomForm.room_code}
              onChange={(v) => setRoomForm((p) => ({ ...p, room_code: v }))}
              placeholder="例）101"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-black/60">定員</div>
            <TextInput
              type="number"
              value={roomForm.capacity}
              onChange={(v) => setRoomForm((p) => ({ ...p, capacity: v }))}
              placeholder="1"
            />
          </div>

          <div>
            <div className="mb-1 text-xs text-black/60">並び順</div>
            <TextInput
              type="number"
              value={roomForm.room_sort_order}
              onChange={(v) => setRoomForm((p) => ({ ...p, room_sort_order: v }))}
              placeholder="999"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
