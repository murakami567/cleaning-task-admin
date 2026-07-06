import fs from "fs";

const path = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

function replaceOnce(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

// 物件ごとのタスク管理表示色。DBの properties.task_color を編集する。
replaceOnce(
  `  max_assignable_count?: number | null;

  cleaning_point?: number | null;
};`,
  `  max_assignable_count?: number | null;
  task_color?: string | null;

  cleaning_point?: number | null;
};`
);

replaceOnce(
  `   max_assignable_count: "",
   cleaning_point: "60",
 });`,
  `   max_assignable_count: "",
   task_color: "#ffffff",
   cleaning_point: "60",
 });`
);

replaceOnce(
  `   max_assignable_count: "",
   cleaning_point: "60",
 });

  const [roomForm, setRoomForm] = useState({`,
  `   max_assignable_count: "",
   task_color: "#ffffff",
   cleaning_point: "60",
 });

  const [roomForm, setRoomForm] = useState({`
);

replaceOnce(
  `    max_assignable_count:
      propertyForm.max_assignable_count === ""
        ? null
        : Number(propertyForm.max_assignable_count),

    cleaning_point: Number(propertyForm.cleaning_point || 60),`,
  `    max_assignable_count:
      propertyForm.max_assignable_count === ""
        ? null
        : Number(propertyForm.max_assignable_count),

    task_color: propertyForm.task_color || "#ffffff",
    cleaning_point: Number(propertyForm.cleaning_point || 60),`
);

replaceOnce(
  `    max_assignable_count: "",
    cleaning_point: "60",
    sort_order: "999",
 });`,
  `    max_assignable_count: "",
    task_color: "#ffffff",
    cleaning_point: "60",
    sort_order: "999",
 });`
);

replaceOnce(
  `    cleaning_point:
        property.cleaning_point == null
            ? "60"
            : String(property.cleaning_point),

    is_active: property.is_active,`,
  `    cleaning_point:
        property.cleaning_point == null
            ? "60"
            : String(property.cleaning_point),
    task_color: property.task_color || "#ffffff",

    is_active: property.is_active,`
);

replaceOnce(
  `    cleaning_point:
      Number(propertyEditForm.cleaning_point || 60),

    is_active: propertyEditForm.is_active,`,
  `    cleaning_point:
      Number(propertyEditForm.cleaning_point || 60),
    task_color: propertyEditForm.task_color || "#ffffff",

    is_active: propertyEditForm.is_active,`
);

replaceOnce(
  `  物件点数 {p.cleaning_point ?? 60}pt
 </div>`,
  `  物件点数 {p.cleaning_point ?? 60}pt
  {" / "}
  <span className="inline-flex items-center gap-1">
    <span className="inline-block h-3 w-3 rounded border border-slate-300" style={{ backgroundColor: p.task_color || "#ffffff" }} />
    色 {p.task_color || "#ffffff"}
  </span>
 </div>`
);

const colorFieldAdd = `

          <Field label="タスク表示カラー">
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1"
                value={propertyForm.task_color || "#ffffff"}
                onChange={(e) => setPropertyForm((p) => ({ ...p, task_color: e.target.value }))}
              />
              <TextInput
                value={propertyForm.task_color || "#ffffff"}
                onChange={(v) => setPropertyForm((p) => ({ ...p, task_color: v }))}
                placeholder="#ffffff"
              />
            </div>
          </Field>`;

replaceOnce(
  `          <Field label="物件点数">
    <TextInput
        type="number"
        value={propertyForm.cleaning_point}
        onChange={(v) =>
            setPropertyForm((p) => ({
                ...p,
                cleaning_point: v,
            }))
        }
    />
 </Field>
           
        </div>`,
  `          <Field label="物件点数">
    <TextInput
        type="number"
        value={propertyForm.cleaning_point}
        onChange={(v) =>
            setPropertyForm((p) => ({
                ...p,
                cleaning_point: v,
            }))
        }
    />
 </Field>${colorFieldAdd}
           
        </div>`
);

const colorFieldEdit = `

          <Field label="タスク表示カラー">
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1"
                value={propertyEditForm.task_color || "#ffffff"}
                onChange={(e) => setPropertyEditForm((p) => ({ ...p, task_color: e.target.value }))}
              />
              <TextInput
                value={propertyEditForm.task_color || "#ffffff"}
                onChange={(v) => setPropertyEditForm((p) => ({ ...p, task_color: v }))}
                placeholder="#ffffff"
              />
            </div>
          </Field>`;

replaceOnce(
  `          <Field label="物件点数">
    <TextInput
        type="number"
        value={propertyEditForm.cleaning_point}
        onChange={(v) =>
            setPropertyEditForm((p) => ({
                ...p,
                cleaning_point: v,
            }))
        }
    />
 </Field>

          <label className="inline-flex items-center gap-2 text-sm font-medium">`,
  `          <Field label="物件点数">
    <TextInput
        type="number"
        value={propertyEditForm.cleaning_point}
        onChange={(v) =>
            setPropertyEditForm((p) => ({
                ...p,
                cleaning_point: v,
            }))
        }
    />
 </Field>${colorFieldEdit}

          <label className="inline-flex items-center gap-2 text-sm font-medium">`
);

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
console.log("leader read-only and property task color patch done");
