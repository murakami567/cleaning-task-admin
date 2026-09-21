import { useState } from "react";
import AdminMobileSchedulePage from "./AdminMobileSchedulePage";
import AdminMobileCompanyCalendar from "./AdminMobileCompanyCalendar";

type ScheduleTab = "company" | "employee";

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
      {tab === "company" ? <AdminMobileCompanyCalendar /> : <AdminMobileSchedulePage />}
    </div>
  );
}
