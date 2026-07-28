import React, { useEffect, useState } from "react";
import type { ActiveFilter, PropertyMaster, RoomMaster } from "./types";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";
const DEFAULT_TASK_COLOR = "#ffffff";

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

function StatusBadge({ on }: { on: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700",
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", on ? "bg-emerald-500" : "bg-rose-500"].join(" ")} />
      {on ? "ON" : "OFF"}
    </span>
  );
}

type Props = {
  properties: PropertyMaster[];
  rooms: RoomMaster[];
  selectedPropertyId: string;
  propertySearch: string;
  activeFilter: ActiveFilter;
  readOnly: boolean;
  onPropertySearchChange: (value: string) => void;
  onActiveFilterChange: (value: ActiveFilter) => void;
  onSelectProperty: (propertyId: string) => void;
  onEditProperty: (property: PropertyMaster) => void;
};

export default function PropertyListPanel({
  properties,
  rooms,
  selectedPropertyId,
  propertySearch,
  activeFilter,
  readOnly,
  onPropertySearchChange,
  onActiveFilterChange,
  onSelectProperty,
  onEditProperty,
}: Props) {
  const [orderedProperties, setOrderedProperties] = useState<PropertyMaster[]>(properties);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setOrderedProperties(properties);
  }, [properties]);

  async function moveProperty(sourceId: string, targetId: string) {
    if (readOnly || savingOrder || sourceId === targetId) return;

    const sourceIndex = orderedProperties.findIndex((item) => item.id === sourceId);
    const targetIndex = orderedProperties.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const previous = orderedProperties;
    const next = [...orderedProperties];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    const normalized = next.map((item, index) => ({ ...item, sort_order: index + 1 }));

    setOrderedProperties(normalized);
    setSavingOrder(true);
    try {
      const response = await fetch(`${API_BASE}/properties/reorder`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          items: normalized.map((item, index) => ({
            property_id: item.id,
            sort_order: index + 1,
          })),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.detail || `並び替え保存に失敗しました (${response.status})`);
      }
    } catch (error) {
      console.error(error);
      setOrderedProperties(previous);
      alert(error instanceof Error ? error.message : "物件の並び替え保存に失敗しました。");
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
      setDropTargetId(null);
    }
  }

  return (
    <section className="flex min-h-0 h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">物件一覧</div>
            <div className="mt-1 text-xs text-slate-500">
              {orderedProperties.length} 件
              {!readOnly ? " / 左端をドラッグして並び替え" : ""}
              {savingOrder ? " / 保存中..." : ""}
            </div>
          </div>

          <div className="flex gap-2">
            <ChipButton active={activeFilter === "active"} onClick={() => onActiveFilterChange("active")}>
              有効のみ
            </ChipButton>
            <ChipButton active={activeFilter === "all"} onClick={() => onActiveFilterChange("all")}>
              すべて
            </ChipButton>
          </div>
        </div>

        <input
          type="search"
          value={propertySearch}
          onChange={(event) => onPropertySearchChange(event.target.value)}
          placeholder="物件名・コード・住所・エントランス番号で検索"
          className="mt-4 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="space-y-2">
          {orderedProperties.map((property) => {
            const selected = property.id === selectedPropertyId;
            const roomCount = rooms.filter((room) => room.property_id === property.id).length;
            const taskColor = normalizeColor(property.task_color);
            const isDragging = draggingId === property.id;
            const isDropTarget = dropTargetId === property.id && draggingId !== property.id;

            return (
              <div
                key={property.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProperty(property.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectProperty(property.id);
                  }
                }}
                onDragOver={(event) => {
                  if (readOnly || !draggingId) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetId(property.id);
                }}
                onDragLeave={() => {
                  if (dropTargetId === property.id) setDropTargetId(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = draggingId || event.dataTransfer.getData("text/plain");
                  if (sourceId) void moveProperty(sourceId, property.id);
                }}
                className={[
                  "rounded-2xl border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-slate-300",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                  isDragging ? "opacity-50" : "",
                  isDropTarget ? "ring-2 ring-sky-400 ring-offset-2" : "",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  {!readOnly ? (
                    <button
                      type="button"
                      draggable={!savingOrder}
                      aria-label={`${property.property_name}を並び替え`}
                      title="ドラッグして並び替え"
                      onClick={(event) => event.stopPropagation()}
                      onDragStart={(event) => {
                        event.stopPropagation();
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", property.id);
                        setDraggingId(property.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetId(null);
                      }}
                      className={[
                        "mt-0.5 shrink-0 cursor-grab select-none rounded-lg border px-2 py-1 text-base font-black active:cursor-grabbing",
                        selected
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-500",
                      ].join(" ")}
                    >
                      ⋮⋮
                    </button>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="break-words text-sm font-bold">
                          {property.sort_order ?? 999}. {property.property_name}
                        </div>
                        <div className={["mt-1 break-words text-xs", selected ? "text-white/70" : "text-slate-500"].join(" ")}>
                          {property.property_code} / {property.normalized_name ?? property.property_name}
                        </div>

                        {property.address ? (
                          <div className={["mt-2 break-words text-xs", selected ? "text-white/80" : "text-slate-600"].join(" ")}>
                            住所：{property.address}
                          </div>
                        ) : null}

                        {property.entrance_number ? (
                          <div className={["mt-1 break-words text-xs font-semibold", selected ? "text-white/80" : "text-slate-700"].join(" ")}>
                            エントランス番号：{property.entrance_number}
                          </div>
                        ) : null}

                        {property.google_maps_url ? (
                          <a
                            href={property.google_maps_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className={[
                              "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold hover:underline",
                              selected
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-sky-200 bg-sky-50 text-sky-700",
                            ].join(" ")}
                          >
                            Google Mapsを開く
                          </a>
                        ) : null}

                        <div className={["mt-2 text-xs", selected ? "text-white/70" : "text-slate-500"].join(" ")}>
                          {roomCount} 室 / 最大対応可能 {property.max_assignable_count ?? "制限なし"} / 物件点数{" "}
                          {property.cleaning_point ?? 60}pt
                        </div>

                        <div className={["mt-1 flex items-center gap-2 text-xs", selected ? "text-white/70" : "text-slate-500"].join(" ")}>
                          <span className="inline-block h-3 w-5 rounded border border-slate-300" style={{ backgroundColor: taskColor }} />
                          タスク表示色 {taskColor}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <StatusBadge on={property.is_active} />
                        {!readOnly ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEditProperty(property);
                            }}
                            className={[
                              "rounded-full border px-3 py-1 text-xs font-bold",
                              selected
                                ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            編集
                          </button>
                        ) : (
                          <span className={["text-xs", selected ? "text-white/70" : "text-slate-400"].join(" ")}>閲覧のみ</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {orderedProperties.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              表示できる物件がありません。
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
