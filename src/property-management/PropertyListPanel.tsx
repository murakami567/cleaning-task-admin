import React from "react";
import type { ActiveFilter, PropertyMaster, RoomMaster } from "./types";

const DEFAULT_TASK_COLOR = "#ffffff";

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
  return (
    <section className="flex min-h-0 h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">物件一覧</div>
            <div className="mt-1 text-xs text-slate-500">{properties.length} 件</div>
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
          {properties.map((property) => {
            const selected = property.id === selectedPropertyId;
            const roomCount = rooms.filter((room) => room.property_id === property.id).length;
            const taskColor = normalizeColor(property.task_color);

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
                className={[
                  "cursor-pointer rounded-2xl border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-slate-300",
                  selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
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
            );
          })}

          {properties.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              表示できる物件がありません。
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
