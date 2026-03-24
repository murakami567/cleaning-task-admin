import React, { useEffect, useMemo, useState } from "react";

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

type ShiftMark = "出勤" | "休み" | "定休" | "半休" | "応援" | "未定";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateLabel(iso: string) {
  const dt = new Date(iso);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function weekdayLabel(iso: string) {
  const dt = new Date(iso);
  return WEEKDAYS[dt.getDay()];
}

function buildMonthDates(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => {
    const day = i + 1;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  });
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
  if (value === "定休") return "bg-blue-50 text-blue-600 border-blue-200";
  if (value === "休み") return "bg-slate-100 text-slate-500 border-slate-200";
  if (value === "半休") return "bg-amber-50 text-amber-700 border-amber-200";
  if (value === "応援") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (value === "出勤") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-white text-slate-400 border-slate-200";
}

function cycleShift(current: ShiftMark): ShiftMark {
  const order: ShiftMark[] = ["未定", "出勤", "休み", "定休", "半休", "応援"];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

export default function ShiftBoardPage() {
  const today = new Date();
  const [mainTab, setMainTab] = useState<"shift" | "account" | "mate">("shift");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [days, setDays] = useState<ShiftDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");

  const loadBoard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/shift-board?year=${year}&month=${month}`);
      if (!res.ok) throw new Error(`shift-board failed: ${res.status}`);
      const data = await res.json();
      setStaffs(data.staffs || []);
      setDays(data.days || []);
    } catch (e) {
      console.error(e);
      alert("シフト表の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoard();
  }, [year, month]);

  const allDates = useMemo(() => buildMonthDates(year, month), [year, month]);

  const weekDates = useMemo(() => {
    const start = allDates[0] || "";
    const idx = allDates.indexOf(start);
    return allDates.slice(idx, idx + 7);
  }, [allDates]);

  const visibleDates = viewMode === "month" ? allDates : weekDates;

  const dayMap = useMemo(() => {
    const map = new Map<string, ShiftDay>();
    days.forEach((d) => map.set(d.shift_date, d));
    return map;
  }, [days]);

  const getShiftMark = (date: string, staffId: string): ShiftMark => {
    const day = dayMap.get(date);
    const entry = day?.shift_entries?.find((x) => x.staff_id === staffId);
    return (entry?.status as ShiftMark) || "未定";
  };

  const getCleanCount = (date: string) => {
    const dt = new Date(date);
    const day = dt.getDate();
    return 30 + ((day * 4) % 23);
  };

  const saveCell = async (date: string, staffId: string, nextStatus: ShiftMark) => {
    try {
      const key = `${date}-${staffId}`;
      setSavingKey(key);

      const dayRes = await fetch(`${API_BASE}/shifts/get_or_create_day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_date: date, note: "" }),
      });

      if (!dayRes.ok) throw new Error(`get_or_create_day failed: ${dayRes.status}`);
      const day = await dayRes.json();

      const saveRes = await fetch(`${API_BASE}/shifts/upsert_entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_day_id: day.id,
          staff_id: staffId,
          status: nextStatus,
          start_time: nextStatus === "休み" || nextStatus === "定休" ? null : "09:00",
          end_time: nextStatus === "休み" || nextStatus === "定休" ? null : "18:00",
          assigned_area: "",
          note: "",
        }),
      });

      if (!saveRes.ok) throw new Error(`upsert_entry failed: ${saveRes.status}`);

      await loadBoard();
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
                  クリックで 出勤 / 休み / 定休 / 半休 / 応援 / 未定 を切替保存
                </div>
              </div>

              <div className="flex items-center gap-2">
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
              <div className="mb-3 text-[16px] font-extrabold">
                {year}年{month}月
              </div>

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
                          const next = cycleShift(current);
                          const key = `${date}-${staff.id}`;
                          const saving = savingKey === key;

                          return (
                            <td key={staff.id} className="px-4 py-3">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void saveCell(date, staff.id, next)}
                                className={`inline-flex rounded-xl border px-3 py-1 text-sm font-medium transition ${markClass(
                                  current
                                )} ${saving ? "opacity-50" : "hover:opacity-80"}`}
                                title={`クリックで ${next} に変更`}
                              >
                                {saving ? "保存中..." : current}
                              </button>
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

        {mainTab === "account" && (
          <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm p-6">
            <div className="text-[18px] font-extrabold">アカウント管理</div>
            <div className="mt-2 text-sm text-slate-500">次段階で追加します。</div>
          </div>
        )}

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
