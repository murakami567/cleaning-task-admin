import fs from "node:fs";

const path = "src/AdminTasksPagePreview.tsx";
let text = fs.readFileSync(path, "utf8");

function replaceOnce(search, replacement, label) {
  if (!text.includes(search)) {
    throw new Error(`${label} target not found`);
  }
  text = text.replace(search, replacement);
}

replaceOnce(
  'import { sortTasksByPropertyOrder } from "./utils/propertyOrder";\n',
  "",
  "fixed-order import"
);

const colorPattern = /const PROPERTY_COLORS: Record<string, string> = \{[\s\S]*?function getPropertyColor\(raw: string\) \{[\s\S]*?\n\}/;
if (!colorPattern.test(text)) throw new Error("legacy color block not found");
text = text.replace(
  colorPattern,
  `function normalizePropertyLabel(raw: string) {
  return String(raw || "")
    .normalize("NFKC")
    .replace(/[\\s　]+/g, "")
    .trim();
}

function normalizeTaskColor(value?: string | null) {
  const color = String(value || "#ffffff").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#ffffff";
}`
);

replaceOnce(
  `  sort_order: number | null;
  is_active: boolean;`,
  `  sort_order: number | null;
  task_color?: string | null;
  is_active: boolean;`,
  "PropertyMaster task_color"
);

replaceOnce(
  `  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);`,
  `  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);
  const [masterRooms, setMasterRooms] = useState<RoomMaster[]>([]);`,
  "masterRooms state"
);

replaceOnce(
  `  const propertyNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of properties) {
      if (p.property_name) map.set(p.property_name, p.id);
      if (p.normalized_name) map.set(p.normalized_name, p.id);
    }
    return map;
  }, [properties]);`,
  `  const propertyNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of properties) {
      if (p.property_name) {
        map.set(normalizePropertyLabel(p.property_name), p.id);
      }
      if (p.normalized_name) {
        map.set(normalizePropertyLabel(p.normalized_name), p.id);
      }
    }
    return map;
  }, [properties]);

  const resolveTaskProperty = (taskProperty: string) => {
    const key = normalizePropertyLabel(taskProperty);
    const exact = properties.find(
      (property) =>
        normalizePropertyLabel(property.property_name) === key ||
        normalizePropertyLabel(property.normalized_name || "") === key
    );
    if (exact) return exact;

    return properties.find((property) => {
      const names = [property.property_name, property.normalized_name]
        .map((name) => normalizePropertyLabel(name || ""))
        .filter(Boolean);
      return names.some(
        (name) => name.includes(key) || (key && key.includes(name))
      );
    });
  };`,
  "property resolver"
);

replaceOnce(
  'const propertyId = propertyName ? propertyNameToId.get(propertyName) : "";',
  `const propertyId = propertyName
      ? propertyNameToId.get(normalizePropertyLabel(propertyName))
      : "";`,
  "attendee property lookup"
);

replaceOnce(
  `  const loadProperties = async () => {
    const res = await fetch(\`${API_BASE}/properties\`);
    if (!res.ok) throw new Error(\`properties fetch failed: \${res.status}\`);
    const data: PropertyMaster[] = await res.json();
    setProperties(
      data
        .filter((p) => p.is_active)
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
    );
  };`,
  `  const loadProperties = async () => {
    const [propertyRes, roomRes] = await Promise.all([
      fetch(\`${API_BASE}/properties\`),
      fetch(\`${API_BASE}/rooms\`),
    ]);

    if (!propertyRes.ok) {
      throw new Error(\`properties fetch failed: \${propertyRes.status}\`);
    }
    if (!roomRes.ok) {
      throw new Error(\`rooms fetch failed: \${roomRes.status}\`);
    }

    const propertyData: PropertyMaster[] = await propertyRes.json();
    const roomData: RoomMaster[] = await roomRes.json();

    setProperties(
      propertyData
        .filter((property) => property.is_active)
        .sort(
          (a, b) =>
            (a.sort_order ?? 999999) - (b.sort_order ?? 999999)
        )
    );
    setMasterRooms(roomData.filter((room) => room.is_active));
  };`,
  "master loaders"
);

const visiblePattern = /  const visibleCleaningTasks = useMemo\(\(\) => \{[\s\S]*?\n\}, \[cleaningTasks, viewMode, selectedDate\]\);/;
if (!visiblePattern.test(text)) throw new Error("visibleCleaningTasks target not found");
text = text.replace(
  visiblePattern,
  `  const visibleCleaningTasks = useMemo(() => {
    const list = Array.isArray(cleaningTasks) ? cleaningTasks : [];

    let tasks: CleaningTask[] = [];

    if (viewMode === "TODAY") {
      tasks = list.filter((task) => normalizeIsoDate(task.date) === baseDate);
    } else if (viewMode === "FUTURE") {
      tasks = list.filter((task) => isFutureDate(task.date));
    } else {
      tasks = list.filter(
        (task) => normalizeIsoDate(task.date) === selectedDate
      );
    }

    const roomOrder = new Map<string, number>();
    masterRooms.forEach((room, index) => {
      const order = room.room_sort_order ?? index + 1;
      [room.room_name, room.room_code, room.room_key, room.normalized_room_key]
        .filter(Boolean)
        .forEach((name) => {
          roomOrder.set(
            \`${room.property_id}::\${normalizePropertyLabel(String(name))}\`,
            order
          );
        });
    });

    return [...tasks].sort((a, b) => {
      if (viewMode === "FUTURE") {
        const dateDiff = String(a.date || "").localeCompare(
          String(b.date || "")
        );
        if (dateDiff !== 0) return dateDiff;
      }

      const propertyA = resolveTaskProperty(a.property);
      const propertyB = resolveTaskProperty(b.property);
      const propertyOrderA = propertyA?.sort_order ?? 999999;
      const propertyOrderB = propertyB?.sort_order ?? 999999;

      if (propertyOrderA !== propertyOrderB) {
        return propertyOrderA - propertyOrderB;
      }

      if (!propertyA && !propertyB && a.property !== b.property) {
        return a.property.localeCompare(b.property, "ja", { numeric: true });
      }

      const roomOrderA =
        roomOrder.get(
          \`${propertyA?.id || ""}::\${normalizePropertyLabel(a.room || "")}\`
        ) ?? 999999;
      const roomOrderB =
        roomOrder.get(
          \`${propertyB?.id || ""}::\${normalizePropertyLabel(b.room || "")}\`
        ) ?? 999999;

      if (roomOrderA !== roomOrderB) {
        return roomOrderA - roomOrderB;
      }

      return String(a.room || "").localeCompare(String(b.room || ""), "ja", {
        numeric: true,
      });
    });
  }, [cleaningTasks, viewMode, selectedDate, properties, masterRooms]);`
);

replaceOnce(
  "extractPropertyName(task.property),",
  "task.property,",
  "CSV property display"
);

replaceOnce(
  `                      const propertyColor = getPropertyColor(t.property);
                      const normalizedPropertyName = extractPropertyName(t.property);`,
  `                      const matchedProperty = resolveTaskProperty(t.property);
                      const propertyColor = normalizeTaskColor(
                        matchedProperty?.task_color
                      );`,
  "row property color"
);

replaceOnce(
  `                          <Td>
                            <div className="font-medium">
                              {normalizedPropertyName}
                            </div>
                            {normalizedPropertyName !== t.property ? (
                              <div className="text-xs text-black/50">
                                {t.property}
                              </div>
                            ) : null}
                          </Td>`,
  `                          <Td>
                            <div className="font-medium">{t.property}</div>
                          </Td>`,
  "original property display"
);

fs.writeFileSync(path, text, "utf8");
console.log("Updated", path);
