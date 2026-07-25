import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

if (text.includes("mobile-schedule-calendar")) {
  process.exit(0);
}

const headerTarget = `          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-2 text-xl font-bold text-slate-900">スケジュールカレンダー</h2>
              <button
                onClick={() => setScheduleCalendarTab("orders")}
                className={\`rounded-2xl border px-4 py-2 text-sm font-bold \${scheduleCalendarTab === "orders" ? "border-amber-200 bg-amber-100 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}\`}
              >
                発注
              </button>
              <button
                onClick={() => setScheduleCalendarTab("constructions")}
                className={\`rounded-2xl border px-4 py-2 text-sm font-bold \${scheduleCalendarTab === "constructions" ? "border-sky-200 bg-sky-100 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}\`}
              >
                工事
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">前月</button>
              <div className="min-w-[140px] text-center text-sm font-bold text-slate-800">{viewYear}年 {viewMonth}月</div>
              <button onClick={nextMonth} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">次月</button>
            </div>
          </div>`;

const headerReplacement = `          {/* mobile-schedule-calendar */}
          <div className="md:hidden">
            <h2 className="text-lg font-bold text-slate-900">スケジュール</h2>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button onClick={prevMonth} className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700">‹</button>
              <div className="text-base font-bold text-slate-900">{viewYear}年 {viewMonth}月</div>
              <button onClick={nextMonth} className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-700">›</button>
            </div>
            <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button onClick={() => setScheduleCalendarTab("orders")} className={\`rounded-lg px-3 py-2 text-sm font-bold \${scheduleCalendarTab === "orders" ? "bg-white text-amber-800 shadow-sm" : "text-slate-500"}\`}>発注</button>
              <button onClick={() => setScheduleCalendarTab("constructions")} className={\`rounded-lg px-3 py-2 text-sm font-bold \${scheduleCalendarTab === "constructions" ? "bg-white text-sky-800 shadow-sm" : "text-slate-500"}\`}>工事</button>
            </div>
          </div>
          <div className="hidden items-center justify-between gap-4 md:flex">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-2 text-xl font-bold text-slate-900">スケジュールカレンダー</h2>
              <button onClick={() => setScheduleCalendarTab("orders")} className={\`rounded-2xl border px-4 py-2 text-sm font-bold \${scheduleCalendarTab === "orders" ? "border-amber-200 bg-amber-100 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}\`}>発注</button>
              <button onClick={() => setScheduleCalendarTab("constructions")} className={\`rounded-2xl border px-4 py-2 text-sm font-bold \${scheduleCalendarTab === "constructions" ? "border-sky-200 bg-sky-100 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}\`}>工事</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">前月</button>
              <div className="min-w-[140px] text-center text-sm font-bold text-slate-800">{viewYear}年 {viewMonth}月</div>
              <button onClick={nextMonth} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">次月</button>
            </div>
          </div>`;

if (!text.includes(headerTarget)) throw new Error("mobile calendar header target not found");
text = text.replace(headerTarget, headerReplacement);

const gridTarget = `          <div className="mt-4 grid grid-cols-7 gap-2">`;
const mobileGrid = `          <div className="mt-3 md:hidden">
            <div className="grid grid-cols-7 gap-1">
              {WEEK_LABELS.map((label) => (
                <div key={label} className="py-1 text-center text-xs font-bold text-slate-500">{label}</div>
              ))}
              {calendarCells.map((cell) => {
                const orderCount = orderDueSchedules.filter((item) => item.due_date === cell.date).length;
                const constructionCount = constructionSchedules.filter((item) => {
                  if (item.start_date && item.end_date) return isDateInRange(cell.date, item.start_date, item.end_date);
                  return [item.start_date, item.end_date, item.actual_end_date].filter(Boolean).includes(cell.date);
                }).length;
                const count = scheduleCalendarTab === "orders" ? orderCount : constructionCount;
                const targetUrl = scheduleCalendarTab === "orders" ? ORDER_MANAGEMENT_URL : GUSK_PROPERTY_MANAGEMENT_URL;
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => count > 0 && window.open(targetUrl, "_blank", "noopener,noreferrer")}
                    className={\`relative min-h-[58px] rounded-xl border px-1 py-2 text-left \${cell.inMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-300"} \${count > 0 ? "active:scale-[0.98]" : ""}\`}
                  >
                    <div className="text-sm font-bold">{cell.day}</div>
                    {count > 0 ? (
                      <div className={\`mt-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold \${scheduleCalendarTab === "orders" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}\`}>
                        {count}件
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-center text-xs text-slate-400">予定のある日をタップすると管理画面を開きます</div>
          </div>
          <div className="mt-4 hidden grid-cols-7 gap-2 md:grid">`;

if (!text.includes(gridTarget)) throw new Error("mobile calendar grid target not found");
text = text.replace(gridTarget, mobileGrid);

text = text.replace(
  '<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">\n          {/* mobile-schedule-calendar */}',
  '<section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-6">\n          {/* mobile-schedule-calendar */}'
);

fs.writeFileSync(file, text);
console.log("patched mobile schedule calendar");
