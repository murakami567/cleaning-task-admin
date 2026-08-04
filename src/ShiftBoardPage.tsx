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

type ShiftMark = "出勤" | "定休" | "休み" | "有給" | "欠勤" | "遅刻";
type MainTab = "shift" | "account" | "mate";
type ViewMode = "month" | "week";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const SHIFT_OPTIONS: { value: ShiftMark; label: string }[] = [
  { value: "出勤", label: "出勤" },
  { value: "定休", label: "定休" },
  { value: "休み", label: "休み" },
  { value: "有給", label: "有給" },
  { value: "欠勤", label: "欠勤" },
  { value: "遅刻", label: "遅刻" },
];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateLabel(iso: string) {
  const date = parseIsoDate(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function weekdayLabel(iso: string) {
  return WEEKDAYS[parseIsoDate(iso).getDay()];
}

function addDays(iso: string, diff: number) {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + diff);
  return formatIsoDate(date);
}

function startOfWeek(iso: string) {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() - date.getDay());
  return formatIsoDate(date);
}

function endOfWeek(iso: string) {
  return addDays(startOfWeek(iso), 6);
}

function buildMonthDates(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) =>
    `${year}-${pad2(month)}-${pad2(index + 1)}`
  );
}

function buildWeekDates(baseIso: string) {
  const start = startOfWeek(baseIso);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function authHeaders(contentType = true) {
  const token = localStorage.getItem("admin_access_token") || "";
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function markClass(value: ShiftMark) {
  if (value === "出勤") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "定休") return "border-blue-200 bg-blue-50 text-blue-700";
  if (value === "休み") return "border-slate-200 bg-slate-100 text-slate-600";
  if (value === "有給") return "border-violet-200 bg-violet-50 text-violet-700";
  if (value === "欠勤") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function workloadLabel(cleanCount: number, attendanceCount: number) {
  if (attendanceCount <= 0) return cleanCount > 0 ? "要員不足" : "-";
  return (cleanCount / attendanceCount).toFixed(1);
}

export default function ShiftBoardPage() {
  const now = new Date();
  const todayIso = formatIsoDate(now);

  const [mainTab, setMainTab] = useState<MainTab>("shift");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [weekBaseDate, setWeekBaseDate] = useState(todayIso);

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [days, setDays] = useState<ShiftDay[]>([]);
  const [cleanCounts, setCleanCounts] = useState<Record<string, number>>({});
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [workloadMap, setWorkloadMap] = useState<Record<string, number>>({});

  const [staffSearch, setStaffSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [jinjerSyncing, setJinjerSyncing] = useState(false);
  const [shiftUploadFile, setShiftUploadFile] = useState<File | null>(null);
  const [shiftUploading, setShiftUploading] = useState(false);

  const allDates = useMemo(() => buildMonthDates(year, month), [year, month]);
  const weekDates = useMemo(() => buildWeekDates(weekBaseDate), [weekBaseDate]);
  const visibleDates = viewMode === "month" ? allDates : weekDates;

  const filteredStaffs = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();
    return [...staffs]
      .filter((staff) => !activeOnly || staff.is_active)
      .filter((staff) => {
        if (!query) return true;
        return `${staff.staff_name} ${staff.staff_code || ""}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const order = (a.sort_order ?? 999) - (b.sort_order ?? 999);
        return order !== 0 ? order : a.staff_name.localeCompare(b.staff_name, "ja");
      });
  }, [staffs, staffSearch, activeOnly]);

  const dayMap = useMemo(() => {
    const map = new Map<string, ShiftDay>();
    days.forEach((day) => {
      map.set(day.shift_date, {
        ...day,
        shift_entries: Array.isArray(day.shift_entries) ? day.shift_entries : [],
      });
    });
    return map;
  }, [days]);

  const getShiftMark = (date: string, staffId: string): ShiftMark => {
    const entry = dayMap.get(date)?.shift_entries.find((item) => item.staff_id === staffId);
    const status = entry?.status as ShiftMark | undefined;
    return SHIFT_OPTIONS.some((option) => option.value === status) ? status! : "休み";
  };

  const getCleanCount = (date: string) => Number(cleanCounts[date] || 0);
  const getAttendanceCount = (date: string) => Number(attendanceCounts[date] || 0);
  const getWorkload = (date: string) => {
    const value = workloadMap[date];
    if (value !== undefined && value !== null) return value;
    return workloadLabel(getCleanCount(date), getAttendanceCount(date));
  };

  const loadBoard = async (targetYear = year, targetMonth = month) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${API_BASE}/shift-board?year=${targetYear}&month=${targetMonth}`,
        { headers: authHeaders(false) }
      );
      if (!response.ok) throw new Error(`shift-board failed: ${response.status}`);
      const data = await response.json();
      setStaffs(Array.isArray(data.staffs) ? data.staffs : []);
      setDays(Array.isArray(data.days) ? data.days : []);
      setCleanCounts(data.cleaning_counts || {});
      setAttendanceCounts(data.attendance_counts || {});
      setWorkloadMap(data.workload || {});
    } catch (loadError) {
      console.error(loadError);
      setError("シフト表の取得に失敗しました。時間をおいて再読み込みしてください。");
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

  const getOrCreateDay = async (date: string) => {
    const existing = dayMap.get(date);
    if (existing) return existing;

    const response = await fetch(`${API_BASE}/shifts/get_or_create_day`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ shift_date: date, note: "" }),
    });
    if (!response.ok) throw new Error(`get_or_create_day failed: ${response.status}`);
    return (await response.json()) as ShiftDay;
  };

  const saveCell = async (date: string, staffId: string, nextStatus: ShiftMark) => {
    const key = `${date}-${staffId}`;
    if (savingKey) return;

    try {
      setSavingKey(key);
      setError("");
      const day = await getOrCreateDay(date);
      const isOff = ["休み", "定休", "有給", "欠勤"].includes(nextStatus);
      const response = await fetch(`${API_BASE}/shifts/upsert_entry`, {
        method: "POST",
        headers: authHeaders(),
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
      if (!response.ok) throw new Error(`upsert_entry failed: ${response.status}`);
      await loadBoard(year, month);
    } catch (saveError) {
      console.error(saveError);
      setError("シフト保存に失敗しました。再度お試しください。");
    } finally {
      setSavingKey("");
    }
  };

  const syncJinjer = async () => {
    if (jinjerSyncing) return;
    if (!window.confirm(`${year}年${month}月のシフトをJinjerから取り込みます。`)) return;

    try {
      setJinjerSyncing(true);
      setError("");
      const response = await fetch(`${API_BASE}/jinjer/shifts/sync`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ month: `${year}-${pad2(month)}` }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.detail || `${response.status}`);

      const skipped = Array.isArray(body?.skipped_no_staff) ? body.skipped_no_staff : [];
      const errors = Array.isArray(body?.errors) ? body.errors : [];
      window.alert(
        [
          "Jinjer同期 完了",
          `取得: ${body.fetched ?? 0}件`,
          `保存: ${body.saved ?? 0}件`,
          skipped.length ? `未マッチ: ${skipped.length}件` : "",
          errors.length ? `エラー: ${errors.length}件` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
      await loadBoard(year, month);
    } catch (syncError: any) {
      console.error(syncError);
      setError(`Jinjer同期に失敗しました: ${syncError?.message || "不明なエラー"}`);
    } finally {
      setJinjerSyncing(false);
    }
  };

  const uploadShiftFile = async () => {
    if (!shiftUploadFile || shiftUploading) return;
    if (!window.confirm(`${year}年${month}月のシフトをファイルから取り込みます。`)) return;

    try {
      setShiftUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", shiftUploadFile);
      formData.append("month", `${year}-${pad2(month)}`);
      const response = await fetch(`${API_BASE}/jinjer/shifts/upload`, {
        method: "POST",
        headers: authHeaders(false),
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.detail || `${response.status}`);

      window.alert(
        [
          "シフト取込 完了",
          `対象月: ${body.month || `${year}-${pad2(month)}`}`,
          `読取: ${body.fetched ?? 0}件`,
          `保存: ${body.saved ?? 0}件`,
          body.status_counts
            ? `内訳: 出勤 ${body.status_counts["出勤"] ?? 0} / 休み ${body.status_counts["休み"] ?? 0} / 定休 ${body.status_counts["定休"] ?? 0} / 有給 ${body.status_counts["有給"] ?? 0}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
      setShiftUploadFile(null);
      await loadBoard(year, month);
    } catch (uploadError: any) {
      console.error(uploadError);
      setError(`シフト取込に失敗しました: ${uploadError?.message || "不明なエラー"}`);
    } finally {
      setShiftUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 lg:px-6">
      <div className="w-full space-y-4">
        <section className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-start">
            <div>
              <div className="text-[18px] font-extrabold">管理ページ｜シフト</div>
              <div className="mt-1 text-sm text-slate-500">
                シフト・アカウント・メイト情報をまとめて管理
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
            <div className="text-sm font-semibold text-slate-500">
              {loading ? "読み込み中" : error ? "接続エラー" : "DB接続済み"}
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              type="button"
              className="rounded-xl border border-rose-200 bg-white px-3 py-2 font-bold"
              onClick={() => void loadBoard(year, month)}
            >
              再読み込み
            </button>
          </div>
        ) : null}

        {mainTab === "shift" ? (
          <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="text-[18px] font-extrabold">シフトボード</div>
                  <div className="mt-1 text-sm text-slate-500">
                    清掃件数・出勤人数・1人当たり清掃数を日別に確認
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="年"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                  >
                    {Array.from({ length: 5 }, (_, index) => now.getFullYear() - 2 + index).map((item) => (
                      <option key={item} value={item}>{item}年</option>
                    ))}
                  </select>
                  <select
                    aria-label="月"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
                      <option key={item} value={item}>{item}月</option>
                    ))}
                  </select>
                  <div className="flex gap-1 rounded-2xl border border-slate-200 p-1">
                    <SmallToggle active={viewMode === "month"} onClick={() => setViewMode("month")}>月</SmallToggle>
                    <SmallToggle active={viewMode === "week"} onClick={() => setViewMode("week")}>週</SmallToggle>
                  </div>
                  {viewMode === "week" ? (
                    <>
                      <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setWeekBaseDate((prev) => addDays(prev, -7))}>前週</button>
                      <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setWeekBaseDate((prev) => addDays(prev, 7))}>次週</button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto]">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={staffSearch}
                    onChange={(event) => setStaffSearch(event.target.value)}
                    placeholder="スタッフ名・社員番号で検索"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 sm:min-w-[240px]"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveOnly((prev) => !prev)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                      activeOnly ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {activeOnly ? "有効のみ" : "全員表示"}
                  </button>
                  <span className="self-center text-xs text-slate-500">{filteredStaffs.length}名表示</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={jinjerSyncing}
                    onClick={() => void syncJinjer()}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 disabled:opacity-50"
                  >
                    {jinjerSyncing ? "同期中..." : "Jinjer同期"}
                  </button>
                  <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                    {shiftUploadFile ? shiftUploadFile.name : "Excel/CSV選択"}
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(event) => setShiftUploadFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!shiftUploadFile || shiftUploading}
                    onClick={() => void uploadShiftFile()}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 disabled:opacity-50"
                  >
                    {shiftUploading ? "取込中..." : "ファイル取込"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[16px] font-extrabold">{year}年{month}月</div>
                {viewMode === "week" ? (
                  <div className="text-sm text-slate-500">{startOfWeek(weekBaseDate)} ～ {endOfWeek(weekBaseDate)}</div>
                ) : null}
              </div>

              <div className="space-y-3 md:hidden">
                {visibleDates.map((date) => {
                  const isToday = date === todayIso;
                  return (
                    <article key={date} className={`rounded-2xl border p-3 ${isToday ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-extrabold">{formatDateLabel(date)}（{weekdayLabel(date)}）</div>
                        <div className="text-xs text-slate-500">清掃 {getCleanCount(date)}件 / 出勤 {getAttendanceCount(date)}名</div>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">1人当たり {String(getWorkload(date))}件</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {filteredStaffs.map((staff) => {
                          const current = getShiftMark(date, staff.id);
                          const key = `${date}-${staff.id}`;
                          return (
                            <label key={staff.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                              <span className="truncate text-sm font-semibold">{staff.staff_name}</span>
                              <select
                                value={current}
                                disabled={savingKey === key}
                                onChange={(event) => void saveCell(date, staff.id, event.target.value as ShiftMark)}
                                className={`rounded-lg border px-2 py-1 text-sm font-semibold ${markClass(current)}`}
                              >
                                {SHIFT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                              </select>
                            </label>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden max-h-[70vh] w-full overflow-auto rounded-[18px] border border-slate-200 md:block">
                <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-50 min-w-[72px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]">日付</th>
                      <th className="sticky left-[72px] top-0 z-40 min-w-[64px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]">曜日</th>
                      <th className="sticky left-[136px] top-0 z-40 min-w-[96px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]">総清掃数</th>
                      <th className="sticky left-[232px] top-0 z-40 min-w-[96px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]">出勤人数</th>
                      <th className="sticky left-[328px] top-0 z-40 min-w-[140px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]">1人当たり</th>
                      {filteredStaffs.map((staff) => (
                        <th key={staff.id} className="sticky top-0 z-30 min-w-[118px] bg-slate-50 px-3 py-3 text-left font-extrabold">{staff.staff_name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDates.map((date) => {
                      const isToday = date === todayIso;
                      const stickyBg = isToday ? "bg-rose-50" : "bg-white";
                      return (
                        <tr key={date} className={isToday ? "bg-rose-50" : "bg-white"}>
                          <td className={`sticky left-0 z-30 min-w-[72px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}>{formatDateLabel(date)}</td>
                          <td className={`sticky left-[72px] z-30 min-w-[64px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}>{weekdayLabel(date)}</td>
                          <td className={`sticky left-[136px] z-30 min-w-[96px] ${stickyBg} px-4 py-3 font-semibold shadow-[2px_0_0_#e2e8f0]`}>{getCleanCount(date)}</td>
                          <td className={`sticky left-[232px] z-30 min-w-[96px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}>{getAttendanceCount(date)}</td>
                          <td className={`sticky left-[328px] z-30 min-w-[140px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}>{String(getWorkload(date))}</td>
                          {filteredStaffs.map((staff) => {
                            const current = getShiftMark(date, staff.id);
                            const key = `${date}-${staff.id}`;
                            return (
                              <td key={staff.id} className={`min-w-[118px] ${stickyBg} px-3 py-3`}>
                                <select
                                  value={current}
                                  disabled={savingKey === key}
                                  onChange={(event) => void saveCell(date, staff.id, event.target.value as ShiftMark)}
                                  className={`h-10 min-w-[92px] rounded-xl border px-3 text-sm font-medium outline-none ${markClass(current)} ${savingKey === key ? "opacity-50" : ""}`}
                                >
                                  {SHIFT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {mainTab === "account" ? <AccountManagementPage /> : null}

        {mainTab === "mate" ? (
          <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[18px] font-extrabold">メイトカルテ</div>
            <div className="mt-2 text-sm text-slate-500">メイトカルテ機能は既存画面への接続準備中です。</div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
