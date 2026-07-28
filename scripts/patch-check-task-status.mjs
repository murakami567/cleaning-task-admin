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
    '        await api.post("/tasks/update", {',
    '        await api.post(\n          selectedTask.taskKind === "check"\n            ? "/api/employee/check-tasks/update"\n            : "/tasks/update",\n          {',
    "check task update endpoint",
  ],
  [
    '          status: denormalizeCleaningTaskStatus(status),\n          note,\n        });',
    '            status:\n              selectedTask.taskKind === "check"\n                ? denormalizeCheckTaskStatus(status)\n                : denormalizeCleaningTaskStatus(status),\n            note,\n          }\n        );',
    "check task status payload",
  ],
  [
    `                <option value="pending">未着手</option>\n                {task.taskKind !== "other" ? (\n                  <option value="started">清掃開始</option>\n                ) : null}\n                <option value="in_progress">\n                  {task.taskKind === "other" ? "対応中" : "清掃中"}\n                </option>\n                <option value="completed">\n                  {task.taskKind === "other" ? "完了" : "清掃完了"}\n                </option>\n                {task.taskKind !== "other" ? (\n                  <option value="cancelled">CXL</option>\n                ) : null}`,
    `                {task.taskKind === "check" ? (\n                  <>\n                    <option value="pending">未着手</option>\n                    <option value="check_completed">チェック完了</option>\n                    <option value="cancelled">CXL</option>\n                  </>\n                ) : (\n                  <>\n                    <option value="pending">未着手</option>\n                    {task.taskKind !== "other" ? (\n                      <option value="started">清掃開始</option>\n                    ) : null}\n                    <option value="in_progress">\n                      {task.taskKind === "other" ? "対応中" : "清掃中"}\n                    </option>\n                    <option value="completed">\n                      {task.taskKind === "other" ? "完了" : "清掃完了"}\n                    </option>\n                    {task.taskKind !== "other" ? (\n                      <option value="cancelled">CXL</option>\n                    ) : null}\n                  </>\n                )}`,
    "check task select options",
  ],
  [
    'function getStatusLabel(status: string, taskKind: EmployeeTask["taskKind"] = "cleaning") {\n  if (status === "completed") {',
    'function getStatusLabel(status: string, taskKind: EmployeeTask["taskKind"] = "cleaning") {\n  if (status === "check_completed") {\n    return {\n      label: "チェック完了",\n      className: "bg-indigo-50 text-indigo-700",\n    };\n  }\n  if (status === "completed") {',
    "check completed status label",
  ],
  [
    'function normalizeStatus(status: string) {\n  if (status === "completed") return "completed";',
    'function normalizeStatus(status: string) {\n  if (status === "check_completed") return "check_completed";\n  if (status === "completed") return "completed";',
    "normalize check completed",
  ],
  [
    'function denormalizeCleaningTaskStatus(status: string) {',
    'function denormalizeCheckTaskStatus(status: string) {\n  if (status === "check_completed") return "チェック完了";\n  if (status === "cancelled") return "CXL";\n  return "未着手";\n}\n\nfunction denormalizeCleaningTaskStatus(status: string) {',
    "denormalize check status",
  ],
]);

patchFile("src/AdminTasksPagePreview.tsx", [
  [
    '  { value: "完了", label: "清掃完了" },\n  { value: "持越", label: "持越" },',
    '  { value: "完了", label: "清掃完了" },\n  { value: "チェック完了", label: "チェック完了" },\n  { value: "持越", label: "持越" },',
    "admin check completed option",
  ],
  [
    '    case "完了":\n      return "border-slate-300 bg-slate-200 text-slate-700";',
    '    case "完了":\n      return "border-slate-300 bg-slate-200 text-slate-700";\n    case "チェック完了":\n      return "border-indigo-200 bg-indigo-50 text-indigo-700";',
    "admin check completed chip",
  ],
]);

console.log("patched check task statuses and admin sync");
