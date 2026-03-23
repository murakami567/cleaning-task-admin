import React, { useMemo, useState } from "react";

type ShiftMark = "出勤" | "休み" | "定休" | "";

type StaffName = "メイトA" | "メイトB" | "メイトC" | "メイトD";

type DayRow = {
  date: string;
  weekday: string;
  cleanCount: number;
  shifts: Record<StaffName, ShiftMark>;
};

const STAFFS: StaffName[] = ["メイトA", "メイトB", "メイトC", "メイトD"];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildMonthRows(year: number, month: number): DayRow[] {
  const lastDay = new Date(year, month, 0).getDate();

  return Array.from({ length: lastDay }, (_, i) => {
    const day = i + 1;
    const dt = new Date(year, month - 1, day);
    const weekday = WEEKDAYS[dt.getDay()];

    const cleanCount = 30 + ((day * 4) % 23);

    const isRegularOff = weekday === "木" || weekday === "土";
    const isHoliday = weekday === "月";

    const shifts: Record<StaffName, ShiftMark> = {
      メイトA: isRegularOff ? "定休" : isHoliday ? "休み" : "",
      メイトB: isRegularOff ? "定休" : isHoliday ? "休み" : "",
      メイトC: isRegularOff ? "定休" : isHoliday ? "休み" : "",
      メイトD: isRegularOff ? "定休" : isHoliday ? "休み" : "",
    };

    return {
      date: `${month}/${day}`,
      weekday,
      cleanCount,
      shifts,
    };
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

function MarkBadge({ value }: { value: ShiftMark }) {
  if (!value) return null;

  const cls =
    value === "定休"
      ? "bg-blue-50 text-blue-600 border-blue-200"
      : value === "休み"
      ? "bg-slate-100 text-slate-500 border-slate-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex rounded-xl border px-3 py-1 text-sm font-medium ${cls}`}>
      {value}
    </span>
  );
}

export default function ShiftBoardPage() {
  const [mainTab, setMainTab] = useState<"shift" | "account" | "mate">("shift");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const year = 2026;
  const month = 12;

  const monthRows = useMemo(() => buildMonthRows(year, month), []);
  const weekRows = useMemo(() => monthRows.slice(0, 7), [monthRows]);

  const rows = viewMode === "month" ? monthRows : weekRows;

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

            <div className="pt-2 text-sm text-slate-500">Static Preview</div>
          </div>
        </div>

        {mainTab === "shift" && (
          <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
              <div>
                <div className="text-[18px] font-extrabold">シフト</div>
                <div className="mt-1 text-sm text-slate-500">
                  プレビュー：12月＋1月（2ヶ月） / 今日行は薄線 / 週は今日基準
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-1 flex gap-1">
                <SmallToggle active={viewMode === "month"} onClick={() => setViewMode("month")}>
                  月
                </SmallToggle>
                <SmallToggle active={viewMode === "week"} onClick={() => setViewMode("week")}>
                  週
                </SmallToggle>
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
                      {STAFFS.map((staff) => (
                        <th key={staff} className="px-4 py-3 text-left font-extrabold">
                          {staff}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={`${row.date}-${idx}`}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3">{row.weekday}</td>
                        <td className="px-4 py-3">{row.cleanCount}</td>

                        {STAFFS.map((staff) => (
                          <td key={staff} className="px-4 py-3">
                            <MarkBadge value={row.shifts[staff]} />
                          </td>
                        ))}
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
