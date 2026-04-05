import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type EmployeeTask = {
  id: string;
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
};

type FilterType = "all" | "pending" | "in_progress" | "completed";

export default function EmployeeTasksPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await api.get("/api/employee/tasks");
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (error) {
      console.error("タスク取得エラー:", error);
      setErrorMessage("タスク一覧の取得に失敗しました。");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveTask(taskId: string, status: string, note: string) {
    try {
      setSaving(true);

      await api.post("/tasks/update", {
        task_id: taskId,
        status,
        note,
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status, note } : task
        )
      );

      setSelectedTask((prev) => (prev ? { ...prev, status, note } : prev));
    } catch (error) {
      console.error("タスク保存エラー:", error);
      alert(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const hitFilter =
        selectedFilter === "all" ? true : task.status === selectedFilter;

      const q = keyword.trim().toLowerCase();
      const hitKeyword =
        q === "" ||
        (task.title || "").toLowerCase().includes(q) ||
        (task.propertyName || "").toLowerCase().includes(q) ||
        (task.roomName || "").toLowerCase().includes(q) ||
        (task.note || "").toLowerCase().includes(q);

      return hitFilter && hitKeyword;
    });
  }, [tasks, selectedFilter, keyword]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">従業員ページ</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">タスク</h1>
            </div>

            <button
              onClick={fetchTasks}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              更新
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="物件名・部屋名・備考で検索"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4">
        <section className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={selectedFilter === "all"}
            onClick={() => setSelectedFilter("all")}
            label="すべて"
          />
          <FilterChip
            active={selectedFilter === "pending"}
            onClick={() => setSelectedFilter("pending")}
            label="未着手"
          />
          <FilterChip
            active={selectedFilter === "in_progress"}
            onClick={() => setSelectedFilter("in_progress")}
            label="清掃中"
          />
          <FilterChip
            active={selectedFilter === "completed"}
            onClick={() => setSelectedFilter("completed")}
            label="完了"
          />
        </section>

        <section className="space-y-3">
          {loading ? (
            <BlockMessage text="読み込み中..." />
          ) : errorMessage ? (
            <BlockMessage text={errorMessage} danger />
          ) : filteredTasks.length === 0 ? (
            <BlockMessage text="表示できるタスクはありません。" />
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={user?.name || ""}
                onClick={() => setSelectedTask(task)}
              />
            ))
          )}
        </section>
      </main>

      <BottomNav />

      {selectedTask ? (
        <TaskDetailModal
          task={selectedTask}
          defaultAssigneeName={user?.name || ""}
          saving={saving}
          onClose={() => setSelectedTask(null)}
          onSave={saveTask}
        />
      ) : null}
    </div>
  );
}

function TaskCard({
  task,
  assigneeName,
  onClick,
}: {
  task: EmployeeTask;
  assigneeName: string;
  onClick: () => void;
}) {
  const status = getStatusLabel(task.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
    >
      <div className="text-sm text-slate-500">{task.propertyName || "-"}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">
        {task.roomName || "-"}
      </div>
      <div className="mt-1 text-base font-semibold text-slate-800">
        {task.title || "清掃タスク"}
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <div>担当：{task.assigneeName || assigneeName || "-"}</div>
        <div>日付：{formatDate(task.date || task.dueDate)}</div>
        <div>期限：{formatDate(task.deadline || task.dueDate)}</div>
        <div>タオル：{task.towelCount ?? "-"}</div>
      </div>

      <div className="mt-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
          {status.label}
        </span>
      </div>
    </button>
  );
}

function TaskDetailModal({
  task,
  defaultAssigneeName,
  saving,
  onClose,
  onSave,
}: {
  task: EmployeeTask;
  defaultAssigneeName: string;
  saving: boolean;
  onClose: () => void;
  onSave: (taskId: string, status: string, note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(normalizeStatus(task.status));
  const [note, setNote] = useState(task.note || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-4 sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="text-xl font-bold text-slate-900">タスク詳細</div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-3">
            <InfoRow label="物件名" value={task.propertyName || "-"} />
            <InfoRow label="部屋名" value={task.roomName || "-"} />
            <InfoRow label="担当者" value={task.assigneeName || defaultAssigneeName || "-"} />
            <InfoRow label="チェッカー" value={task.checkerName || "-"} />
            <InfoRow label="日付" value={formatDate(task.date || task.dueDate)} />
            <InfoRow label="期限" value={formatDate(task.deadline || task.dueDate)} />

            <RateBox
              title="レイトCO / アーリーCI（部屋別）"
              rateCi={task.rateCi}
              rateCo={task.rateCo}
            />

            <InfoRow label="タオル数" value={String(task.towelCount ?? "-")} />

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">ステータス</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
              >
                <option value="pending">未着手</option>
                <option value="in_progress">清掃中</option>
                <option value="completed">完了</option>
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">備考</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="備考を入力"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </button>

            <button
              onClick={() => onSave(task.id, status, note)}
              disabled={saving}
              className="flex-1 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function RateBox({
  title,
  rateCi,
  rateCo,
}: {
  title: string;
  rateCi?: number | string;
  rateCo?: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">アーリーCI</span>
          <span className="font-bold text-slate-900">{formatMoney(rateCi)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">レイトCO</span>
          <span className="font-bold text-slate-900">{formatMoney(rateCo)}</span>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function BlockMessage({
  text,
  danger = false,
}: {
  text: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 text-sm shadow-sm ${
        danger
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      {text}
    </div>
  );
}

function BottomNav() {
  const location = useLocation();

  const items = [
    { to: "/employee/home", label: "ホーム" },
    { to: "/employee/tasks", label: "タスク" },
    { to: "/employee/schedule", label: "予定" },
    { to: "/employee/worklog", label: "実働" },
    { to: "/employee/settings", label: "設定" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-2 py-2">
        {items.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function getStatusLabel(status: string) {
  if (status === "completed") {
    return {
      label: "完了",
      className: "bg-emerald-50 text-emerald-700",
    };
  }
  if (status === "in_progress") {
    return {
      label: "清掃中",
      className: "bg-sky-50 text-sky-700",
    };
  }
  return {
    label: "未着手",
    className: "bg-slate-100 text-slate-700",
  };
}

function normalizeStatus(status: string) {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "pending";
}

function formatDate(value?: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMoney(value?: number | string) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "string" && value.startsWith("¥")) return value;

  const n = Number(value);
  if (Number.isNaN(n)) return String(value);

  return `¥${n.toLocaleString()}`;
}
