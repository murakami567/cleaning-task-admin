import fs from "node:fs";

function patchFile(file, replacements) {
  let src = fs.readFileSync(file, "utf8");
  for (const [from, to, label] of replacements) {
    if (src.includes(to)) continue;
    if (!src.includes(from)) throw new Error(`patch target not found: ${label}`);
    src = src.replace(from, to);
  }
  fs.writeFileSync(file, src);
}

patchFile("src/pages/employee/EmployeeTasksPage.tsx", [
  [
    '  const [lostItemOpen, setLostItemOpen] = useState(false);',
    '  const [lostItemOpen, setLostItemOpen] = useState(false);\n  const [equipmentReportOpen, setEquipmentReportOpen] = useState(false);',
    "equipment report state",
  ],
  [
    `            {canReportLostItem ? (\n              <button\n                type="button"\n                onClick={() => setLostItemOpen(true)}\n                className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"\n              >\n                忘れ物報告\n              </button>\n            ) : null}`,
    `            {canReportLostItem ? (\n              <>\n                <button\n                  type="button"\n                  onClick={() => setLostItemOpen(true)}\n                  className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"\n                >\n                  忘れ物報告\n                </button>\n                <button\n                  type="button"\n                  onClick={() => setEquipmentReportOpen(true)}\n                  className="w-full rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-100"\n                >\n                  設備トラブル報告\n                </button>\n              </>\n            ) : null}`,
    "equipment report button",
  ],
  [
    `      {lostItemOpen ? (\n        <LostItemModal\n          task={task}\n          onClose={() => setLostItemOpen(false)}\n        />\n      ) : null}`,
    `      {lostItemOpen ? (\n        <LostItemModal\n          task={task}\n          onClose={() => setLostItemOpen(false)}\n        />\n      ) : null}\n\n      {equipmentReportOpen ? (\n        <EquipmentTroubleModal\n          task={task}\n          onClose={() => setEquipmentReportOpen(false)}\n        />\n      ) : null}`,
    "equipment report modal render",
  ],
  [
    `async function compressImage(file: File): Promise<string> {`,
    `function EquipmentTroubleModal({\n  task,\n  onClose,\n}: {\n  task: EmployeeTask;\n  onClose: () => void;\n}) {\n  const [description, setDescription] = useState("");\n  const [photoDataUrl, setPhotoDataUrl] = useState("");\n  const [processingPhoto, setProcessingPhoto] = useState(false);\n  const [saving, setSaving] = useState(false);\n  const taskDate = task.date || task.dueDate || "";\n\n  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {\n    const file = e.target.files?.[0];\n    if (!file) return;\n    try {\n      setProcessingPhoto(true);\n      setPhotoDataUrl(await compressImage(file));\n    } catch (error) {\n      console.error("設備報告画像処理エラー:", error);\n      alert("写真の読み込みに失敗しました。");\n    } finally {\n      setProcessingPhoto(false);\n      e.target.value = "";\n    }\n  }\n\n  async function handleSave() {\n    if (saving) return;\n    if (!description.trim()) {\n      alert("報告内容を入力してください。");\n      return;\n    }\n    if (!photoDataUrl) {\n      alert("写真を添付してください。");\n      return;\n    }\n    try {\n      setSaving(true);\n      await api.post("/api/employee/facility-reports", {\n        task_id: task.id,\n        property_name: task.propertyName || "",\n        room_name: task.roomName || "",\n        task_date: taskDate,\n        description: description.trim(),\n        photo_url: photoDataUrl,\n      });\n      alert("設備トラブルを報告しました。");\n      onClose();\n    } catch (error) {\n      console.error("設備トラブル報告エラー:", error);\n      alert(error instanceof Error ? error.message : "報告の保存に失敗しました。");\n    } finally {\n      setSaving(false);\n    }\n  }\n\n  return (\n    <div\n      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3 py-4 sm:px-4"\n      onMouseDown={(e) => {\n        if (e.target === e.currentTarget) onClose();\n      }}\n    >\n      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">\n        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">\n          <div className="text-xl font-bold text-slate-900">設備トラブル報告</div>\n          <button onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">閉じる</button>\n        </div>\n\n        <div className="max-h-[68vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-5">\n          <InfoRow label="部屋" value={\`${task.propertyName || "-"} ${task.roomName || ""}\`.trim()} />\n          <InfoRow label="日付" value={formatDate(taskDate)} />\n\n          <div>\n            <div className="mb-2 text-sm font-semibold text-slate-700">報告内容</div>\n            <textarea\n              value={description}\n              onChange={(e) => setDescription(e.target.value)}\n              placeholder="例：エアコンが動かない、排水が詰まっている、照明が切れている"\n              rows={5}\n              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"\n            />\n          </div>\n\n          <div>\n            <div className="mb-2 text-sm font-semibold text-slate-700">写真（必須）</div>\n            {photoDataUrl ? (\n              <div className="space-y-2">\n                <img src={photoDataUrl} alt="設備トラブルの写真" className="w-full rounded-2xl border border-slate-200" />\n                <button type="button" onClick={() => setPhotoDataUrl("")} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">撮り直す</button>\n              </div>\n            ) : (\n              <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm font-semibold text-slate-600 hover:bg-slate-100">\n                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />\n                {processingPhoto ? "読み込み中..." : "📷 撮影 / 写真を選択"}\n              </label>\n            )}\n          </div>\n        </div>\n\n        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">\n          <div className="flex gap-3">\n            <button onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">キャンセル</button>\n            <button onClick={handleSave} disabled={saving || !description.trim() || !photoDataUrl} className="flex-1 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white hover:bg-black disabled:opacity-50">\n              {saving ? "保存中..." : "保存"}\n            </button>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nasync function compressImage(file: File): Promise<string> {`,
    "equipment trouble modal",
  ],
]);

patchFile("src/App.tsx", [
  [
    'import AdminLostItemsPage from "./pages/admin/AdminLostItemsPage";',
    'import AdminLostItemsPage from "./pages/admin/AdminLostItemsPage";\nimport AdminFacilityReportsPage from "./pages/admin/AdminFacilityReportsPage";',
    "admin facility report import",
  ],
  [
    '        <AdminNavButton to="/admin/lost-items">忘れ物</AdminNavButton>',
    '        <AdminNavButton to="/admin/lost-items">忘れ物</AdminNavButton>\n        <AdminNavButton to="/admin/facility-reports">設備報告</AdminNavButton>',
    "admin facility report nav",
  ],
  [
    '          <Route path="lost-items" element={<AdminLostItemsPage />} />',
    '          <Route path="lost-items" element={<AdminLostItemsPage />} />\n          <Route path="facility-reports" element={<AdminFacilityReportsPage />} />',
    "admin facility report route",
  ],
]);

console.log("patched equipment trouble reporting");
