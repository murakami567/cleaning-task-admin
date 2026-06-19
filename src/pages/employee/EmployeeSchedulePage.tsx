import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type CalendarDay = {
  date: string;
  cleaningCount: number;
  inspectionCount: number;
  propertyCounts: Record<string, number>;
  totalCount: number;
};

type CalendarResponse = {
  month: string;
  days: CalendarDay[];
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMonthKey(year: number, month: number) {
  return `${year}-${pad2(month)}`;
}

function buildCalendarCells(year: number, month: number) {
  const firstDate = new Date(year, month - 1, 1);
  const startWeekday = firstDate.getDay();
  const lastDate = new Date(year, month, 0).getDate();

  const cells: Array<{
    date: string;
    day: number;
    inMonth: boolean;
  }> = [];

  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month - 1, 1 - (startWeekday - i));
    cells.push({
      date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
      day: d.getDate(),
      inMonth: false,
    });
  }

  for (let day = 1; day <= lastDate; day++) {
    cells.push({
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      day,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const offset = cells.length - (startWeekday + lastDate) + 1;
    const d = new Date(year, month, offset);
    cells.push({
      date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
      day: d.getDate(),
      inMonth: false,
    });
  }

  return cells;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const week = WEEK_LABELS[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${week})`;
}

export default function EmployeeSchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const monthKey = useMemo(() => formatMonthKey(year, month), [year, month]);
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    calendarDays.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [calendarDays]);

  async function fetchCalendar() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("employee_access_token") || "";

      const res = await fetch(`${API_BASE}/api/employee/schedule-calendar?month=${monthKey}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`schedule-calendar failed: ${res.status} / ${text}`);
      }

      const data: CalendarResponse = JSON.parse(text);
      setCalendarDays(Array.isArray(data?.days) ? data.days : []);
    } catch (e) {
      console.error(e);
      setError("スケジュールの取得に失敗しました。");
      setCalendarDays([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCalendar();
  }, [monthKey]);

  function moveMonth(diff: number) {
    const next = new Date(year, month - 1 + diff, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  }

  function openDayDetail(dateStr: string) {
    const day = dayMap.get(dateStr);
    if (!day || day.totalCount <= 0) return;
    setSelectedDay(day);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto box-border w-full max-w-4xl px-4 pt-5 pb-4">
          <div>
            <div className="text-xs font-medium text-slate-500">一般画面</div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">スケジュール</h1>
            <p className="mt-2 text-sm text-slate-500">
              カレンダーで割り当てられている物件と件数（清掃＋インスペクション）を表示
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto box-border w-full max-w-4xl px-3 pt-4 sm:px-4 sm:pt-6">
        <section className="box-border w-full max-w-full rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
            >
              前月
            </button>

            <div className="text-base font-bold text-slate-900 sm:text-xl">
              {year}年 {month}月
            </div>

            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
            >
              次月
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEK_LABELS.map((label) => (
              <div
                key={label}
                className="px-1 py-2 text-center text-xs font-semibold text-slate-500 sm:px-2 sm:text-sm"
              >
                {label}
              </div>
            ))}

            {cells.map((cell) => {
              const info = dayMap.get(cell.date);
              const totalCount = info?.totalCount ?? 0;
              const cleaningCount = info?.cleaningCount ?? 0;
              const inspectionCount = info?.inspectionCount ?? 0;
              const clickable = totalCount > 0;

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => openDayDetail(cell.date)}
                  disabled={!clickable}
                  className={[
                    "relative flex h-[74px] min-w-0 flex-col overflow-hidden rounded-2xl border p-1.5 text-center transition sm:h-[88px] sm:rounded-3xl sm:p-3 sm:text-left",
                    cell.inMonth
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50 text-slate-300",
                    clickable
                      ? "cursor-pointer hover:border-indigo-400 hover:shadow-sm"
                      : "cursor-default",
                    selectedDay?.date === cell.date ? "border-indigo-500 ring-2 ring-indigo-200" : "",
                  ].join(" ")}
                >
                  <div className="min-w-0 text-sm font-bold leading-none sm:text-base sm:font-semibold">
                    {cell.day}
                  </div>

                  {clickable ? (
                    <>
                      <div className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-bold leading-none text-slate-500 sm:right-3 sm:top-3 sm:h-6 sm:min-w-[24px] sm:px-2 sm:text-xs">
                        {totalCount}
                      </div>

                      <div className="mt-auto min-w-0 truncate text-[10px] font-bold leading-tight text-slate-700 sm:mt-4 sm:text-sm sm:font-normal">
                        清{cleaningCount}/検{inspectionCount}
                      </div>
                    </>
                  ) : (
                    <div className="mt-auto min-w-0 truncate text-xs leading-none text-slate-300 sm:mt-4 sm:text-sm">—</div>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              読み込み中...
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>
      </main>

      {selectedDay ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDay(null);
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-xl font-bold text-slate-900">
                日別内訳：{formatDateLabel(selectedDay.date)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-lg font-bold text-slate-900">件数</div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm text-slate-500">清掃</div>
                    <div className="mt-2 text-4xl font-black text-slate-900">
                      {selectedDay.cleaningCount}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-sm text-slate-500">インスペクション</div>
                    <div className="mt-2 text-4xl font-black text-slate-900">
                      {selectedDay.inspectionCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-lg font-bold text-slate-900">物件別</div>

                <div className="space-y-3">
                  {Object.entries(selectedDay.propertyCounts || {}).length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                      物件データがありません。
                    </div>
                  ) : (
                    Object.entries(selectedDay.propertyCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([propertyName, count]) => (
                        <div
                          key={propertyName}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
                        >
                          <div className="text-lg font-semibold text-slate-900">
                            {propertyName}
                          </div>
                          <div className="text-2xl font-black text-slate-900">{count}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
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
