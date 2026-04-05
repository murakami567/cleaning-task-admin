import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api";

type EmployeeSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  propertyName: string;
  roomName?: string;
  title: string;
  status?: string;
  note?: string;
};

export default function EmployeeSchedulePage() {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await api.get("/api/employee/schedule");
      setSchedules(Array.isArray(data?.schedules) ? data.schedules : []);
    } catch (error) {
      console.error("スケジュール取得エラー:", error);
      setErrorMessage("スケジュールの取得に失敗しました。");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((item) => (dateFilter ? item.date === dateFilter : true))
      .sort((a, b) => {
        const aKey = `${a.date || ""} ${a.startTime || ""}`;
        const bKey = `${b.date || ""} ${b.startTime || ""}`;
        return aKey.localeCompare(bKey);
      });
  }, [schedules, dateFilter]);

  const groupedSchedules = useMemo(() => {
    const map = new Map<string, EmployeeSchedule[]>();

    filteredSchedules.forEach((item) => {
      const key = item.date || "日付未設定";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    return Array.from(map.entries());
  }, [filteredSchedules]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">一般画面</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">スケジュール</h1>
            </div>

            <button
              onClick={fetchSchedules}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              更新
            </button>
          </div>

          <div className="mt-4">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-300"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4">
        {loading ? (
          <LoadingBlock />
        ) : errorMessage ? (
          <ErrorBlock message={errorMessage} />
        ) : groupedSchedules.length === 0 ? (
          <EmptyBlock />
        ) : (
          <div className="space-y-4">
            {groupedSchedules.map(([date, items]) => (
              <section key={date}>
                <div className="mb-2 px-1 text-sm font-bold text-slate-700">
                  {formatDate(date)}
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function ScheduleCard({ item }: { item: EmployeeSchedule }) {
  const status = getStatusView(item.status || "scheduled");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500">予定</div>
          <div className="mt-1 text-base font-bold text-slate-900 break-words">
            {item.title || "勤務予定"}
          </div>
          <div className="mt-1 text-sm text-slate-500 break-words">
            {item.propertyName || "未設定"}
            {item.roomName ? ` / ${item.roomName}` : ""}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${status.badgeClass}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoCard label="開始" value={item.startTime || "--:--"} />
        <InfoCard label="終了" value={item.endTime || "--:--"} />
      </div>

      {item.note ? (
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500">備考</div>
          <div className="mt-1 text-sm text-slate-700 break-words">{item.note}</div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
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
      <div className="text-sm font-semibold text-slate-700">表示できる予定はありません</div>
      <div className="mt-1 text-xs text-slate-500">
        日付を変更するか、更新ボタンを押してください
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
    };
  }

  if (status === "in_progress") {
    return {
      label: "進行中",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "予定",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

function formatDate(value: string) {
  if (!value) return "日付未設定";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return `${d.getMonth() + 1}/${d.getDate()}`;
}
