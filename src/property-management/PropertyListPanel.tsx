import React from "react";

export type PropertyListItem = {
  id: string;
  property_code: string;
  property_name: string;
  normalized_name: string | null;
  sort_order: number | null;
  is_active: boolean;
  max_assignable_count?: number | null;
  cleaning_point?: number | null;
  task_color?: string | null;
};

type Props = {
  properties: PropertyListItem[];
  roomCountByProperty: Record<string, number>;
  selectedPropertyId: string;
  readOnly: boolean;
  onSelect: (propertyId: string) => void;
  onEdit: (property: PropertyListItem) => void;
};

function Badge({ on }: { on: boolean }) {
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

function normalizeColor(value?: string | null) {
  const color = String(value || "#ffffff").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#ffffff";
}

export default function PropertyListPanel({
  properties,
  roomCountByProperty,
  selectedPropertyId,
  readOnly,
  onSelect,
  onEdit,
}: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
      <div className="space-y-2">
        {properties.map((property) => {
          const selected = property.id === selectedPropertyId;
          const taskColor = normalizeColor(property.task_color);
          return (
            <button
              key={property.id}
              type="button"
              onClick={() => onSelect(property.id)}
              className={[
                "w-full rounded-2xl border px-4 py-3 text-left transition",
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">
                    {property.sort_order ?? 999}. {property.property_name}
                  </div>
                  <div className={`mt-1 truncate text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>
                    {property.property_code} / {property.normalized_name ?? property.property_name}
                  </div>
                  <div className={`mt-1 text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>
                    {roomCountByProperty[property.id] ?? 0} 室 / 最大対応可能 {property.max_assignable_count ?? "制限なし"} / 物件点数 {property.cleaning_point ?? 60}pt
                  </div>
                  <div className={`mt-1 flex items-center gap-2 text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>
                    <span className="inline-block h-3 w-5 rounded border border-slate-300" style={{ backgroundColor: taskColor }} />
                    タスク表示色 {taskColor}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge on={property.is_active} />
                  {!readOnly ? (
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        selected
                          ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(property);
                      }}
                    >
                      編集
                    </button>
                  ) : (
                    <span className={selected ? "text-xs text-white/70" : "text-xs text-slate-400"}>閲覧のみ</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            表示できる物件がありません。
          </div>
        ) : null}
      </div>
    </div>
  );
}
