import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type HomeSummary = {
  todayTaskCount: number;
  upcomingTaskCount: number;
  todayScheduleCount: number;
  unreadNoticeCount: number;
  assignedProperties: string[];
  todayMessage: string;
};

export default function EmployeeHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<HomeSummary>({
  todayTaskCount: 0,
  upcomingTaskCount: 0,
  todayScheduleCount: 0,
  unreadNoticeCount: 0,
  assignedProperties: [],
  todayMessage: "",
});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeSummary();
  }, []);

  async function fetchHomeSummary() {
    try {
      setLoading(true);

      const data = await api.get("/api/employee/home");

      setSummary({
  todayTaskCount: data?.todayTaskCount ?? 0,
  upcomingTaskCount: data?.upcomingTaskCount ?? 0,
  todayScheduleCount: data?.todayScheduleCount ?? 0,
  unreadNoticeCount: data?.unreadNoticeCount ?? 0,
  assignedProperties: data?.assignedProperties ?? [],
  todayMessage: data?.todayMessage ?? "",
});
    } catch (error) {
      console.error("ホームデータ取得エラー:", error);
      setSummary({
        todayTaskCount: 0,
        upcomingTaskCount: 0,
        todayScheduleCount: 0,
        unreadNoticeCount: 0,
        assignedProperties: [],
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/employee/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500">一般画面</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">ホーム</h1>
              <p className="mt-1 text-sm text-slate-500">
                {user?.name ? `${user.name} さん` : "スタッフ"}でログイン中
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4">
        {loading ? (
          <LoadingBlock />
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3">
              <SummaryCard title="今日のタスク" value={summary.todayTaskCount} />
              <SummaryCard title="今後のタスク" value={summary.upcomingTaskCount} />
              <SummaryCard title="今日の予定" value={summary.todayScheduleCount} />
              <SummaryCard title="未読" value={summary.unreadNoticeCount} />
            </section>

            <section className="mt-5">
              <div className="mb-3 text-sm font-bold text-slate-700">メニュー</div>

              <div className="grid grid-cols-2 gap-3">
                <MenuCard
                  to="/employee/tasks"
                  title="タスク一覧"
                  subtitle="担当タスクを確認"
                />
                <MenuCard
                  to="/employee/schedule"
                  title="スケジュール"
                  subtitle="勤務予定を見る"
                />
                <MenuCard
                  to="/employee/worklog"
                  title="実働記入"
                  subtitle="作業時間を登録"
                />
                <MenuCard
                  to="/employee/settings"
                  title="設定"
                  subtitle="アカウント設定"
                />
              </div>
            </section>

            <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800">担当物件</div>

              {summary.assignedProperties.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  担当物件はありません。
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.assignedProperties.map((property) => (
                    <span
                      key={property}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      {property}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-800">今日のひとこと</div>
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {summary.todayMessage || "本日の連絡事項はありません。"}
              </div>
            </section>
          </>
        )}
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

function MenuCard({
  to,
  title,
  subtitle,
}: {
  to: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
    >
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
    </Link>
  );
}

function LoadingBlock() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      読み込み中...
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
