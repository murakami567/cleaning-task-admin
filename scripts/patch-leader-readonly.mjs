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

// 以前のドラッグ並び替えパッチは既存実装と衝突してタグ不整合を起こすため停止。
// 物件カードのドラッグ機能は元の実装をそのまま使用する。
function patchPropertyDragReorder() {
  return;
}

ensureAuthHelpers();
patchLeaderReadonlyUi();
patchPropertyDragReorder();

fs.writeFileSync(path, text);
console.log("patched leader readonly only");
