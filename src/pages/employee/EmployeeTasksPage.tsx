import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api";

type EmployeeTask = {
  id: string;
  title: string;
  propertyName: string;
  roomName: string;
  dueDate: string;
  status: string;
  note?: string;
};

type FilterType = "all" | "pending" | "in_progress" | "completed";

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter((x) => x.status === "pending").length,
      in_progress: tasks.filter((x) => x.status === "in_progress").length,
      completed: tasks.filter((x) => x.status === "completed").length,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">一般画面</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">タスク一覧</h1>
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
              placeholder="物件名・部屋名・メモで検索"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-slate-300"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4">
        <section className="grid grid-cols-2 gap-3">
          <SummaryCard title="全タスク" value={counts.all} />
          <SummaryCard title="未着手" value={counts.pending} />
          <SummaryCard title="対応中" value={counts.in_progress} />
          <SummaryCard title="完了" value={counts.completed} />
        </section>

        <section className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={selectedFilter === "all"}
            onClick={() => setSelectedFilter("all")}
            label={`すべて (${counts.all})`}
          />
          <FilterChip
            active={selectedFilter === "pending"}
            onClick={() => setSelectedFilter("pending")}
            label={`未着手 (${counts.pending})`}
          />
          <FilterChip
            active={selectedFilter === "in_progress"}
            onClick={() => setSelectedFilter("in_progress")}
            label={`対応中 (${counts.in_progress})`}
          />
          <FilterChip
            active={selectedFilter === "completed"}
            onClick={() => setSelectedFilter("completed")}
            label={`完了 (${counts.completed})`}
          />
        </section>

        <section className="mt-5 space-y-3">
          {loading ? (
            <LoadingBlock />
          ) : errorMessage ? (
            <ErrorBlock message={errorMessage} />
          ) : filteredTasks.length === 0 ? (
            <EmptyBlock />
          ) : (
            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
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

function TaskCard({ task }: { task: EmployeeTask }) {
  const status = getStatusView(task.status);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">担当タスク</div>
          <h2 className="mt-1 text-base font-bold text-slate-900 break-words">
            {task.propertyName || "物件未設定"}
            {task.roomName ? ` / ${task.roomName}` : ""}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${status.badgeClass}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-800">
          {task.title || "清掃タスク"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          期限: {formatDate(task.dueDate)}
        </div>
      </div>

      {task.note ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-medium text-slate-500">メモ</div>
          <div className="mt-1 text-sm text-slate-700 break-words">{task.note}</div>
        </div>
      ) : null}

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${status.barClass}`} />
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      読み込み中...
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-600 shadow-sm">
      {message}
    </div>
  );
}

function EmptyBlock() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="text-sm font-semibold text-slate-700">表示できるタスクはありません</div>
      <div className="mt-1 text-xs text-slate-500">
        条件を変更するか、更新ボタンを押してください
      </div>
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

function getStatusView(status: string) {
  if (status === "completed") {
    return {
      label: "完了",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      barClass: "w-full bg-emerald-500",
    };
  }

  if (status === "in_progress") {
    return {
      label: "対応中",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      barClass: "w-2/3 bg-amber-500",
    };
  }

  return {
    label: "未着手",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    barClass: "w-1/3 bg-slate-400",
  };
}

function formatDate(value: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return `${d.getMonth() + 1}/${d.getDate()}`;
}
