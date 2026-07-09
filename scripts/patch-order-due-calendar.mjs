import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

function replaceOnce(target, replacement) {
  if (!text.includes(target)) {
    throw new Error(`patch target not found: ${target.slice(0, 120)}`);
  }
  text = text.replace(target, replacement);
}

function applyPeriodFixOnly() {
  text = text.replace(
    [
      '              const dayConstructionSchedules = constructionSchedules.filter((item) => {',
      '                const dates = [item.start_date, item.end_date, item.actual_end_date].filter(Boolean);',
      '                return dates.includes(cell.date);',
      '              });',
    ].join('\n'),
    [
      '              const dayConstructionSchedules = constructionSchedules.filter((item) => {',
      '                if (item.start_date && item.end_date) return isDateInRange(cell.date, item.start_date, item.end_date);',
      '                const dates = [item.start_date, item.end_date, item.actual_end_date].filter(Boolean);',
      '                return dates.includes(cell.date);',
      '              });',
    ].join('\n')
  );

  text = text.replace(
    '                          const dateLabel = item.actual_end_date === cell.date ? "実完了" : item.end_date === cell.date ? "完了予定" : "開始";',
    '                          const dateLabel = item.actual_end_date === cell.date ? "実完了" : item.end_date === cell.date ? "完了予定" : item.start_date === cell.date ? "開始" : "施工中";'
  );
}

if (text.includes("scheduleCalendarTab")) {
  applyPeriodFixOnly();
  fs.writeFileSync(file, text);
  process.exit(0);
}

replaceOnce(
  'const API_BASE =\n  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";',
  [
    'const API_BASE =',
    '  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";',
    '',
    'const ORDER_MANAGEMENT_URL =',
    '  import.meta.env.VITE_ORDER_MANAGEMENT_URL || "https://order-management-hoq5.onrender.com";',
    '',
    'const GUSK_PROPERTY_MANAGEMENT_URL =',
    '  import.meta.env.VITE_GUSK_PROPERTY_MANAGEMENT_URL || "https://gusk-property-management.onrender.com";',
  ].join('\n')
);

replaceOnce(
  'type PortalSchedule = {\n  id: string;\n  start_date: string;\n  end_date: string;\n  assignee_ids: string[];\n  assignee_names: string[];\n  title: string;\n  description: string;\n  created_at?: string;\n  updated_at?: string;\n};',
  [
    'type PortalSchedule = {',
    '  id: string;',
    '  start_date: string;',
    '  end_date: string;',
    '  assignee_ids: string[];',
    '  assignee_names: string[];',
    '  title: string;',
    '  description: string;',
    '  created_at?: string;',
    '  updated_at?: string;',
    '};',
    '',
    'type OrderDueSchedule = {',
    '  id: string;',
    '  order_no: string;',
    '  status: string;',
    '  item_name: string;',
    '  quantity: number | null;',
    '  unit: string | null;',
    '  usage_place: string | null;',
    '  delivery_place: string | null;',
    '  supplier: string | null;',
    '  due_date: string;',
    '};',
    '',
    'type ConstructionSchedule = {',
    '  id: string;',
    '  property_id?: number | string;',
    '  property_name: string;',
    '  contractor: string;',
    '  work_content: string;',
    '  status: string;',
    '  progress?: number;',
    '  start_date?: string | null;',
    '  end_date?: string | null;',
    '  actual_end_date?: string | null;',
    '  note?: string;',
    '};',
    '',
    'type ScheduleCalendarTab = "orders" | "constructions";',
  ].join('\n')
);

replaceOnce(
  '  const [staffs, setStaffs] = useState<Staff[]>([]);\n  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);',
  [
    '  const [staffs, setStaffs] = useState<Staff[]>([]);',
    '  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);',
    '  const [orderDueSchedules, setOrderDueSchedules] = useState<OrderDueSchedule[]>([]);',
    '  const [constructionSchedules, setConstructionSchedules] = useState<ConstructionSchedule[]>([]);',
    '  const [scheduleCalendarTab, setScheduleCalendarTab] = useState<ScheduleCalendarTab>("orders");',
  ].join('\n')
);

