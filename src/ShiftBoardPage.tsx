import React, { useEffect, useMemo, useState } from "react";
import AccountManagementPage from "./AccountManagementPage";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Staff = {
  id: string;
  staff_code: string | null;
  staff_name: string;
  role: string | null;
  is_active: boolean;
  sort_order: number | null;
};

type ShiftEntry = {
  id?: string;
  shift_day_id: string;
  staff_id: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  assigned_area: string | null;
  note: string | null;
};

type ShiftDay = {
  id: string;
  shift_date: string;
  note: string | null;
  shift_entries: ShiftEntry[];
};

type ShiftMark = "出勤" | "定休" | "休み" | "欠勤" | "遅刻";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateLabel(iso: string) {
  const dt = new Date(iso);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function weekdayLabel(iso: string) {
  const dt = new Date(iso);
  return WEEKDAYS[dt.getDay()];
}

function addDays(iso: string, diff: number) {
  const dt = new Date(iso);
  dt.setDate(dt.getDate() + diff);
  return formatIsoDate(dt);
}

function startOfWeek(iso: string) {
  const dt = new Date(iso);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day);
  return formatIsoDate(dt);
}

function endOfWeek(iso: string) {
  return addDays(startOfWeek(iso), 6);
}

function buildMonthDates(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => {
    const day = i + 1;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  });
}

