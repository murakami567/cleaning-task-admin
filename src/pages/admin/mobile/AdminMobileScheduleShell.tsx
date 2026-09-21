import { useState } from "react";
import AdminMobileSchedulePage from "./AdminMobileSchedulePage";

type ScheduleTab = "company" | "employee";

function CompanyCalendarPlaceholder() {
  return (
    <main className="mx-auto max-w-lg px-4 py-4">
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">全社カレンダー</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">社内予定・連絡事項・清掃数・発注納期・工事予定・設備予定を確認します。</p>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <div className="text-sm font-black text-slate-700">全社カレンダーを準備中です</div>
          <div className="mt-2 text-xs leading-5 text-slate-500">次の実装でスマホ向け月カレンダーと選択日の詳細を追加します。</div>
        </div>
      </section>
    </main>
  );
}

export default function AdminMobileScheduleShell() {
  const [tab, setTab] = useState<ScheduleTab>("company");
  return (
    <div className="min-h-full bg-[#f4f6f8] text-slate-900">
      <div className="sticky top-[65px] z-30 border-b border-slate-200/80 bg-white/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <div className="text-xs font-bold text-slate-400">スケジュール</div>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setTab("company")} className={`h-10 rounded-lg text-sm font-black transition ${tab === "company" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>全社カレンダー</button>
            <button type="button" onClick={() => setTab("employee")} className={`h-10 rounded-lg text-sm font-black transition ${tab === "employee" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>社員スケジュール</button>
          </div>
          <div className="h-3" />
        </div>
      </div>
      {tab === "company" ? <CompanyCalendarPlaceholder /> : <AdminMobileSchedulePage />}
    </div>
  );
}
