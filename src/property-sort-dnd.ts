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

type DragKind = "property" | "room";

type DragState = {
  kind: DragKind;
  id: string;
} | null;

let propertiesCache: PropertyMaster[] = [];
let roomsCache: RoomMaster[] = [];
let dragState: DragState = null;
let initialized = false;
let loading = false;
let saving = false;
let enhanceTimer: number | null = null;

function isPropertyPage(): boolean {
  return window.location.pathname === "/admin/properties";
}

async function loadMasters(): Promise<void> {
  if (loading) return;
  loading = true;

  try {
    const [pRes, rRes] = await Promise.all([
      fetch(`${API_BASE}/properties`),
      fetch(`${API_BASE}/rooms`),
    ]);

    if (!pRes.ok || !rRes.ok) return;

    propertiesCache = await pRes.json();
    roomsCache = await rRes.json();
  } catch (error) {
    console.error("drag sort master load failed", error);
  } finally {
    loading = false;
  }
}

function getPropertyListButtons(): HTMLButtonElement[] {
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="物件名・物件コード・キーで検索"]'
  );
  if (!input) return [];

  const cards = Array.from(document.querySelectorAll<HTMLDivElement>('div[class*="rounded-[24px]"]'));
  const propertyCard = cards.find((card) => card.contains(input));
  if (!propertyCard) return [];

  return Array.from(propertyCard.querySelectorAll<HTMLButtonElement>("button")).filter((button) => {
    const text = button.textContent || "";
    return propertiesCache.some(
      (property) => text.includes(property.property_name) && text.includes(property.property_code)
    );
  });
}

function findPropertyByButton(button: HTMLButtonElement): PropertyMaster | null {
  const text = button.textContent || "";
  return (
    propertiesCache.find(
      (property) => text.includes(property.property_name) && text.includes(property.property_code)
    ) || null
  );
}

function getRoomRows(): HTMLTableRowElement[] {
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="部屋名・部屋コード・room_keyで検索"]'
  );
  if (!input) return [];

  const table = input.closest('div[class*="rounded-[24px]"]')?.querySelector("table");
  if (!table) return [];

  return Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr")).filter((row) => {
    const cells = row.querySelectorAll("td");
    return cells.length >= 7;
  });
}

function findRoomByRow(row: HTMLTableRowElement): RoomMaster | null {
  const cells = row.querySelectorAll<HTMLTableCellElement>("td");
  const roomName = cells[0]?.textContent?.trim() || "";
  const roomCode = cells[1]?.textContent?.trim() || "";
  const roomKey = cells[2]?.textContent?.trim() || "";

  return (
    roomsCache.find(
      (room) =>
        room.room_key === roomKey &&
        room.room_name === roomName &&
        String(room.room_code || "") === roomCode
    ) || null
  );
}

function setDragStyle(el: HTMLElement): void {
  el.draggable = true;
  el.style.cursor = "grab";
  el.title = "ドラッグして並び替え";
}

function setDragging(el: HTMLElement, on: boolean): void {
  el.style.opacity = on ? "0.55" : "";
}

function setDropTarget(el: HTMLElement, on: boolean): void {
  el.style.outline = on ? "2px solid rgb(15 23 42)" : "";
  el.style.outlineOffset = on ? "2px" : "";
}