function buildWeekDates(baseIso: string) {
  const start = startOfWeek(baseIso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-bold border transition ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function SmallToggle({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold border transition ${
        active
          ? "bg-black text-white border-black"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function markClass(value: ShiftMark) {
  if (value === "出勤") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "定休") return "bg-blue-50 text-blue-600 border-blue-200";
  if (value === "休み") return "bg-slate-100 text-slate-500 border-slate-200";
  if (value === "欠勤") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

const SHIFT_OPTIONS: { value: ShiftMark; label: string }[] = [
  { value: "出勤", label: "出勤" },
  { value: "定休", label: "定休" },
  { value: "休み", label: "休み" },
  { value: "欠勤", label: "欠勤" },
  { value: "遅刻", label: "遅刻" },
];

export default function ShiftBoardPage() {
  const today = new Date();
  const todayIso = formatIsoDate(today);

  const [mainTab, setMainTab] = useState<"shift" | "account" | "mate">("shift");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [weekBaseDate, setWeekBaseDate] = useState(todayIso);

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [days, setDays] = useState<ShiftDay[]>([]);
  const [cleanCounts, setCleanCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");

  const loadBoard = async (targetYear = year, targetMonth = month) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/shift-board?year=${targetYear}&month=${targetMonth}`);
      if (!res.ok) throw new Error(`shift-board failed: ${res.status}`);

      const data = await res.json();

      setStaffs(Array.isArray(data.staffs) ? data.staffs : []);
      setDays(Array.isArray(data.days) ? data.days : []);
      setCleanCounts(data.cleaning_counts || {});
    } catch (e) {
      console.error(e);
      alert("シフト表の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoard(year, month);
  }, [year, month]);

  useEffect(() => {
    setWeekBaseDate(`${year}-${pad2(month)}-01`);
  }, [year, month]);

  const allDates = useMemo(() => buildMonthDates(year, month), [year, month]);
  const weekDates = useMemo(() => buildWeekDates(weekBaseDate), [weekBaseDate]);
  const visibleDates = viewMode === "month" ? allDates : weekDates;

  const dayMap = useMemo(() => {
    const map = new Map<string, ShiftDay>();

    (Array.isArray(days) ? days : []).forEach((d) => {
      map.set(d.shift_date, {
        ...d,
        shift_entries: Array.isArray(d.shift_entries) ? d.shift_entries : [],
      });
    });

    return map;
  }, [days]);

  const getShiftMark = (date: string, staffId: string): ShiftMark => {
    const day = dayMap.get(date);

    if (!day) return "休み";

    const entries = Array.isArray(day.shift_entries) ? day.shift_entries : [];
    const entry = entries.find((x) => x.staff_id === staffId);
    const status = entry?.status as ShiftMark | undefined;

    return status || "休み";
  };

  const getCleanCount = (date: string) => {
    return cleanCounts?.[date] || 0;
  };

  const getOrCreateDay = async (date: string) => {
    const existing = dayMap.get(date);
    if (existing) return existing;

    const dayRes = await fetch(`${API_BASE}/shifts/get_or_create_day`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_date: date, note: "" }),
    });

    if (!dayRes.ok) throw new Error(`get_or_create_day failed: ${dayRes.status}`);
    return await dayRes.json();
  };

  const saveCell = async (date: string, staffId: string, nextStatus: ShiftMark) => {
    try {
      const key = `${date}-${staffId}`;
      setSavingKey(key);

      const day = await getOrCreateDay(date);

      const isOff = nextStatus === "休み" || nextStatus === "定休" || nextStatus === "欠勤";

      const saveRes = await fetch(`${API_BASE}/shifts/upsert_entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_day_id: day.id,
          staff_id: staffId,
          status: nextStatus,
          start_time: isOff ? null : "09:00",
          end_time: isOff ? null : "18:00",
          assigned_area: "",
          note: "",
        }),
      });

      if (!saveRes.ok) throw new Error(`upsert_entry failed: ${saveRes.status}`);

      await loadBoard(year, month);
    } catch (e) {
      console.error(e);
      alert("シフト保存に失敗しました。");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1150px] space-y-4">
        <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="text-[18px] font-extrabold">管理ページ | シフト</div>
              <div className="mt-1 text-sm text-slate-500">
                3タブ構成（シフト / アカウント管理 / メイトカルテ）
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <TabButton active={mainTab === "shift"} onClick={() => setMainTab("shift")}>
                  シフト
                </TabButton>
                <TabButton active={mainTab === "account"} onClick={() => setMainTab("account")}>
                  アカウント管理
                </TabButton>
                <TabButton active={mainTab === "mate"} onClick={() => setMainTab("mate")}>
                  メイトカルテ
                </TabButton>
              </div>
            </div>

            <div className="pt-2 text-sm text-slate-500">
              {loading ? "Loading..." : "DB Connected"}
            </div>
          </div>
        </div>

        {mainTab === "shift" && (
          <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
              <div>
                <div className="text-[18px] font-extrabold">シフト</div>
                <div className="mt-1 text-sm text-slate-500">
                  プルダウンで 出勤 / 定休 / 休み / 欠勤 / 遅刻 を選択して保存
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>

                {viewMode === "week" && (
                  <>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white hover:bg-slate-50"
                      onClick={() => setWeekBaseDate((prev) => addDays(prev, -7))}
                    >
                      前週
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white hover:bg-slate-50"
                      onClick={() => setWeekBaseDate((prev) => addDays(prev, 7))}
                    >
                      次週
                    </button>
                  </>
                )}

                <div className="rounded-2xl border border-slate-200 p-1 flex gap-1">
                  <SmallToggle active={viewMode === "month"} onClick={() => setViewMode("month")}>
                    月
                  </SmallToggle>
                  <SmallToggle active={viewMode === "week"} onClick={() => setViewMode("week")}>
                    週
                  </SmallToggle>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 text-[16px] font-extrabold">
                {year}年{month}月
              </div>

              {viewMode === "week" && weekDates.length > 0 && (
                <div className="mb-3 text-sm text-slate-500">
                  {startOfWeek(weekBaseDate)} ～ {endOfWeek(weekBaseDate)}
                </div>
              )}

              <div className="overflow-auto rounded-[18px] border border-slate-200">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-extrabold">日付</th>
                      <th className="px-4 py-3 text-left font-extrabold">曜日</th>
                      <th className="px-4 py-3 text-left font-extrabold">総清掃数</th>
                      {staffs.map((staff) => (
                        <th key={staff.id} className="px-4 py-3 text-left font-extrabold">
                          {staff.staff_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDates.map((date) => (
                      <tr key={date} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3">{formatDateLabel(date)}</td>
                        <td className="px-4 py-3">{weekdayLabel(date)}</td>
                        <td className="px-4 py-3">{getCleanCount(date)}</td>

                        {staffs.map((staff) => {
                          const current = getShiftMark(date, staff.id);
                          const key = `${date}-${staff.id}`;
                          const saving = savingKey === key;

                          return (
                            <td key={staff.id} className="px-4 py-3">
                              <select
                                value={current}
                                disabled={saving}
                                onChange={(e) => void saveCell(date, staff.id, e.target.value as ShiftMark)}
                                className={`h-10 min-w-[96px] rounded-xl border px-3 text-sm font-medium outline-none bg-white ${markClass(
                                  current
                                )} ${saving ? "opacity-50" : ""}`}
                              >
                                {SHIFT_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {saving && opt.value === current ? "保存中..." : opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {mainTab === "account" && <AccountManagementPage />}

        {mainTab === "mate" && (
          <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm p-6">
            <div className="text-[18px] font-extrabold">メイトカルテ</div>
            <div className="mt-2 text-sm text-slate-500">次段階で追加します。</div>
          </div>
        )}
      </div>
    </div>
  );
}
