import fs from "fs";

const path = "src/AccountManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

function rep(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

if (!text.includes("function getAdminRole()")) {
  rep(
    "function PropertyCheckCard({",
    "function getAdminRole() {\n  try {\n    const raw = localStorage.getItem(\"admin_user\");\n    return raw ? String(JSON.parse(raw)?.role || \"\") : \"\";\n  } catch {\n    return \"\";\n  }\n}\n\nfunction authJsonHeaders() {\n  const token = localStorage.getItem(\"admin_access_token\") || \"\";\n  return { \"Content-Type\": \"application/json\", Authorization: `Bearer ${token}` };\n}\n\nfunction PropertyCheckCard({"
  );
}

if (!text.includes('const readOnly = getAdminRole() === "leader";')) {
  rep(
    "  const [saving, setSaving] = useState(false);\n",
    "  const [saving, setSaving] = useState(false);\n  const readOnly = getAdminRole() === \"leader\";\n"
  );
}

text = text.replaceAll(
  'headers: { "Content-Type": "application/json" },',
  'headers: authJsonHeaders(),'
);

rep(
  "  const openNew = () => {\n    setSelected(null);",
  "  const openNew = () => {\n    if (readOnly) return;\n    setSelected(null);"
);

rep(
  "  const save = async () => {\n    if (!form.staff_code.trim()) {",
  "  const save = async () => {\n    if (readOnly) {\n      alert(\"リーダー権限では閲覧のみ可能です。\");\n      return;\n    }\n    if (!form.staff_code.trim()) {"
);

rep(
  "          <div className=\"text-base font-extrabold mt-1\">アカウント管理</div>\n        </div>",
  "          <div className=\"text-base font-extrabold mt-1\">アカウント管理</div>\n          {readOnly ? <div className=\"mt-2 text-xs font-bold text-amber-700\">リーダー権限では閲覧のみ可能です。</div> : null}\n        </div>"
);

rep(
  "          <button\n            className=\"rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-black\"\n            onClick={openNew}\n          >\n            ＋アカウント追加\n          </button>",
  "          {!readOnly ? (\n            <button\n              className=\"rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-black\"\n              onClick={openNew}\n            >\n              ＋アカウント追加\n            </button>\n          ) : null}"
);

rep(
  "        title={selected ? \"アカウント編集\" : \"アカウント追加\"}",
  "        title={readOnly ? \"アカウント閲覧\" : selected ? \"アカウント編集\" : \"アカウント追加\"}"
);

rep(
  "            <div className=\"text-xs text-slate-500\">保存後、一覧に反映されます。</div>",
  "            <div className=\"text-xs text-slate-500\">{readOnly ? \"閲覧のみ可能です。\" : \"保存後、一覧に反映されます。\"}</div>"
);

rep(
  "              <Button\n                className=\"bg-slate-900 text-white border-slate-900 hover:bg-black\"\n                onClick={save}\n                disabled={saving}\n              >\n                {saving ? \"保存中...\" : \"保存\"}\n              </Button>",
  "              {!readOnly ? (\n                <Button\n                  className=\"bg-slate-900 text-white border-slate-900 hover:bg-black\"\n                  onClick={save}\n                  disabled={saving}\n                >\n                  {saving ? \"保存中...\" : \"保存\"}\n                </Button>\n              ) : null}"
);

fs.writeFileSync(path, text);
console.log("account leader read-only patch done");