async function updatePropertyOrder(sourceId: string, targetId: string): Promise<void> {
  if (sourceId === targetId || saving) return;

  const buttons = getPropertyListButtons();
  const orderedIds = buttons
    .map((button) => findPropertyByButton(button)?.id || "")
    .filter(Boolean);

  const fromIndex = orderedIds.indexOf(sourceId);
  const toIndex = orderedIds.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return;

  const nextIds = [...orderedIds];
  const [moved] = nextIds.splice(fromIndex, 1);
  nextIds.splice(toIndex, 0, moved);

  saving = true;
  try {
    await Promise.all(
      nextIds.map((id, index) => {
        const property = propertiesCache.find((p) => p.id === id);
        if (!property) return Promise.resolve();

        return fetch(`${API_BASE}/properties/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            property_id: property.id,
            property_code: property.property_code,
            property_name: property.property_name,
            normalized_name: property.normalized_name || property.property_name,
            sort_order: index + 1,
            is_active: property.is_active,
          }),
        });
      })
    );
    window.location.reload();
  } catch (error) {
    console.error("property drag sort save failed", error);
    alert("物件の並び替え保存に失敗しました。");
  } finally {
    saving = false;
  }
}

async function updateRoomOrder(sourceId: string, targetId: string): Promise<void> {
  if (sourceId === targetId || saving) return;

  const rows = getRoomRows();
  const orderedIds = rows.map((row) => findRoomByRow(row)?.id || "").filter(Boolean);

  const fromIndex = orderedIds.indexOf(sourceId);
  const toIndex = orderedIds.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return;

  const nextIds = [...orderedIds];
  const [moved] = nextIds.splice(fromIndex, 1);
  nextIds.splice(toIndex, 0, moved);

  saving = true;
  try {
    await Promise.all(
      nextIds.map((id, index) => {
        const room = roomsCache.find((r) => r.id === id);
        if (!room) return Promise.resolve();

        return fetch(`${API_BASE}/rooms/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: room.id,
            property_id: room.property_id,
            room_name: room.room_name,
            room_code: room.room_code || room.room_name,
            room_key: room.room_key,
            normalized_room_key: room.normalized_room_key || room.room_key,
            capacity: room.capacity ?? 1,
            room_sort_order: index + 1,
            is_active: room.is_active,
            prep_d: room.prep_d ?? 0,
            prep_s: room.prep_s ?? 0,
            prep_spare_s: room.prep_spare_s ?? 0,
            prep_ta: room.prep_ta ?? 0,
          }),
        });
      })
    );
    window.location.reload();
  } catch (error) {
    console.error("room drag sort save failed", error);
    alert("部屋の並び替え保存に失敗しました。");
  } finally {
    saving = false;
  }
}

function enhancePropertyDrag(): void {
  getPropertyListButtons().forEach((button) => {
    const property = findPropertyByButton(button);
    if (!property || button.dataset.dragSortReady === "1") return;

    button.dataset.dragSortReady = "1";
    button.dataset.propertyId = property.id;
    setDragStyle(button);

    button.addEventListener("dragstart", () => {
      dragState = { kind: "property", id: property.id };
      setDragging(button, true);
    });
    button.addEventListener("dragend", () => {
      dragState = null;
      setDragging(button, false);
      setDropTarget(button, false);
    });
    button.addEventListener("dragover", (event) => {
      if (dragState?.kind !== "property") return;
      event.preventDefault();
      setDropTarget(button, true);
    });
    button.addEventListener("dragleave", () => setDropTarget(button, false));
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      setDropTarget(button, false);
      if (dragState?.kind !== "property") return;
      void updatePropertyOrder(dragState.id, property.id);
    });
  });
}

function enhanceRoomDrag(): void {
  getRoomRows().forEach((row) => {
    const room = findRoomByRow(row);
    if (!room || row.dataset.dragSortReady === "1") return;

    row.dataset.dragSortReady = "1";
    row.dataset.roomId = room.id;
    setDragStyle(row);

    row.addEventListener("dragstart", () => {
      dragState = { kind: "room", id: room.id };
      setDragging(row, true);
    });
    row.addEventListener("dragend", () => {
      dragState = null;
      setDragging(row, false);
      setDropTarget(row, false);
    });
    row.addEventListener("dragover", (event) => {
      if (dragState?.kind !== "room") return;
      event.preventDefault();
      setDropTarget(row, true);
    });
    row.addEventListener("dragleave", () => setDropTarget(row, false));
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      setDropTarget(row, false);
      if (dragState?.kind !== "room") return;
      void updateRoomOrder(dragState.id, room.id);
    });
  });
}

function scheduleEnhance(): void {
  if (!isPropertyPage()) return;
  if (enhanceTimer !== null) window.clearTimeout(enhanceTimer);

  enhanceTimer = window.setTimeout(() => {
    void loadMasters().then(() => {
      enhancePropertyDrag();
      enhanceRoomDrag();
    });
  }, 300);
}

function start(): void {
  if (initialized) return;
  initialized = true;

  scheduleEnhance();

  const observer = new MutationObserver(() => scheduleEnhance());
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", () => scheduleEnhance());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}

export {};