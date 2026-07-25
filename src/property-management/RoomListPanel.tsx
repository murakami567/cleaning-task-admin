import React from "react";

export type RoomListItem = {
  id: string;
  property_id: string;
  room_name: string;
  room_code: string | null;
  room_key: string;
  capacity: number | null;
  room_sort_order: number | null;
  is_active: boolean;
};

type Props = {
  rooms: RoomListItem[];
  hasSelectedProperty: boolean;
  readOnly: boolean;
  onEdit: (room: RoomListItem) => void;
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

export default function RoomListPanel({ rooms, hasSelectedProperty, readOnly, onEdit }: Props) {
  if (!hasSelectedProperty) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        左の物件一覧から対象物件を選択してください。
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-2xl border border-slate-200">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            <th className="border-b px-4 py-3 text-left font-bold">部屋名</th>
            <th className="border-b px-4 py-3 text-left font-bold">部屋コード</th>
            <th className="border-b px-4 py-3 text-left font-bold">room_key</th>
            <th className="border-b px-4 py-3 text-left font-bold">定員</th>
            <th className="border-b px-4 py-3 text-left font-bold">並び順</th>
            <th className="border-b px-4 py-3 text-left font-bold">有効</th>
            <th className="border-b px-4 py-3 text-left font-bold">操作</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id} className="hover:bg-slate-50">
              <td className="border-b px-4 py-3 font-medium">{room.room_name}</td>
              <td className="border-b px-4 py-3">{room.room_code}</td>
              <td className="border-b px-4 py-3">{room.room_key}</td>
              <td className="border-b px-4 py-3">{room.capacity ?? ""}</td>
              <td className="border-b px-4 py-3">{room.room_sort_order ?? ""}</td>
              <td className="border-b px-4 py-3"><Badge on={room.is_active} /></td>
              <td className="border-b px-4 py-3">
                {!readOnly ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50"
                    onClick={() => onEdit(room)}
                  >
                    編集
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">閲覧のみ</span>
                )}
              </td>
            </tr>
          ))}
          {rooms.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                表示できる部屋がありません。
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
