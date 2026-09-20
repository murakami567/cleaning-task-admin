import { useState } from "react";
import ShiftManagementPage from "./ShiftManagementPage";
import CompanyCalendarPage from "./CompanyCalendarPage";

type MainTab = "company" | "employee";
type EmployeeTab = "employee" | "mate";

export default function SchedulePage() {
  const [mainTab, setMainTab] = useState<MainTab>("company");
  const [employeeTab, setEmployeeTab] = useState<EmployeeTab>("employee");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 pt-5 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">スケジュール</h1>
          <p className="mt-1 text-sm text-slate-500">全社予定と社員スケジュールを管理します。</p>
        </div>

        <div className="mt-5 flex gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMainTab("company")}
            className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-bold transition ${
              mainTab === "company"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            全社カレンダー
          </button>
          <button
            type="button"
            onClick={() => setMainTab("employee")}
            className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-bold transition ${
              mainTab === "employee"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            社員スケジュール
          </button>
        </div>
      </div>

      {mainTab === "company" ? (
        <CompanyCalendarPage />
      ) : (
        <div>
          <div className="px-4 pt-4 sm:px-6">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button type="button" onClick={() => setEmployeeTab("employee")} className={`rounded-lg px-5 py-2 text-sm font-bold transition ${employeeTab === "employee" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>社員</button>
              <button type="button" onClick={() => setEmployeeTab("mate")} className={`rounded-lg px-5 py-2 text-sm font-bold transition ${employeeTab === "mate" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>メイト</button>
            </div>
          </div>
          <ShiftManagementPage {...({ audience: employeeTab } as any)} />
        </div>
      )}
    </div>
  );
}