replaceOnce(
  '  useEffect(() => {\n    if (!token) return;\n    void fetchSchedules();\n  }, [token, viewYear, viewMonth]);',
  [
    '  useEffect(() => {',
    '    if (!token) return;',
    '    void fetchSchedules();',
    '    void fetchOrderDueSchedules();',
    '    void fetchConstructionSchedules();',
    '  }, [token, viewYear, viewMonth]);',
  ].join('\n')
);

const injectedFunctions = [
  '  async function fetchOrderDueSchedules() {',
  '    try {',
  '      const res = await authorizedFetch(',
  '        `${API_BASE}/api/admin-portal/order-due-schedules?year=${viewYear}&month=${viewMonth}`',
  '      );',
  '      const data = await res.json();',
  '      const normalized = Array.isArray(data?.items)',
  '        ? data.items.map((item: any) => ({',
  '            id: String(item.id),',
  '            order_no: item.order_no || "",',
  '            status: item.status || "",',
  '            item_name: item.item_name || "",',
  '            quantity: item.quantity ?? null,',
  '            unit: item.unit ?? null,',
  '            usage_place: item.usage_place ?? null,',
  '            delivery_place: item.delivery_place ?? null,',
  '            supplier: item.supplier ?? null,',
  '            due_date: item.due_date,',
  '          }))',
  '        : [];',
  '      setOrderDueSchedules(normalized);',
  '    } catch (error) {',
  '      console.error(error);',
  '      setOrderDueSchedules([]);',
  '    }',
  '  }',
  '',
  '  async function fetchConstructionSchedules() {',
  '    try {',
  '      const res = await authorizedFetch(',
  '        `${API_BASE}/api/admin-portal/construction-schedules?year=${viewYear}&month=${viewMonth}`',
  '      );',
  '      const data = await res.json();',
  '      const normalized = Array.isArray(data?.items)',
  '        ? data.items.map((item: any) => ({',
  '            id: String(item.id),',
  '            property_id: item.property_id,',
  '            property_name: item.property_name || "",',
  '            contractor: item.contractor || "",',
  '            work_content: item.work_content || "",',
  '            status: item.status || "",',
  '            progress: item.progress ?? 0,',
  '            start_date: item.start_date || null,',
  '            end_date: item.end_date || null,',
  '            actual_end_date: item.actual_end_date || null,',
  '            note: item.note || "",',
  '          }))',
  '        : [];',
  '      setConstructionSchedules(normalized);',
  '    } catch (error) {',
  '      console.error(error);',
  '      setConstructionSchedules([]);',
  '    }',
  '  }',
  '',
].join('\n');

replaceOnce(
  '  function openMessageModal() {',
  injectedFunctions + '  function openMessageModal() {'
);

replaceOnce(
  '            <h2 className="text-xl font-bold text-slate-900">社内スケジュールカレンダー</h2>\n            <div className="flex items-center gap-2">',
  [
    '            <div className="flex flex-wrap items-center gap-2">',
    '              <h2 className="mr-2 text-xl font-bold text-slate-900">スケジュールカレンダー</h2>',
    '              <button',
    '                onClick={() => setScheduleCalendarTab("orders")}',
    '                className={`rounded-2xl border px-4 py-2 text-sm font-bold ${scheduleCalendarTab === "orders" ? "border-amber-200 bg-amber-100 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}',
    '              >',
    '                発注',
    '              </button>',
    '              <button',
    '                onClick={() => setScheduleCalendarTab("constructions")}',
    '                className={`rounded-2xl border px-4 py-2 text-sm font-bold ${scheduleCalendarTab === "constructions" ? "border-sky-200 bg-sky-100 text-sky-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}',
    '              >',
    '                工事',
    '              </button>',
    '            </div>',
    '            <div className="flex items-center gap-2">',
  ].join('\n')
);

