import fs from "fs";

const path = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

function rep(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

function ensureAuthHelpers() {
  if (!text.includes("function getAdminRole()")) {
    text = text.replace(
      "function Select({\n",
      "function getAdminRole() {\n  try {\n    const raw = localStorage.getItem(\"admin_user\");\n    return raw ? String(JSON.parse(raw)?.role || \"\") : \"\";\n  } catch {\n    return \"\";\n  }\n}\n\nfunction authJsonHeaders() {\n  const token = localStorage.getItem(\"admin_access_token\") || \"\";\n  return { \"Content-Type\": \"application/json\", Authorization: `Bearer ${token}` };\n}\n\nfunction Select({\n"
    );
  }

  if (!text.includes('const readOnly = getAdminRole() === "leader";')) {
    text = text.replace(
      '  const [mainTab, setMainTab] = useState<MainTab>("rooms");\n',
      '  const [mainTab, setMainTab] = useState<MainTab>("rooms");\n  const readOnly = getAdminRole() === "leader";\n'
    );
  }

  text = text.replaceAll(
    'headers: { "Content-Type": "application/json" },',
    'headers: authJsonHeaders(),'
  );
}

function patchLeaderReadonlyUi() {
  const guard = '      if (readOnly) {\n        alert("リーダー権限では閲覧のみ可能です。");\n        return;\n      }\n';
  [
    '  const savePrepNote = async (taskId: string) => {\n    const note = prepNoteDrafts[taskId] ?? "";\n    try {',
    '  const createProperty = async () => {\n    try {',
    '  const createRoom = async () => {\n    try {',
    '  const createRoomsBulk = async () => {\n    try {',
    '  const savePropertyEdit = async () => {\n    try {',
    '  const saveRoomEdit = async () => {\n    try {',
    '  const deleteRoom = async () => {\n    try {',
  ].forEach((needle) => {
    if (text.includes(needle) && !text.includes(needle + '\n' + guard)) {
      text = text.replace(needle, needle + '\n' + guard);
    }
  });

  rep(
    `          <div className="mt-1 text-sm text-slate-500">
            {mainTab === "rooms"
              ? "物件マスタ・部屋マスタを管理します。"
              : "翌日以降の清掃に対する準備物を確認します。"}
          </div>`,
    `          <div className="mt-1 text-sm text-slate-500">
            {mainTab === "rooms"
              ? "物件マスタ・部屋マスタを管理します。"
              : "翌日以降の清掃に対する準備物を確認します。"}
          </div>
          {readOnly ? <div className="mt-2 text-xs font-bold text-amber-700">リーダー権限では閲覧のみ可能です。</div> : null}`
  );
}

function patchPropertyReorder() {
  if (!text.includes("const [draggedPropertyId, setDraggedPropertyId]")) {
    rep(
      '  const [selectedPropertyId, setSelectedPropertyId] = useState("");\n  const [roomSearch, setRoomSearch] = useState("");',
      '  const [selectedPropertyId, setSelectedPropertyId] = useState("");\n  const [draggedPropertyId, setDraggedPropertyId] = useState("");\n  const [roomSearch, setRoomSearch] = useState("");'
    );
  }

  if (!text.includes("const savePropertyOrder = async")) {
    rep(
      '  const filteredProperties = useMemo(() => {',
      '  const savePropertyOrder = async (orderedProperties: PropertyMaster[]) => {\n    if (readOnly) return;\n\n    const next = orderedProperties.map((p, index) => ({\n      ...p,\n      sort_order: (index + 1) * 10,\n    }));\n    const before = properties;\n    setProperties(next);\n\n    try {\n      await Promise.all(\n        next.map((p) =>\n          fetch(`${API_BASE}/properties/update`, {\n            method: "POST",\n            headers: authJsonHeaders(),\n            body: JSON.stringify({ property_id: p.id, sort_order: p.sort_order }),\n          }).then(async (res) => {\n            if (!res.ok) {\n              throw new Error(`property order update failed: ${res.status} / ${await res.text()}`);\n            }\n          })\n        )\n      );\n      await loadAll();\n    } catch (e) {\n      console.error(e);\n      setProperties(before);\n      alert("物件の並び順保存に失敗しました。管理者で再ログインしてから再度お試しください。");\n    }\n  };\n\n  const movePropertyByDrag = (dragId: string, dropId: string) => {\n    if (readOnly || !dragId || !dropId || dragId === dropId) return;\n    const ordered = [...properties].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));\n    const fromIndex = ordered.findIndex((p) => p.id === dragId);\n    const toIndex = ordered.findIndex((p) => p.id === dropId);\n    if (fromIndex < 0 || toIndex < 0) return;\n    const [moved] = ordered.splice(fromIndex, 1);\n    ordered.splice(toIndex, 0, moved);\n    void savePropertyOrder(ordered);\n  };\n\n  const filteredProperties = useMemo(() => {'
    );
  }

  rep(
    `                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPropertyId(p.id)}
                        className={[
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >`,
    `                      <button
                        key={p.id}
                        type="button"
                        draggable={!readOnly}
                        onDragStart={(e) => {
                          if (readOnly) return;
                          setDraggedPropertyId(p.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", p.id);
                        }}
                        onDragOver={(e) => {
                          if (readOnly) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          if (readOnly) return;
                          e.preventDefault();
                          const dragId = e.dataTransfer.getData("text/plain") || draggedPropertyId;
                          setDraggedPropertyId("");
                          movePropertyByDrag(dragId, p.id);
                        }}
                        onDragEnd={() => setDraggedPropertyId("")}
                        onClick={() => setSelectedPropertyId(p.id)}
                        className={[
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          !readOnly ? "cursor-grab active:cursor-grabbing" : "",
                          draggedPropertyId === p.id ? "opacity-50" : "",
                          selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >`
  );

  rep(
    `                            <div className="text-sm font-bold">{p.sort_order ?? 999}. {p.property_name}</div>`,
    `                            <div className="text-sm font-bold">{!readOnly ? <span className="mr-2 text-xs opacity-60">↕</span> : null}{p.sort_order ?? 999}. {p.property_name}</div>`
  );
}

ensureAuthHelpers();
patchLeaderReadonlyUi();
patchPropertyReorder();

fs.writeFileSync(path, text);
console.log("patched leader readonly and property reorder");
