import fs from "node:fs";

const file = "src/pages/employee/EmployeeTasksPage.tsx";
let src = fs.readFileSync(file, "utf8");

const replaceOnce = (from, to, label) => {
  if (src.includes(to)) return;
  if (!src.includes(from)) throw new Error(`patch target not found: ${label}`);
  src = src.replace(from, to);
};

replaceOnce(
`type EmployeeTask = {
  id: string;
  taskKind: "other" | "cleaning" | "check";
  title: string;
  propertyName: string;
  roomName: string;
  dueDate: string;
  status: string;
  note?: string;
  assigneeName?: string;
  checkerName?: string;
  date?: string;
  deadline?: string;
  rateCi?: number | string;
  rateCo?: number | string;
  towelCount?: number | string;
};`,
`type EmployeeTask = {
  id: string;
  taskKind: "other" | "cleaning" | "check";
  title: string;
  propertyName: string;
  roomName: string;
  dueDate: string;
  status: string;
  note?: string;
  assigneeName?: string;
  checkerName?: string;
  date?: string;
  deadline?: string;
  rateCi?: number | string;
  rateCo?: number | string;
  towelCount?: number | string;
  checklist?: Record<string, boolean>;
};

type CheckListState = Record<string, boolean>;

const CHECKLIST_ITEMS = [
  { key: "entrance", label: "玄関" },
  { key: "bathroom", label: "浴室" },
  { key: "toilet", label: "トイレ" },
  { key: "bed", label: "ベッド" },
  { key: "linen", label: "リネン" },
  { key: "garbage", label: "ゴミ" },
  { key: "kitchen", label: "キッチン" },
  { key: "furniture", label: "家具" },
  { key: "appliance", label: "家電" },
  { key: "amenity", label: "アメニティ" },
  { key: "photo", label: "写真確認" },
];`,
"EmployeeTask type"
);

replaceOnce(`  async function saveTask(taskId: string, status: string, note: string) {`, `  async function saveTask(taskId: string, status: string, note: string, checklist?: CheckListState) {`, "saveTask signature");

replaceOnce(
`        await api.post("/tasks/update", {
          task_id: taskId,
          status: denormalizeCleaningTaskStatus(status),
          note,
        });`,
`        const payload: Record<string, unknown> = {
          task_id: taskId,
          status: denormalizeCleaningTaskStatus(status, selectedTask.taskKind),
          note,
        };
        if (selectedTask.taskKind === "check") {
          payload.checklist = checklist || {};
          payload.checked_by_name = user?.name || "";
        }
        await api.post("/tasks/update", payload);`,
"tasks update payload"
);

replaceOnce(`  onSave: (taskId: string, status: string, note: string) => Promise<void>;`, `  onSave: (taskId: string, status: string, note: string, checklist?: CheckListState) => Promise<void>;`, "onSave type");

replaceOnce(`  const [note, setNote] = useState(task.note || "");
  const [lostItemOpen, setLostItemOpen] = useState(false);`, `  const [note, setNote] = useState(task.note || "");
  const [checklist, setChecklist] = useState<CheckListState>(() => ({ ...(task.checklist || {}) }));
  const [lostItemOpen, setLostItemOpen] = useState(false);`, "checklist state");

replaceOnce(
`                <option value="pending">未着手</option>
                {task.taskKind !== "other" ? (
                  <option value="started">清掃開始</option>
                ) : null}
                <option value="in_progress">
                  {task.taskKind === "other" ? "対応中" : "清掃中"}
                </option>
                <option value="completed">
                  {task.taskKind === "other" ? "完了" : "清掃完了"}
                </option>
                {task.taskKind !== "other" ? (
                  <option value="cancelled">CXL</option>
                ) : null}`,
`                <option value="pending">未着手</option>
                {task.taskKind === "cleaning" ? (
                  <option value="started">清掃開始</option>
                ) : null}
                <option value="in_progress">
                  {task.taskKind === "other" ? "対応中" : task.taskKind === "check" ? "チェック中" : "清掃中"}
                </option>
                <option value="completed">
                  {task.taskKind === "other" ? "完了" : "清掃完了"}
                </option>
                {task.taskKind === "check" ? <option value="check_completed">チェック完了</option> : null}
                {task.taskKind !== "other" ? (
                  <option value="cancelled">CXL</option>
                ) : null}`,
"status options"
);

replaceOnce(`            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">備考</div>`, `            {task.taskKind === "check" ? (
              <CheckListBox checklist={checklist} onChange={setChecklist} />
            ) : null}

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">備考</div>`, "insert checklist");

replaceOnce(`              onClick={() => onSave(task.id, status, note)}`, `              onClick={() => {
                if (task.taskKind === "check" && status === "check_completed") {
                  const missing = CHECKLIST_ITEMS.filter((item) => !checklist[item.key]);
                  if (missing.length > 0) {
                    alert("未チェックの項目があります：" + missing.map((x) => x.label).join("、"));
                    return;
                  }
                }
                void onSave(task.id, status, note, task.taskKind === "check" ? checklist : undefined);
              }}`, "save click");

replaceOnce(`function LostItemModal({`, `function CheckListBox({
  checklist,
  onChange,
}: {
  checklist: CheckListState;
  onChange: (next: CheckListState) => void;
}) {
  const checkedCount = CHECKLIST_ITEMS.filter((item) => checklist[item.key]).length;
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-slate-900">チェックリスト</div>
        <div className="text-xs font-semibold text-slate-500">{checkedCount} / {CHECKLIST_ITEMS.length}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {CHECKLIST_ITEMS.map((item) => {
          const checked = !!checklist[item.key];
          return (
            <label
              key={item.key}
              className={"flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold " + (checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange({ ...checklist, [item.key]: e.target.checked })}
              />
              {item.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function LostItemModal({`, "CheckListBox component");

replaceOnce(`  if (status === "completed") {
    return {
      label: taskKind === "other" ? "完了" : "清掃完了",
      className: "bg-slate-200 text-slate-700",
    };
  }`, `  if (status === "check_completed") {
    return { label: "チェック完了", className: "bg-emerald-100 text-emerald-700" };
  }
  if (status === "completed") {
    return {
      label: taskKind === "other" ? "完了" : "清掃完了",
      className: "bg-slate-200 text-slate-700",
    };
  }`, "status label completed");

replaceOnce(`      label: taskKind === "other" ? "対応中" : "清掃中",`, `      label: taskKind === "other" ? "対応中" : taskKind === "check" ? "チェック中" : "清掃中",`, "status label progress");

replaceOnce(`  if (status === "completed") return "completed";`, `  if (status === "check_completed") return "check_completed";
  if (status === "completed") return "completed";`, "normalizeStatus");

replaceOnce(
`function denormalizeCleaningTaskStatus(status: string) {
  if (status === "completed") return "完了";
  if (status === "cancelled") return "CXL";
  if (status === "started") return "清掃開始";
  if (status === "in_progress") return "清掃中";
  return "未着手";
}`,
`function denormalizeCleaningTaskStatus(status: string, taskKind: EmployeeTask["taskKind"] = "cleaning") {
  if (status === "check_completed") return "チェック完了";
  if (status === "completed") return taskKind === "check" ? "清掃完了" : "完了";
  if (status === "cancelled") return "CXL";
  if (status === "started") return "清掃開始";
  if (status === "in_progress") return taskKind === "check" ? "チェック中" : "清掃中";
  return "未着手";
}`,
"denormalize"
);

fs.writeFileSync(file, src);
console.log("patched employee checklist UI");
