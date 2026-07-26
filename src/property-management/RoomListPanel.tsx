import type {
  PropertyMaster,
  RoomMaster,
} from "./types";

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
      <span
        className={[
          "h-2 w-2 rounded-full",
          on ? "bg-emerald-500" : "bg-rose-500",
        ].join(" ")}
      />
      {on ? "ON" : "OFF"}
    </span>
  );
}

type RoomListPanelProps = {
  selectedProperty: PropertyMaster | null;
  rooms: RoomMaster[];
  roomSearch: string;
  readOnly: boolean;
  onRoomSearchChange: (value: string) => void;
  onViewRoom: (room: RoomMaster) => void;
  onEditRoom: (room: RoomMaster) => void;
};

export default function RoomListPanel({
  selectedProperty,
  rooms,
  roomSearch,
  readOnly,
  onRoomSearchChange,
  onViewRoom,
  onEditRoom,
}: RoomListPanelProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">
              部屋一覧
              {selectedProperty ? ` / ${selectedProperty.property_name}` : ""}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {selectedProperty ? `${rooms.length} 件` : "物件を選択してください"}
            </div>
          </div>

          <div className="w-full max-w-sm">
            <input
              type="search"
              value={roomSearch}
              onChange={(event) => onRoomSearchChange(event.target.value)}
              placeholder="部屋名・コード・鍵・ポスト・Wi-Fi・備考で検索"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {!selectedProperty ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            左の物件一覧から対象物件を選択してください。
          </div>
        ) : (
          <div className="min-w-max overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋名</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">room_key</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">キーボックス番号</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">スペア番号</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">ポスト番号</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">定員</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">有効</th>
                  <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">操作</th>
                </tr>
              </thead>

              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    onClick={() => onViewRoom(room)}
                    className="cursor-pointer hover:bg-slate-50 active:bg-slate-100"
                  >
                    <td className="border-b px-4 py-3 font-medium">{room.room_name}</td>
                    <td className="border-b px-4 py-3">{room.room_key}</td>
                    <td className="border-b px-4 py-3">{room.keybox_number ?? ""}</td>
                    <td className="border-b px-4 py-3">{room.spare_key_number ?? ""}</td>
                    <td className="border-b px-4 py-3">{room.mailbox_number ?? ""}</td>
                    <td className="border-b px-4 py-3">{room.capacity ?? ""}</td>
                    <td className="border-b px-4 py-3"><StatusBadge on={room.is_active} /></td>
                    <td className="border-b px-4 py-3">
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditRoom(room);
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50"
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
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                      表示できる部屋がありません。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
