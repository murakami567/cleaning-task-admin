import fs from "fs";

const path = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

function replaceOnce(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

// Role helper
replaceOnce(
  `function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function PropertyManagementPage() {`,
  `function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function getAdminRole() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? String(JSON.parse(raw)?.role || "") : "";
  } catch {
    return "";
  }
}

function authHeaders() {
  const token = localStorage.getItem("admin_access_token") || "";
  return { "Content-Type": "application/json", Authorization: ` + "`Bearer ${token}`" + ` };
}

export default function PropertyManagementPage() {`
);

replaceOnce(
  `  const [mainTab, setMainTab] = useState<MainTab>("rooms");\n`,
  `  const [mainTab, setMainTab] = useState<MainTab>("rooms");\n  const readOnly = getAdminRole() === "leader";\n`
);

// Auth headers for protected write endpoints.
text = text.replaceAll(`headers: { "Content-Type": "application/json" },`, `headers: authHeaders(),`);

// Guard write functions.
const guard = `      if (readOnly) {\n        alert("リーダー権限では閲覧のみ可能です。");\n        return;\n      }\n`;
[
  `  const savePrepNote = async (taskId: string) => {\n    const note = prepNoteDrafts[taskId] ?? "";\n    try {`,
  `  const createProperty = async () => {\n    try {`,
  `  const createRoom = async () => {\n    try {`,
  `  const createRoomsBulk = async () => {\n    try {`,
  `  const savePropertyEdit = async () => {\n    try {`,
  `  const saveRoomEdit = async () => {\n    try {`,
  `  const deleteRoom = async () => {\n    try {`,
].forEach((needle) => {
  if (text.includes(needle) && !text.includes(needle + `\n` + guard)) {
    text = text.replace(needle, needle + `\n` + guard);
  }
});

// Add read-only notice under page subtitle.
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

// Hide add buttons for leaders.
replaceOnce(
  `          {mainTab === "rooms" ? (
            <>`,
  `          {mainTab === "rooms" ? (
            <>\n              {!readOnly ? (<>`
);
replaceOnce(
  `              <Button onClick={() => void loadAll()}>更新</Button>
            </>`,
  `              </>) : null}\n              <Button onClick={() => void loadAll()}>更新</Button>
            </>`
);

// Change edit labels and prevent edit drawer for leaders on list buttons.
text = text.replaceAll(`openEditProperty(p);`, `readOnly ? undefined : openEditProperty(p);`);
text = text.replaceAll(`onClick={() => openEditRoom(r)}`, `onClick={() => (readOnly ? undefined : openEditRoom(r))}`);
text = text.replaceAll(`>\n                           編集\n                         </button>`, `>\n                           {readOnly ? "閲覧" : "編集"}\n                         </button>`);
text = text.replaceAll(`>\n                             編集\n                           </button>`, `>\n                             {readOnly ? "閲覧" : "編集"}\n                           </button>`);

// Prep note is read-only for leaders.
text = text.replace(
  `                             onChange={(e) =>
                              setPrepNoteDrafts((prev) => ({
                                ...prev,
                                [it.task_id]: e.target.value,
                              }))
                            }
                            placeholder="備考を入力"
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y"
                          />`,
  `                             onChange={(e) =>
                              setPrepNoteDrafts((prev) => ({
                                ...prev,
                                [it.task_id]: e.target.value,
                              }))
                            }
                            placeholder="備考を入力"
                            rows={2}
                            disabled={readOnly}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y disabled:bg-slate-100 disabled:text-slate-500"
                          />`
);
text = text.replace(
  `                             disabled={prepSavingId === it.task_id || !dirty}`,
  `                             disabled={readOnly || prepSavingId === it.task_id || !dirty}`
);

fs.writeFileSync(path, text);
console.log("patched PropertyManagementPage leader read-only");
