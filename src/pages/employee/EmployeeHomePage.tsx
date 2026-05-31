import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const BREAK_TOGGLE_ROLES = new Set(["admin", "sub_admin", "leader"]);

type TodayMessage = {
  id: string;
  message: string;
  target_date: string;
  updated_at?: string;
};

type HomeSummary = {
  todayTaskCount: number;
  upcomingTaskCount: number;
  todayScheduleCount: number;
  unreadNoticeCount: number;
  assignedProperties: string[];
  todayMessages: TodayMessage[];
};

export default function EmployeeHomePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();

  const canToggleBreak = useMemo(
    () => !!user?.role && BREAK_TOGGLE_ROLES.has(user.role),
    [user?.role]
  );

  const [breakSaving, setBreakSaving] = useState(false);
  const [breakElapsedMin, setBreakElapsedMin] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.on_break || !user?.break_started_at) {
      setBreakElapsedMin(null);
      return;
    }

    const tick = () => {
      const start = new Date(user.break_started_at as string).getTime();
      if (Number.isNaN(start)) {
        setBreakElapsedMin(null);
        return;
      }
      setBreakElapsedMin(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [user?.on_break, user?.break_started_at]);

  async function handleToggleBreak() {
    if (breakSaving) return;
    try {
      setBreakSaving(true);
      const data = await api.post("/api/employee/break/toggle", {});
      setUser({
        ...(user ?? {}),
        on_break: !!data?.on_break,
        break_started_at: data?.break_started_at ?? null,
      });
    } catch (error) {
      console.error("休憩切替エラー:", error);
      alert(error instanceof Error ? error.message : "休憩の切替に失敗しました。");
    } finally {
      setBreakSaving(false);
    }
  }

  const [summary, setSummary] = useState<HomeSummary>({
  todayTaskCount: 0,
  upcomingTaskCount: 0,
  todayScheduleCount: 0,
  unreadNoticeCount: 0,
  assignedProperties: [],
  todayMessages: [],
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
  todayMessages: data?.todayMessages ?? [],
});
    } catch (error) {
      console.error("ホームデータ取得エラー:", error);
      setSummary({
        todayTaskCount: 0,
        upcomingTaskCount: 0,
        todayScheduleCount: 0,
        unreadNoticeCount: 0,
        assignedProperties: [],
        todayMessage: "",
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
            {canToggleBreak ? (
              <section
                className={`mb-4 rounded-3xl border p-4 shadow-sm transition ${
                  user?.on_break
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500">勤務状況</div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                      {user?.on_break ? "休憩中" : "勤務中"}
                    </div>
                    {user?.on_break && breakElapsedMin !== null ? (
                      <div className="mt-1 text-xs text-amber-700">
                        休憩開始から {breakElapsedMin} 分経過
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleBreak}
                    disabled={breakSaving}
                    className={`shrink-0 rounded-2xl px-5 py-3 text-sm font-bold transition disabled:opacity-50 ${
                      user?.on_break
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                  >
                    {breakSaving
                      ? "切替中..."
                      : user?.on_break
                      ? "休憩終了"
                      : "休憩開始"}
                  </button>
                </div>
              </section>
            ) : null}

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
  <div className="text-sm font-bold text-slate-800">連絡事項</div>

  {summary.todayMessages.length === 0 ? (
    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
      本日の連絡事項はありません。
    </div>
  ) : (
    <div className="mt-3 space-y-3">
      {summary.todayMessages.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 whitespace-pre-wrap"
        >
          {item.message}
        </div>
      ))}
    </div>
  )}
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
