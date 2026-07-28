import { useEffect, useState } from "react";
import type { PropertyMaster, RoomMaster } from "./types";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";

function authJsonHeaders() {
  const token = localStorage.getItem("admin_access_token") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
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
  const [orderedRooms, setOrderedRooms] = useState<RoomMaster[]>(rooms);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    setOrderedRooms(rooms);
  }, [rooms]);

  async function moveRoom(sourceId: string, targetId: string) {
    if (readOnly || savingOrder || sourceId === targetId) return;

    const sourceIndex = orderedRooms.findIndex((item) => item.id === sourceId);
    const targetIndex = orderedRooms.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const previous = orderedRooms;
    const next = [...orderedRooms];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    const normalized = next.map((item, index) => ({
      ...item,
      room_sort_order: index + 1,
    }));

    setOrderedRooms(normalized);
    setSavingOrder(true);
    try {
      const responses = await Promise.all(
        normalized.map((room, index) =>
          fetch(`${API_BASE}/rooms/update`, {
            method: "POST",
            headers: authJsonHeaders(),
            body: JSON.stringify({
              room_id: room.id,
              room_sort_order: index + 1,
            }),
          })
        )
      );
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const body = await failed.json().catch(() => ({}));
        throw new Error(body?.detail || `並び替え保存に失敗しました (${failed.status})`);
      }
    } catch (error) {
      console.error(error);
      setOrderedRooms(previous);
      alert(error instanceof Error ? error.message : "部屋の並び替え保存に失敗しました。");
    } finally {
      setSavingOrder(false);
      setDraggingId(null);
      setDropTargetId(null);
    }
  }

  function dragHandle(room: RoomMaster, compact = false) {
    if (readOnly) return null;
    return (
      <button
        type="button"
        draggable={!savingOrder}
        aria-label={`${room.room_name}を並び替え`}
        title="ドラッグして並び替え"
        onClick={(event) => event.stopPropagation()}
        onDragStart={(event) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", room.id);
          setDraggingId(room.id);
        }}
        onDragEnd={() => {
          setDraggingId(null);
          setDropTargetId(null);
        }}
        className={[
          "shrink-0 cursor-grab select-none rounded-lg border border-slate-200 bg-slate-50 font-black text-slate-500 active:cursor-grabbing",
          compact ? "px-2 py-1 text-base" : "px-2 py-1 text-sm",
        ].join(" ")}
      >
        ⋮⋮
      </button>
    );
  }

  function dragProps(room: RoomMaster) {
    const isDragging = draggingId === room.id;
    const isDropTarget = dropTargetId === room.id && draggingId !== room.id;
    return {
      onDragOver: (event: React.DragEvent) => {
        if (readOnly || !draggingId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDropTargetId(room.id);
      },
      onDragLeave: () => {
        if (dropTargetId === room.id) setDropTargetId(null);
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        const sourceId = draggingId || event.dataTransfer.getData("text/plain");
        if (sourceId) void moveRoom(sourceId, room.id);
      },
      className: [
        isDragging ? "opacity-50" : "",
        isDropTarget ? "ring-2 ring-sky-400 ring-offset-2" : "",
      ].join(" "),
    };
  }

  return (
    <section className="flex min-h-0 h-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">
              部屋一覧{selectedProperty ? ` / ${selectedProperty.property_name}` : ""}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {selectedProperty ? `${orderedRooms.length} 件` : "物件を選択してください"}
              {selectedProperty && !readOnly ? " / 左端をドラッグして並び替え" : ""}
              {savingOrder ? " / 保存中..." : ""}
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
              {orderedRooms.map((room) => {
                const dnd = dragProps(room);
                return (
                  <div
                    key={room.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onViewRoom(room)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") onViewRoom(room);
                    }}
                    onDragOver={dnd.onDragOver}
                    onDragLeave={dnd.onDragLeave}
                    onDrop={dnd.onDrop}
                    className={`cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 ${dnd.className}`}
                  >
                    <div className="flex items-start gap-3">
                      {dragHandle(room, true)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-extrabold">
                              {room.room_sort_order ?? 999}. {room.room_name}
                            </div>
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
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden min-w-max overflow-hidden rounded-2xl border border-slate-200 md:block">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="w-14 border-b px-3 py-3 text-left">順序</th>
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
                  {orderedRooms.map((room) => {
                    const dnd = dragProps(room);
                    return (
                      <tr
                        key={room.id}
                        onClick={() => onViewRoom(room)}
                        onDragOver={dnd.onDragOver}
                        onDragLeave={dnd.onDragLeave}
                        onDrop={dnd.onDrop}
                        className={`cursor-pointer hover:bg-slate-50 ${dnd.className}`}
                      >
                        <td className="border-b px-3 py-3">
                          <div className="flex items-center gap-2">
                            {dragHandle(room)}
                            <span className="text-xs font-bold text-slate-500">{room.room_sort_order ?? 999}</span>
                          </div>
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {orderedRooms.length === 0 ? (
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
