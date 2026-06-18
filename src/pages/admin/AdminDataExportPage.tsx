import { useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function buildUrl(path: string, month: string) {
  return `${API_BASE}${path}?month=${encodeURIComponent(month)}`;
}

export default function AdminDataExportPage() {
  const [month, setMonth] = useState(currentMonth());
  const reports = useMemo(
    () => [
      {
        title: "アカウントごとの出勤率表",
        description: "アカウント別に予定日数・出勤日数・出勤率を月次で出力します。",
        path: "/reports/monthly/attendance-rate.csv",
      },
      {
        title: "アカウント × 物件別の割り当て回数表",
        description: "1清掃を1カウントとして、担当者ごとの物件別割り当て回数を出力します。",
        path: "/reports/monthly/account-property-assignments.csv",
      },
      {
        title: "物件別の清掃数",
        description: "物件ごとの月次清掃数と合計を出力します。",
        path: "/reports/monthly/property-cleaning-counts.csv",
      },
    ],
    []
  );

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs text-slate-500">管理画面 ＞ データ出力</div>
        <div className="mt-1 text-lg font-extrabold text-slate-900">月次CSV出力</div>
        <div className="mt-2 text-sm text-slate-600">
          データ解析用のCSVを月単位で出力します。
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-bold text-slate-700">対象月</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-2 h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.path} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-base font-extrabold text-slate-900">{report.title}</div>
            <div className="mt-2 min-h-[48px] text-sm text-slate-600">{report.description}</div>
            <a
              href={buildUrl(report.path, month)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-black"
              download
            >
              CSVダウンロード
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
