import fs from "fs";

const path = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

function replaceOnce(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

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

replaceOnce(
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

replaceOnce(
  `              <Button
                className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                onClick={() => setPropertyDrawerOpen(true)}
              >
                ＋物件追加
              </Button>`,
  `              {!readOnly ? (
                <Button
                  className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                  onClick={() => setPropertyDrawerOpen(true)}
                >
                  ＋物件追加
                </Button>
              ) : null}`
);

replaceOnce(
  `              <Button
                className="border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
                onClick={() => {
                  setRoomForm((p) => ({ ...p, property_id: selectedPropertyId || "" }));
                  setRoomBulkForm((p) => ({ ...p, property_id: selectedPropertyId || "" }));
                  setRoomDrawerOpen(true);
                }}
              >
                ＋部屋追加
              </Button>`,
  `              {!readOnly ? (
                <Button
                  className="border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
                  onClick={() => {
                    setRoomForm((p) => ({ ...p, property_id: selectedPropertyId || "" }));
                    setRoomBulkForm((p) => ({ ...p, property_id: selectedPropertyId || "" }));
                    setRoomDrawerOpen(true);
                  }}
                >
                  ＋部屋追加
                </Button>
              ) : null}`
);

// Property edit button becomes a read-only indicator.
replaceOnce(
  `                        <button
                          type="button"
                          className={\`rounded-full border px-3 py-1 text-xs font-bold \${
                            selected
                              ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }\`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProperty(p);
                          }}
                        >
                          編集
                        </button>`,
  `                        {!readOnly ? (
                          <button
                            type="button"
                            className={\`rounded-full border px-3 py-1 text-xs font-bold \${
                              selected
                                ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }\`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProperty(p);
                            }}
                          >
                            編集
                          </button>
                        ) : (
                          <span className={selected ? "text-xs text-white/70" : "text-xs text-slate-400"}>閲覧のみ</span>
                        )}`
);

replaceOnce(
  `                          <button
                            type="button"
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50"
                            onClick={() => openEditRoom(r)}
                          >
                            編集
                          </button>`,
  `                          {!readOnly ? (
                            <button
                              type="button"
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50"
                              onClick={() => openEditRoom(r)}
                            >
                              編集
                            </button>
                          ) : <span className="text-xs text-slate-400">閲覧のみ</span>}`
);

// Prep memo is also read-only for leaders.
replaceOnce(
  `                            placeholder="備考を入力"
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y"
                          />`,
  `                            placeholder="備考を入力"
                            rows={2}
                            disabled={readOnly}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y disabled:bg-slate-100 disabled:text-slate-500"
                          />`
);

text = text.replaceAll(
  'disabled={!dirty || prepSavingId === it.task_id}',
  'disabled={readOnly || !dirty || prepSavingId === it.task_id}'
);
text = text.replaceAll(
  'disabled={prepSavingId === it.task_id || !dirty}',
  'disabled={readOnly || prepSavingId === it.task_id || !dirty}'
);
text = text.replaceAll(
  'disabled={prepSavingId === it.task_id}',
  'disabled={readOnly || prepSavingId === it.task_id}'
);

fs.writeFileSync(path, text);
console.log("leader read-only patch done");
