import React, { useEffect, useMemo, useState } from "react";
import PropertyListPanel from "./property-management/PropertyListPanel";
import RoomListPanel from "./property-management/RoomListPanel";
import type {
  ActiveFilter,
  PrepItem,
  PropertyMaster,
  RoomMaster,
} from "./property-management/types";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";
const DEFAULT_TASK_COLOR = "#ffffff";

type MainTab = "rooms" | "prep";
type MobileMasterTab = "properties" | "rooms";

function getAdminRole() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? String(JSON.parse(raw)?.role || "") : "";
  } catch {
    return "";
  }
}

function authJsonHeaders() {
  const token = localStorage.getItem("admin_access_token") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function normalizeColor(value?: string | null) {
  const color = String(value || DEFAULT_TASK_COLOR).trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_TASK_COLOR;
}

function Button({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ChipButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm font-bold transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
    />
  );
}

function Drawer({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex justify-end bg-black/40"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-[520px] sm:max-w-[92vw]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <div className="text-base font-extrabold">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-200 p-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

const emptyPropertyForm = {
  id: "",
  property_code: "",
  property_name: "",
  sort_order: "999",
  is_active: true,
  max_assignable_count: "",
  cleaning_point: "60",
  task_color: DEFAULT_TASK_COLOR,
  address: "",
  google_maps_url: "",
  entrance_number: "",
};

const emptyRoomForm = {
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
  keybox_number: "",
  spare_key_number: "",
  mailbox_number: "",
  wifi_ssid: "",
  wifi_password: "",
  note: "",
};

export default function PropertyManagementPage() {
  const readOnly = getAdminRole() === "leader";

  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mainTab, setMainTab] = useState<MainTab>("rooms");
  const [mobileMasterTab, setMobileMasterTab] =
    useState<MobileMasterTab>("properties");
  const [propertySearch, setPropertySearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<ActiveFilter>("active");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [propertyDrawerOpen, setPropertyDrawerOpen] = useState(false);
  const [editPropertyDrawerOpen, setEditPropertyDrawerOpen] =
    useState(false);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);

  const [roomDrawerOpen, setRoomDrawerOpen] = useState(false);
  const [editRoomDrawerOpen, setEditRoomDrawerOpen] = useState(false);
  const [roomViewDrawerOpen, setRoomViewDrawerOpen] = useState(false);
  const [roomBulkMode, setRoomBulkMode] = useState(false);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [viewingRoom, setViewingRoom] = useState<RoomMaster | null>(null);
  const [roomBulkForm, setRoomBulkForm] = useState({
    property_id: "",
    room_names_text: "",
    default_capacity: "1",
    start_sort_order: "1",
  });

  const [prepItems, setPrepItems] = useState<PrepItem[]>([]);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState("");
  const [prepSearch, setPrepSearch] = useState("");
  const [prepDateFilter, setPrepDateFilter] = useState("");
  const [prepSort, setPrepSort] = useState<"date" | "room">("date");
  const [prepNoteDrafts, setPrepNoteDrafts] = useState<Record<string, string>>({});
  const [prepSavingId, setPrepSavingId] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [propertyResponse, roomResponse] = await Promise.all([
        fetch(`${API_BASE}/properties`),
        fetch(`${API_BASE}/rooms`),
      ]);
      if (!propertyResponse.ok)
        throw new Error(`properties failed: ${propertyResponse.status}`);
      if (!roomResponse.ok)
        throw new Error(`rooms failed: ${roomResponse.status}`);

      const propertyData: PropertyMaster[] = await propertyResponse.json();
      const roomData: RoomMaster[] = await roomResponse.json();
      const sorted = [...propertyData].sort(
        (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)
      );

      setProperties(sorted);
      setRooms(roomData);
      setSelectedPropertyId((current) =>
        current && sorted.some((property) => property.id === current)
          ? current
          : sorted[0]?.id ?? ""
      );
    } catch (cause) {
      console.error(cause);
      setError("物件・部屋データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const loadPrepList = async () => {
    try {
      setPrepLoading(true);
      setPrepError("");
      const response = await fetch(
        `${API_BASE}/api/admin-portal/prep-list`,
        { headers: authJsonHeaders() }
      );
      if (!response.ok)
        throw new Error(`prep-list failed: ${response.status}`);
      const data: PrepItem[] = await response.json();
      setPrepItems(data);
      setPrepNoteDrafts(
        Object.fromEntries(data.map((item) => [item.task_id, item.note || ""]))
      );
    } catch (cause) {
      console.error(cause);
      setPrepError("準備物データの取得に失敗しました。");
    } finally {
      setPrepLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (mainTab === "prep" && prepItems.length === 0) void loadPrepList();
  }, [mainTab]);

  const filteredProperties = useMemo(() => {
    const keyword = propertySearch.trim().toLowerCase();
    return properties.filter((property) => {
      if (activeFilter === "active" && !property.is_active) return false;
      if (!keyword) return true;
      return [
        property.property_name,
        property.property_code,
        property.normalized_name,
        property.address,
        property.entrance_number,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [properties, propertySearch, activeFilter]);

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) ?? null;

  const filteredRooms = useMemo(() => {
    const keyword = roomSearch.trim().toLowerCase();
    return rooms
      .filter((room) => room.property_id === selectedPropertyId)
      .filter((room) => {
        if (!keyword) return true;
        return [
          room.room_name,
          room.room_code,
          room.room_key,
          room.normalized_room_key,
          room.keybox_number,
          room.spare_key_number,
          room.mailbox_number,
          room.wifi_ssid,
          room.wifi_password,
          room.note,
        ].some((value) => String(value || "").toLowerCase().includes(keyword));
      })
      .sort(
        (a, b) =>
          (a.room_sort_order ?? 999) - (b.room_sort_order ?? 999)
      );
  }, [rooms, selectedPropertyId, roomSearch]);

  const propertyPayload = (form: typeof emptyPropertyForm) => ({
    property_code: form.property_code.trim(),
    property_name: form.property_name.trim(),
    normalized_name: form.property_name.trim(),
    sort_order: Number(form.sort_order || 999),
    is_active: form.is_active,
    max_assignable_count:
      form.max_assignable_count === ""
        ? null
        : Number(form.max_assignable_count),
    cleaning_point: Number(form.cleaning_point || 60),
    task_color: normalizeColor(form.task_color),
    address: form.address.trim() || null,
    google_maps_url: form.google_maps_url.trim() || null,
    entrance_number: form.entrance_number.trim() || null,
  });

  const roomPayload = (form: typeof emptyRoomForm) => {
    const property = properties.find(
      (item) => item.id === form.property_id
    );
    const roomCode = form.room_code.trim() || form.room_name.trim();
    const roomKey = `${property?.property_name || ""}${form.room_name.trim()}`;
    return {
      property_id: form.property_id,
      room_name: form.room_name.trim(),
      room_code: roomCode,
      room_key: roomKey,
      normalized_room_key: roomKey,
      capacity: Number(form.capacity || 1),
      room_sort_order: Number(form.room_sort_order || 999),
      is_active: form.is_active,
      prep_d: Number(form.prep_d || 0),
      prep_s: Number(form.prep_s || 0),
      prep_spare_s: Number(form.prep_spare_s || 0),
      prep_ta: Number(form.prep_ta || 0),
      keybox_number: form.keybox_number.trim() || null,
      spare_key_number: form.spare_key_number.trim() || null,
      mailbox_number: form.mailbox_number.trim() || null,
      wifi_ssid: form.wifi_ssid.trim() || null,
      wifi_password: form.wifi_password.trim() || null,
      note: form.note.trim() || null,
    };
  };

  const saveProperty = async (editing: boolean) => {
    if (readOnly) return;
    if (!propertyForm.property_code.trim() || !propertyForm.property_name.trim()) {
      alert("物件コードと物件名を入力してください。");
      return;
    }

    const response = await fetch(
      `${API_BASE}/properties/${editing ? "update" : "create"}`,
      {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(
          editing
            ? { property_id: propertyForm.id, ...propertyPayload(propertyForm) }
            : propertyPayload(propertyForm)
        ),
      }
    );
    if (!response.ok) {
      alert(editing ? "物件更新に失敗しました。" : "物件追加に失敗しました。");
      return;
    }
    setPropertyDrawerOpen(false);
    setEditPropertyDrawerOpen(false);
    setPropertyForm(emptyPropertyForm);
    await loadAll();
  };

  const saveRoom = async (editing: boolean) => {
    if (readOnly) return;
    if (!roomForm.property_id || !roomForm.room_name.trim()) {
      alert("物件と部屋名を入力してください。");
      return;
    }

    const response = await fetch(
      `${API_BASE}/rooms/${editing ? "update" : "create"}`,
      {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(
          editing
            ? { room_id: roomForm.id, ...roomPayload(roomForm) }
            : roomPayload(roomForm)
        ),
      }
    );
    if (!response.ok) {
      alert(editing ? "部屋更新に失敗しました。" : "部屋追加に失敗しました。");
      return;
    }
    setRoomDrawerOpen(false);
    setEditRoomDrawerOpen(false);
    setRoomForm(emptyRoomForm);
    await loadAll();
  };

  const createRoomsBulk = async () => {
    const roomNames = roomBulkForm.room_names_text
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (!roomBulkForm.property_id || roomNames.length === 0) {
      alert("物件と部屋名を入力してください。");
      return;
    }

    const response = await fetch(`${API_BASE}/rooms/bulk-create`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({
        property_id: roomBulkForm.property_id,
        room_names: roomNames,
        default_capacity: Number(roomBulkForm.default_capacity || 1),
        start_sort_order: Number(roomBulkForm.start_sort_order || 1),
      }),
    });
    if (!response.ok) {
      alert("部屋の一括追加に失敗しました。");
      return;
    }
    setRoomDrawerOpen(false);
    setRoomBulkMode(false);
    setRoomBulkForm({
      property_id: "",
      room_names_text: "",
      default_capacity: "1",
      start_sort_order: "1",
    });
    await loadAll();
  };

  const deleteRoom = async () => {
    if (!roomForm.id || !window.confirm("この部屋を削除しますか？")) return;
    const response = await fetch(`${API_BASE}/rooms/delete`, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({ room_id: roomForm.id }),
    });
    if (!response.ok) {
      alert("部屋削除に失敗しました。");
      return;
    }
    setEditRoomDrawerOpen(false);
    setRoomForm(emptyRoomForm);
    await loadAll();
  };

  const savePrepNote = async (item: PrepItem) => {
    try {
      setPrepSavingId(item.task_id);
      const response = await fetch(
        `${API_BASE}/api/admin-portal/prep-list/note`,
        {
          method: "POST",
          headers: authJsonHeaders(),
          body: JSON.stringify({
            task_id: item.task_id,
            note: prepNoteDrafts[item.task_id] || "",
          }),
        }
      );
      if (!response.ok) throw new Error(String(response.status));
      await loadPrepList();
    } catch (cause) {
      console.error(cause);
      alert("備考の保存に失敗しました。");
    } finally {
      setPrepSavingId(null);
    }
  };

  const openEditProperty = (property: PropertyMaster) => {
    setPropertyForm({
      id: property.id,
      property_code: property.property_code,
      property_name: property.property_name,
      sort_order: String(property.sort_order ?? 999),
      is_active: property.is_active,
      max_assignable_count:
        property.max_assignable_count == null
          ? ""
          : String(property.max_assignable_count),
      cleaning_point: String(property.cleaning_point ?? 60),
      task_color: normalizeColor(property.task_color),
      address: property.address ?? "",
      google_maps_url: property.google_maps_url ?? "",
      entrance_number: property.entrance_number ?? "",
    });
    setEditPropertyDrawerOpen(true);
  };

  const openEditRoom = (room: RoomMaster) => {
    setRoomForm({
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
      keybox_number: room.keybox_number ?? "",
      spare_key_number: room.spare_key_number ?? "",
      mailbox_number: room.mailbox_number ?? "",
      wifi_ssid: room.wifi_ssid ?? "",
      wifi_password: room.wifi_password ?? "",
      note: room.note ?? "",
    });
    setEditRoomDrawerOpen(true);
  };

  const sortedPrepItems = useMemo(() => {
    const keyword = prepSearch.trim().toLowerCase();
    return prepItems
      .filter((item) => {
        if (prepDateFilter && item.task_date !== prepDateFilter) return false;
        if (!keyword) return true;
        return `${item.property_name} ${item.room_name} ${item.room_key}`
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) =>
        prepSort === "date"
          ? `${a.task_date}${a.room_key}`.localeCompare(
              `${b.task_date}${b.room_key}`
            )
          : a.room_key.localeCompare(b.room_key)
      );
  }, [prepItems, prepSearch, prepDateFilter, prepSort]);

  const PropertyFormFields = (
    <div className="grid gap-4">
      <Field label="物件コード">
        <TextInput
          value={propertyForm.property_code}
          onChange={(value) =>
            setPropertyForm((current) => ({
              ...current,
              property_code: value,
            }))
          }
        />
      </Field>
      <Field label="物件名">
        <TextInput
          value={propertyForm.property_name}
          onChange={(value) =>
            setPropertyForm((current) => ({
              ...current,
              property_name: value,
            }))
          }
        />
      </Field>
      <Field label="住所">
        <TextInput
          value={propertyForm.address}
          onChange={(value) =>
            setPropertyForm((current) => ({ ...current, address: value }))
          }
        />
      </Field>
      <Field label="Google Mapsリンク">
        <TextInput
          value={propertyForm.google_maps_url}
          onChange={(value) =>
            setPropertyForm((current) => ({
              ...current,
              google_maps_url: value,
            }))
          }
        />
      </Field>
      <Field label="エントランス番号">
        <TextInput
          value={propertyForm.entrance_number}
          onChange={(value) =>
            setPropertyForm((current) => ({
              ...current,
              entrance_number: value,
            }))
          }
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="並び順">
          <TextInput
            type="number"
            value={propertyForm.sort_order}
            onChange={(value) =>
              setPropertyForm((current) => ({
                ...current,
                sort_order: value,
              }))
            }
          />
        </Field>
        <Field label="最大対応可能数">
          <TextInput
            type="number"
            value={propertyForm.max_assignable_count}
            onChange={(value) =>
              setPropertyForm((current) => ({
                ...current,
                max_assignable_count: value,
              }))
            }
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="物件点数">
          <TextInput
            type="number"
            value={propertyForm.cleaning_point}
            onChange={(value) =>
              setPropertyForm((current) => ({
                ...current,
                cleaning_point: value,
              }))
            }
          />
        </Field>
        <Field label="タスク表示色">
          <input
            type="color"
            value={normalizeColor(propertyForm.task_color)}
            onChange={(event) =>
              setPropertyForm((current) => ({
                ...current,
                task_color: event.target.value,
              }))
            }
            className="h-11 w-full rounded-2xl border border-slate-200 p-1"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={propertyForm.is_active}
          onChange={(event) =>
            setPropertyForm((current) => ({
              ...current,
              is_active: event.target.checked,
            }))
          }
        />
        有効
      </label>
    </div>
  );

  const RoomFormFields = (
    <div className="grid gap-4">
      <Field label="物件">
        <select
          value={roomForm.property_id}
          onChange={(event) =>
            setRoomForm((current) => ({
              ...current,
              property_id: event.target.value,
            }))
          }
          className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"
        >
          <option value="">選択してください</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.property_name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="部屋名">
          <TextInput
            value={roomForm.room_name}
            onChange={(value) =>
              setRoomForm((current) => ({ ...current, room_name: value }))
            }
          />
        </Field>
        <Field label="部屋コード">
          <TextInput
            value={roomForm.room_code}
            onChange={(value) =>
              setRoomForm((current) => ({ ...current, room_code: value }))
            }
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="定員">
          <TextInput
            type="number"
            value={roomForm.capacity}
            onChange={(value) =>
              setRoomForm((current) => ({ ...current, capacity: value }))
            }
          />
        </Field>
        <Field label="並び順">
          <TextInput
            type="number"
            value={roomForm.room_sort_order}
            onChange={(value) =>
              setRoomForm((current) => ({
                ...current,
                room_sort_order: value,
              }))
            }
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="キーボックス番号">
          <TextInput
            value={roomForm.keybox_number}
            onChange={(value) =>
              setRoomForm((current) => ({
                ...current,
                keybox_number: value,
              }))
            }
          />
        </Field>
        <Field label="スペア番号">
          <TextInput
            value={roomForm.spare_key_number}
            onChange={(value) =>
              setRoomForm((current) => ({
                ...current,
                spare_key_number: value,
              }))
            }
          />
        </Field>
      </div>
      <Field label="ポスト番号">
        <TextInput
          value={roomForm.mailbox_number}
          onChange={(value) =>
            setRoomForm((current) => ({
              ...current,
              mailbox_number: value,
            }))
          }
        />
      </Field>
      <Field label="Wi-Fi SSID">
        <TextInput
          value={roomForm.wifi_ssid}
          onChange={(value) =>
            setRoomForm((current) => ({ ...current, wifi_ssid: value }))
          }
        />
      </Field>
      <Field label="Wi-Fiパスワード">
        <TextInput
          value={roomForm.wifi_password}
          onChange={(value) =>
            setRoomForm((current) => ({
              ...current,
              wifi_password: value,
            }))
          }
        />
      </Field>
      <div className="grid grid-cols-4 gap-2">
        {(["prep_d", "prep_s", "prep_spare_s", "prep_ta"] as const).map(
          (key) => (
            <Field
              key={key}
              label={
                key === "prep_d"
                  ? "D"
                  : key === "prep_s"
                    ? "S"
                    : key === "prep_spare_s"
                      ? "予備S"
                      : "TA"
              }
            >
              <TextInput
                type="number"
                value={roomForm[key]}
                onChange={(value) =>
                  setRoomForm((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
              />
            </Field>
          )
        )}
      </div>
      <Field label="備考">
        <textarea
          value={roomForm.note}
          onChange={(event) =>
            setRoomForm((current) => ({
              ...current,
              note: event.target.value,
            }))
          }
          className="min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={roomForm.is_active}
          onChange={(event) =>
            setRoomForm((current) => ({
              ...current,
              is_active: event.target.checked,
            }))
          }
        />
        有効
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 md:p-6 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1800px] min-h-0 flex-col">
        <div className="shrink-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">物件管理</h1>
              <p className="mt-1 text-sm text-slate-500">
                {mainTab === "rooms"
                  ? "物件マスタ・部屋マスタを管理します。"
                  : "翌日以降の清掃に対する準備物を確認します。"}
              </p>
              {readOnly ? (
                <p className="mt-2 text-xs font-bold text-amber-700">
                  リーダー権限では閲覧のみ可能です。
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {mainTab === "rooms" ? (
                <>
                  {!readOnly ? (
                    <>
                      <Button
                        className="border-sky-200 bg-sky-50 text-sky-800"
                        onClick={() => {
                          setPropertyForm({
                            ...emptyPropertyForm,
                            is_active: true,
                          });
                          setPropertyDrawerOpen(true);
                        }}
                      >
                        ＋物件追加
                      </Button>
                      <Button
                        className="border-orange-200 bg-orange-50 text-orange-800"
                        onClick={() => {
                          setRoomForm({
                            ...emptyRoomForm,
                            property_id: selectedPropertyId,
                          });
                          setRoomBulkForm((current) => ({
                            ...current,
                            property_id: selectedPropertyId,
                          }));
                          setRoomDrawerOpen(true);
                        }}
                      >
                        ＋部屋追加
                      </Button>
                    </>
                  ) : null}
                  <Button onClick={() => void loadAll()}>更新</Button>
                </>
              ) : (
                <Button onClick={() => void loadPrepList()}>更新</Button>
              )}
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <ChipButton
              active={mainTab === "rooms"}
              onClick={() => setMainTab("rooms")}
            >
              物件・部屋一覧
            </ChipButton>
            <ChipButton
              active={mainTab === "prep"}
              onClick={() => setMainTab("prep")}
            >
              準備物確認
            </ChipButton>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {mainTab === "rooms" ? (
            <div className="flex h-full min-h-0 flex-col">
              {error ? (
                <div className="mb-3 shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              {loading ? (
                <div className="mb-3 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  読み込み中...
                </div>
              ) : null}

              <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMasterTab("properties")}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-extrabold",
                    mobileMasterTab === "properties"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  物件
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMasterTab("rooms")}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-extrabold",
                    mobileMasterTab === "rooms"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  部屋
                </button>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
                <div
                  className={[
                    "min-h-0",
                    mobileMasterTab === "properties"
                      ? "block"
                      : "hidden md:block",
                  ].join(" ")}
                >
                  <PropertyListPanel
                    properties={filteredProperties}
                    rooms={rooms}
                    selectedPropertyId={selectedPropertyId}
                    propertySearch={propertySearch}
                    activeFilter={activeFilter}
                    readOnly={readOnly}
                    onPropertySearchChange={setPropertySearch}
                    onActiveFilterChange={setActiveFilter}
                    onSelectProperty={(propertyId) => {
                      setSelectedPropertyId(propertyId);
                      setMobileMasterTab("rooms");
                    }}
                    onEditProperty={openEditProperty}
                  />
                </div>

                <div
                  className={[
                    "min-h-0 min-w-0",
                    mobileMasterTab === "rooms"
                      ? "block"
                      : "hidden md:block",
                  ].join(" ")}
                >
                  <RoomListPanel
                    selectedProperty={selectedProperty}
                    rooms={filteredRooms}
                    roomSearch={roomSearch}
                    readOnly={readOnly}
                    onRoomSearchChange={setRoomSearch}
                    onViewRoom={(room) => {
                      setViewingRoom(room);
                      setRoomViewDrawerOpen(true);
                    }}
                    onEditRoom={openEditRoom}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <div className="p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-extrabold">
                      準備物確認（翌日以降）
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {prepLoading
                        ? "読み込み中..."
                        : `${sortedPrepItems.length} 件`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ChipButton
                      active={prepSort === "date"}
                      onClick={() => setPrepSort("date")}
                    >
                      日付順
                    </ChipButton>
                    <ChipButton
                      active={prepSort === "room"}
                      onClick={() => setPrepSort("room")}
                    >
                      部屋名順
                    </ChipButton>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <div className="w-full sm:w-64">
                    <TextInput
                      value={prepSearch}
                      onChange={setPrepSearch}
                      placeholder="物件名・部屋名で検索"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <TextInput
                      type="date"
                      value={prepDateFilter}
                      onChange={setPrepDateFilter}
                    />
                  </div>
                </div>

                {prepError ? (
                  <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {prepError}
                  </div>
                ) : null}

                <div className="overflow-auto lg:max-h-[calc(100dvh-270px)]">
                  <table className="min-w-[960px] w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-left">日付</th>
                        <th className="px-3 py-3 text-left">物件</th>
                        <th className="px-3 py-3 text-left">部屋</th>
                        <th className="px-3 py-3 text-right">タオル</th>
                        <th className="px-3 py-3 text-right">D</th>
                        <th className="px-3 py-3 text-right">S</th>
                        <th className="px-3 py-3 text-right">予備S</th>
                        <th className="px-3 py-3 text-right">TA</th>
                        <th className="px-3 py-3 text-left">備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPrepItems.map((item) => (
                        <tr key={item.task_id} className="border-t">
                          <td className="px-3 py-3">{item.task_date}</td>
                          <td className="px-3 py-3">{item.property_name}</td>
                          <td className="px-3 py-3">{item.room_name}</td>
                          <td className="px-3 py-3 text-right">
                            {item.towel_count}
                          </td>
                          <td className="px-3 py-3 text-right">{item.prep_d}</td>
                          <td className="px-3 py-3 text-right">{item.prep_s}</td>
                          <td className="px-3 py-3 text-right">
                            {item.prep_spare_s}
                          </td>
                          <td className="px-3 py-3 text-right">{item.prep_ta}</td>
                          <td className="min-w-64 px-3 py-3">
                            <div className="flex gap-2">
                              <input
                                value={prepNoteDrafts[item.task_id] ?? ""}
                                onChange={(event) =>
                                  setPrepNoteDrafts((current) => ({
                                    ...current,
                                    [item.task_id]: event.target.value,
                                  }))
                                }
                                className="h-10 min-w-52 flex-1 rounded-xl border border-slate-200 px-3"
                              />
                              <Button
                                disabled={prepSavingId === item.task_id}
                                onClick={() => void savePrepNote(item)}
                              >
                                保存
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Drawer
        open={propertyDrawerOpen}
        title="物件追加"
        onClose={() => setPropertyDrawerOpen(false)}
        footer={
          <Button
            className="w-full border-sky-200 bg-sky-50 text-sky-800"
            onClick={() => void saveProperty(false)}
          >
            追加
          </Button>
        }
      >
        {PropertyFormFields}
      </Drawer>

      <Drawer
        open={editPropertyDrawerOpen}
        title="物件編集"
        onClose={() => setEditPropertyDrawerOpen(false)}
        footer={
          <Button
            className="w-full border-sky-200 bg-sky-50 text-sky-800"
            onClick={() => void saveProperty(true)}
          >
            保存
          </Button>
        }
      >
        {PropertyFormFields}
      </Drawer>

      <Drawer
        open={roomDrawerOpen}
        title="部屋追加"
        onClose={() => setRoomDrawerOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setRoomBulkMode((current) => !current)}>
              {roomBulkMode ? "1部屋追加へ" : "一括追加へ"}
            </Button>
            <Button
              className="border-orange-200 bg-orange-50 text-orange-800"
              onClick={() =>
                roomBulkMode
                  ? void createRoomsBulk()
                  : void saveRoom(false)
              }
            >
              追加
            </Button>
          </div>
        }
      >
        {roomBulkMode ? (
          <div className="grid gap-4">
            <Field label="物件">
              <select
                value={roomBulkForm.property_id}
                onChange={(event) =>
                  setRoomBulkForm((current) => ({
                    ...current,
                    property_id: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-3"
              >
                <option value="">選択してください</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.property_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="部屋名（1行1室）">
              <textarea
                value={roomBulkForm.room_names_text}
                onChange={(event) =>
                  setRoomBulkForm((current) => ({
                    ...current,
                    room_names_text: event.target.value,
                  }))
                }
                className="min-h-64 w-full rounded-2xl border border-slate-200 p-3"
              />
            </Field>
          </div>
        ) : (
          RoomFormFields
        )}
      </Drawer>

      <Drawer
        open={editRoomDrawerOpen}
        title="部屋編集"
        onClose={() => setEditRoomDrawerOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="border-rose-200 bg-rose-50 text-rose-700"
              onClick={() => void deleteRoom()}
            >
              削除
            </Button>
            <Button
              className="border-orange-200 bg-orange-50 text-orange-800"
              onClick={() => void saveRoom(true)}
            >
              保存
            </Button>
          </div>
        }
      >
        {RoomFormFields}
      </Drawer>

      <Drawer
        open={roomViewDrawerOpen}
        title={viewingRoom?.room_name || "部屋詳細"}
        subtitle={
          properties.find((property) => property.id === viewingRoom?.property_id)
            ?.property_name
        }
        onClose={() => setRoomViewDrawerOpen(false)}
        footer={
          !readOnly && viewingRoom ? (
            <Button
              className="w-full"
              onClick={() => {
                setRoomViewDrawerOpen(false);
                openEditRoom(viewingRoom);
              }}
            >
              編集
            </Button>
          ) : undefined
        }
      >
        {viewingRoom ? (
          <dl className="grid gap-4 text-sm">
            {[
              ["room_key", viewingRoom.room_key],
              ["キーボックス番号", viewingRoom.keybox_number],
              ["スペア番号", viewingRoom.spare_key_number],
              ["ポスト番号", viewingRoom.mailbox_number],
              ["Wi-Fi SSID", viewingRoom.wifi_ssid],
              ["Wi-Fiパスワード", viewingRoom.wifi_password],
              ["定員", viewingRoom.capacity],
              ["備考", viewingRoom.note],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs font-semibold text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 break-all font-medium">
                  {String(value ?? "-")}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>
    </div>
  );
}
