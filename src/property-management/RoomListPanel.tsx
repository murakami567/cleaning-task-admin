import type { PropertyMaster, RoomMaster } from "./types";

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
}: Props) {
  return (
    <section className="flex min-h-0 h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">
              部屋一覧{selectedProperty ? ` / ${selectedProperty.property_name}` : ""}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {selectedProperty ? `${rooms.length} 件` : "物件を選択してください"}
            </div>
          </div>

          <input
            type="search"
            value={roomSearch}
            onChange={(event) => onRoomSearchChange(event.target.value)}
            placeholder="部屋名・コード・鍵・ポスト・Wi-Fi・備考で検索"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 sm:max-w-sm"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-4">
        {!selectedProperty ? (
          <div className="rounded-2xl border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            物件一覧から対象物件を選択してください。
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onViewRoom(room)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onViewRoom(room);
                  }}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold">{room.room_name}</div>
                      <div className="mt-1 break-all text-xs text-slate-500">{room.room_key}</div>
                    </div>
                    <StatusBadge on={room.is_active} />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div><dt className="text-slate-400">キーボックス</dt><dd className="font-semibold">{room.keybox_number || "-"}</dd></div>
                    <div><dt className="text-slate-400">スペア</dt><dd className="font-semibold">{room.spare_key_number || "-"}</dd></div>
                    <div><dt className="text-slate-400">ポスト</dt><dd className="font-semibold">{room.mailbox_number || "-"}</dd></div>
                    <div><dt className="text-slate-400">定員</dt><dd className="font-semibold">{room.capacity ?? "-"}</dd></div>
                    <div className="col-span-2"><dt className="text-slate-400">Wi-Fi SSID</dt><dd className="break-all font-semibold">{room.wifi_ssid || "-"}</dd></div>
                  </dl>

                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditRoom(room);
                      }}
                      className="mt-3 w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-bold"
                    >
                      編集
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="hidden min-w-max overflow-hidden rounded-2xl border border-slate-200 md:block">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="border-b px-4 py-3 text-left">部屋名</th>
                    <th className="border-b px-4 py-3 text-left">room_key</th>
                    <th className="border-b px-4 py-3 text-left">キーボックス番号</th>
                    <th className="border-b px-4 py-3 text-left">スペア番号</th>
                    <th className="border-b px-4 py-3 text-left">ポスト番号</th>
                    <th className="border-b px-4 py-3 text-left">定員</th>
                    <th className="border-b px-4 py-3 text-left">有効</th>
                    <th className="border-b px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} onClick={() => onViewRoom(room)} className="cursor-pointer hover:bg-slate-50">
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
                </tbody>
              </table>
            </div>

            {rooms.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                表示できる部屋がありません。
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
