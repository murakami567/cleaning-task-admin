import React, { useState } from "react";
import ShiftManagementPage from "./ShiftManagementPage";

export default function SchedulePage() {
  const [tab, setTab] = useState<"employee" | "mate">("employee");

  return (
    <div>
      <div className="px-4 pt-4">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("employee")}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition ${
              tab === "employee"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            社員
          </button>
          <button
            type="button"
            onClick={() => setTab("mate")}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition ${
              tab === "mate"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            メイト
          </button>
        </div>
      </div>

      <ShiftManagementPage audience={tab} />
    </div>
  );
}
