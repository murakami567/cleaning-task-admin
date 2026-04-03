import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      const matchesKeyword =
        keyword.trim() === "" ||
        task.title?.toLowerCase().includes(keyword.toLowerCase()) ||
        task.propertyName?.toLowerCase().includes(keyword.toLowerCase()) ||
        task.roomName?.toLowerCase().includes(keyword.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : task.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [tasks, keyword, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">タスク一覧</h1>
            <p className="text-sm text-slate-500 mt-1">
              社員向けの担当タスク一覧です
            </p>
          </div>

          <Link
            to="/employee/home"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            ホームへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="タスク名・物件名・部屋名で検索"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="all">すべて</option>
                <option value="pending">未着手</option>
                <option value="in_progress">対応中</option>
                <option value="completed">完了</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchTasks}
                className="w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800"
              >
                再読み込み
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-sm text-slate-500">
            読み込み中...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-sm text-sm text-red-600">
            {errorMessage}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-sm text-slate-500">
            表示できるタスクはありません。
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TaskCard({ task }: { task: EmployeeTask }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{task.title}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {task.propertyName} / {task.roomName}
          </p>
        </div>

        <StatusBadge status={task.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <InfoItem label="期限" value={task.dueDate || "-"} />
        <InfoItem label="部屋" value={task.roomName || "-"} />
      </div>

      {task.note ? (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
          {task.note}
        </div>
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "completed"
      ? "完了"
      : status === "in_progress"
      ? "対応中"
      : "未着手";

  const className =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "in_progress"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