replaceOnce(
  '              const daySchedules = schedules.filter((item) => isDateInRange(cell.date, item.start_date, item.end_date));\n              return (',
  [
    '              const daySchedules = schedules.filter((item) => isDateInRange(cell.date, item.start_date, item.end_date));',
    '              void daySchedules;',
    '              const dayOrderDueSchedules = orderDueSchedules.filter((item) => item.due_date === cell.date);',
    '              const dayConstructionSchedules = constructionSchedules.filter((item) => {',
    '                if (item.start_date && item.end_date) return isDateInRange(cell.date, item.start_date, item.end_date);',
    '                const dates = [item.start_date, item.end_date, item.actual_end_date].filter(Boolean);',
    '                return dates.includes(cell.date);',
    '              });',
    '              const visibleOrderDueSchedules = dayOrderDueSchedules.slice(0, 3);',
    '              const hiddenOrderDueCount = Math.max(dayOrderDueSchedules.length - visibleOrderDueSchedules.length, 0);',
    '              const visibleConstructionSchedules = dayConstructionSchedules.slice(0, 3);',
    '              const hiddenConstructionCount = Math.max(dayConstructionSchedules.length - visibleConstructionSchedules.length, 0);',
    '              return ('
  ].join('\n')
);

replaceOnce(
  '                    {daySchedules.map((item) => (\n                      <button key={`${cell.date}_${item.id}`} onClick={() => openEditScheduleModal(item)} className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-800 hover:bg-sky-100">\n                        <div className="truncate font-semibold">{item.title}</div>\n                        <div className="truncate text-[11px] opacity-80">{item.assignee_names.join(" / ") || "担当なし"}</div>\n                      </button>\n                    ))}',
  [
    '                    {scheduleCalendarTab === "orders" ? (',
    '                      <>',
    '                        {visibleOrderDueSchedules.map((item) => (',
    '                          <button',
    '                            key={`${cell.date}_order_${item.id}`}',
    '                            onClick={() => window.open(ORDER_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}',
    '                            className="block w-full rounded-lg bg-amber-50 px-2 py-1 text-left text-xs text-amber-900 hover:bg-amber-100"',
    '                            title={`${item.order_no} ${item.item_name}`}',
    '                          >',
    '                            <div className="truncate font-bold">発注納期：{item.item_name}</div>',
    '                            <div className="truncate text-[11px] opacity-80">',
    '                              {item.quantity ?? "-"}{item.unit || ""} / {item.supplier || item.delivery_place || item.usage_place || "発注"}',
    '                            </div>',
    '                          </button>',
    '                        ))}',
    '                        {hiddenOrderDueCount > 0 ? (',
    '                          <button',
    '                            onClick={() => window.open(ORDER_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}',
    '                            className="block w-full rounded-lg bg-amber-100 px-2 py-1 text-left text-xs font-bold text-amber-900 hover:bg-amber-200"',
    '                          >',
    '                            他 {hiddenOrderDueCount} 件の発注納期',
    '                          </button>',
    '                        ) : null}',
    '                      </>',
    '                    ) : (',
    '                      <>',
    '                        {visibleConstructionSchedules.map((item) => {',
    '                          const dateLabel = item.actual_end_date === cell.date ? "実完了" : item.end_date === cell.date ? "完了予定" : item.start_date === cell.date ? "開始" : "施工中";',
    '                          return (',
    '                            <button',
    '                              key={`${cell.date}_construction_${item.id}_${dateLabel}`}',
    '                              onClick={() => window.open(GUSK_PROPERTY_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}',
    '                              className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-900 hover:bg-sky-100"',
    '                              title={`${item.property_name} ${item.work_content}`}',
    '                            >',
    '                              <div className="truncate font-bold">工事{dateLabel}：{item.property_name}</div>',
    '                              <div className="truncate text-[11px] opacity-80">',
    '                                {item.work_content || "工事・リフォーム"} / {item.status || item.contractor || "-"}',
    '                              </div>',
    '                            </button>',
    '                          );',
    '                        })}',
    '                        {hiddenConstructionCount > 0 ? (',
    '                          <button',
    '                            onClick={() => window.open(GUSK_PROPERTY_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}',
    '                            className="block w-full rounded-lg bg-sky-100 px-2 py-1 text-left text-xs font-bold text-sky-900 hover:bg-sky-200"',
    '                          >',
    '                            他 {hiddenConstructionCount} 件の工事予定',
    '                          </button>',
    '                        ) : null}',
    '                      </>',
    '                    )}'
  ].join('\n')
);

fs.writeFileSync(file, text);
