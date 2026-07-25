import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

function addMobileState() {
  if (text.includes("mobileScheduleDate")) return;
  const target = '  const [scheduleCalendarTab, setScheduleCalendarTab] = useState<ScheduleCalendarTab>("orders");';
  const replacement = `${target}\n  const [mobileScheduleDate, setMobileScheduleDate] = useState<string | null>(null);`;
  if (!text.includes(target)) throw new Error("mobile schedule state target not found");
  text = text.replace(target, replacement);
}

function replaceExistingMobileCalendar() {
  text = text.replace(
    'onClick={() => count > 0 && window.open(targetUrl, "_blank", "noopener,noreferrer")}',
    'onClick={() => count > 0 && setMobileScheduleDate(cell.date)}'
  );
  text = text.replace(
    '                const targetUrl = scheduleCalendarTab === "orders" ? ORDER_MANAGEMENT_URL : GUSK_PROPERTY_MANAGEMENT_URL;\n',
    ''
  );
  text = text.replace(
    '予定のある日をタップすると管理画面を開きます',
    '予定のある日をタップすると、その日の一覧を表示します'
  );
}

function addMobileModal() {
  if (text.includes("mobile-schedule-detail-modal")) return;
  const target = '          <div className="mt-4 hidden grid-cols-7 gap-2 md:grid">';
  const modal = `          {/* mobile-schedule-detail-modal */}
          {mobileScheduleDate ? (
            <div
              className="fixed inset-0 z-[1000] flex items-end bg-black/40 md:hidden"
              onMouseDown={(e) => { if (e.target === e.currentTarget) setMobileScheduleDate(null); }}
            >
              <div className="max-h-[82vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {Number(mobileScheduleDate.slice(5, 7))}月{Number(mobileScheduleDate.slice(8, 10))}日
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {scheduleCalendarTab === "orders" ? "発注納期一覧" : "工事予定一覧"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileScheduleDate(null)}
                    className="h-10 w-10 rounded-full border border-slate-200 text-xl font-bold text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="max-h-[calc(82vh-76px)] space-y-3 overflow-y-auto p-4">
                  {scheduleCalendarTab === "orders" ? (
                    <>
                      {orderDueSchedules
                        .filter((item) => item.due_date === mobileScheduleDate)
                        .map((item) => (
                          <button
                            type="button"
                            key={\`mobile_order_\${item.id}\`}
                            onClick={() => window.open(ORDER_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}
                            className="block w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left"
                          >
                            <div className="font-bold text-amber-950">{item.item_name || "品名未設定"}</div>
                            <div className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-sm text-slate-700">
                              <span className="text-slate-500">数量</span>
                              <span>{item.quantity ?? "-"}{item.unit || ""}</span>
                              <span className="text-slate-500">配送先</span>
                              <span>{item.delivery_place || item.usage_place || "未設定"}</span>
                              <span className="text-slate-500">発注先</span>
                              <span>{item.supplier || "未設定"}</span>
                              <span className="text-slate-500">発注番号</span>
                              <span>{item.order_no || "-"}</span>
                            </div>
                          </button>
                        ))}
                    </>
                  ) : (
                    <>
                      {constructionSchedules
                        .filter((item) => {
                          if (item.start_date && item.end_date) return isDateInRange(mobileScheduleDate, item.start_date, item.end_date);
                          return [item.start_date, item.end_date, item.actual_end_date].filter(Boolean).includes(mobileScheduleDate);
                        })
                        .map((item) => (
                          <button
                            type="button"
                            key={\`mobile_construction_\${item.id}\`}
                            onClick={() => window.open(GUSK_PROPERTY_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}
                            className="block w-full rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left"
                          >
                            <div className="font-bold text-sky-950">{item.property_name || "物件未設定"}</div>
                            <div className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-sm text-slate-700">
                              <span className="text-slate-500">工事内容</span>
                              <span>{item.work_content || "未設定"}</span>
                              <span className="text-slate-500">業者</span>
                              <span>{item.contractor || "未設定"}</span>
                              <span className="text-slate-500">状態</span>
                              <span>{item.status || "未設定"}</span>
                              <span className="text-slate-500">期間</span>
                              <span>{item.start_date || "-"} ～ {item.end_date || "-"}</span>
                            </div>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

${target}`;
  if (!text.includes(target)) throw new Error("mobile schedule modal target not found");
  text = text.replace(target, modal);
}

addMobileState();

if (text.includes("mobile-schedule-calendar")) {
  replaceExistingMobileCalendar();
  addMobileModal();
  fs.writeFileSync(file, text);
  console.log("updated mobile schedule calendar detail modal");
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
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => count > 0 && setMobileScheduleDate(cell.date)}
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
            <div className="mt-3 text-center text-xs text-slate-400">予定のある日をタップすると、その日の一覧を表示します</div>
          </div>
          <div className="mt-4 hidden grid-cols-7 gap-2 md:grid">`;

if (!text.includes(gridTarget)) throw new Error("mobile calendar grid target not found");
text = text.replace(gridTarget, mobileGrid);

text = text.replace(
  '<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">\n          {/* mobile-schedule-calendar */}',
  '<section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-6">\n          {/* mobile-schedule-calendar */}'
);

addMobileModal();

fs.writeFileSync(file, text);
console.log("patched mobile schedule calendar with detail modal");