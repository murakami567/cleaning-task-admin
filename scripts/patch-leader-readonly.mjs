import fs from "fs";

const path = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

if (!text.includes("function getAdminRole()")) {
  text = text.replace(
    "function Select({\n",
    "function getAdminRole() {\n  try {\n    const raw = localStorage.getItem(\"admin_user\");\n    return raw ? String(JSON.parse(raw)?.role || \"\") : \"\";\n  } catch {\n    return \"\";\n  }\n}\n\nfunction authJsonHeaders() {\n  const token = localStorage.getItem(\"admin_access_token\") || \"\";\n  return { \"Content-Type\": \"application/json\", Authorization: `Bearer ${token}` };\n}\n\nfunction Select({\n"
  );
}

if (!text.includes("const readOnly = getAdminRole() === \"leader\";")) {
  text = text.replace(
    "  const [mainTab, setMainTab] = useState<MainTab>(\"rooms\");\n",
    "  const [mainTab, setMainTab] = useState<MainTab>(\"rooms\");\n  const readOnly = getAdminRole() === \"leader\";\n"
  );
}

text = text.replaceAll(
  "headers: { \"Content-Type\": \"application/json\" },",
  "headers: authJsonHeaders(),"
);

text = text.replace(
  "              <Button\n                className=\"border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100\"\n                onClick={() => setPropertyDrawerOpen(true)}\n              >\n                ＋物件追加\n              </Button>",
  "              {!readOnly ? (\n                <Button\n                  className=\"border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100\"\n                  onClick={() => setPropertyDrawerOpen(true)}\n                >\n                  ＋物件追加\n                </Button>\n              ) : null}"
);

text = text.replace(
  "              <Button\n                className=\"border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100\"\n                onClick={() => {\n                  setRoomForm((p) => ({ ...p, property_id: selectedPropertyId || \"\" }));\n                  setRoomBulkForm((p) => ({ ...p, property_id: selectedPropertyId || \"\" }));\n                  setRoomDrawerOpen(true);\n                }}\n              >\n                ＋部屋追加\n              </Button>",
  "              {!readOnly ? (\n                <Button\n                  className=\"border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100\"\n                  onClick={() => {\n                    setRoomForm((p) => ({ ...p, property_id: selectedPropertyId || \"\" }));\n                    setRoomBulkForm((p) => ({ ...p, property_id: selectedPropertyId || \"\" }));\n                    setRoomDrawerOpen(true);\n                  }}\n                >\n                  ＋部屋追加\n                </Button>\n              ) : null}"
);

text = text.replace(
  "                          <button\n                            type=\"button\"\n                            className=\"rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50\"\n                            onClick={() => openEditRoom(r)}\n                          >\n                            編集\n                          </button>",
  "                          {!readOnly ? (\n                            <button\n                              type=\"button\"\n                              className=\"rounded-full border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50\"\n                              onClick={() => openEditRoom(r)}\n                            >\n                              編集\n                            </button>\n                          ) : <span className=\"text-xs text-slate-400\">閲覧のみ</span>}"
);

text = text.replaceAll(
  "disabled={!dirty || prepSavingId === it.task_id}",
  "disabled={readOnly || !dirty || prepSavingId === it.task_id}"
);
text = text.replaceAll(
  "disabled={prepSavingId === it.task_id}",
  "disabled={readOnly || prepSavingId === it.task_id}"
);

fs.writeFileSync(path, text);
console.log("leader read-only patch done");
