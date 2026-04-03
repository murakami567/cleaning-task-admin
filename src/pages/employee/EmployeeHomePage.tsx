import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type HomeSummary = {
  todayTaskCount: number;
  upcomingTaskCount: number;
  todayScheduleCount: number;
  unreadNoticeCount: number;
  assignedProperties: string[];
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
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">一般画面ホーム</h1>
            <p className="text-sm text-slate-500 mt-1">
              {user?.name ? `${user.name} さん` : "社員ユーザー"}でログイン中
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Link
            to="/employee/tasks"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="text-sm text-slate-500">メニュー</div>
            <div className="mt-2 text-base font-semibold text-slate-800">
              タスク一覧
            </div>
          </Link>

          <Link
            to="/employee/schedule"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="text-sm text-slate-500">メニュー</div>
            <div className="mt-2 text-base font-semibold text-slate-800">
              スケジュール
            </div>
          </Link>

          <Link
            to="/employee/worklog"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="text-sm text-slate-500">メニュー</div>
            <div className="mt-2 text-base font-semibold text-slate-800">
              実働記入
            </div>
          </Link>

          <Link
            to="/employee/settings"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="text-sm text-slate-500">メニュー</div>
            <div className="mt-2 text-base font-semibold text-slate-800">
              設定
            </div>
          </Link>
        </nav>

        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-sm text-slate-500">
            読み込み中...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <SummaryCard title="今日のタスク" value={summary.todayTaskCount} unit="件" />
              <SummaryCard title="今後のタスク" value={summary.upcomingTaskCount} unit="件" />
              <SummaryCard title="今日の予定" value={summary.todayScheduleCount} unit="件" />
              <SummaryCard title="未読のお知らせ" value={summary.unreadNoticeCount} unit="件" />
            </section>

            <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                担当物件
              </h2>

              {summary.assignedProperties.length === 0 ? (
                <p className="text-sm text-slate-500">担当物件はありません。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {summary.assignedProperties.map((property) => (
                    <span
                      key={property}
                      className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-sm text-slate-700"
                    >
                      {property}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  unit,
}: {
  title: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-3 text-3xl font-bold text-slate-800">
        {value}
        <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
