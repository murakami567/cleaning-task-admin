import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

if (text.includes("VITE_ORDER_SUPABASE_URL")) {
  process.exit(0);
}

function replaceOnce(target, replacement) {
  if (!text.includes(target)) {
    throw new Error(`patch target not found: ${target.slice(0, 120)}`);
  }
  text = text.replace(target, replacement);
}

replaceOnce(
  'const API_BASE =\n  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";',
  [
    'const API_BASE =',
    '  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";',
    '',
    'const ORDER_SUPABASE_URL = import.meta.env.VITE_ORDER_SUPABASE_URL || "";',
    'const ORDER_SUPABASE_ANON_KEY = import.meta.env.VITE_ORDER_SUPABASE_ANON_KEY || "";',
    'const ORDER_MANAGEMENT_URL =',
    '  import.meta.env.VITE_ORDER_MANAGEMENT_URL || "https://order-management-hoq5.onrender.com";',
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
  ].join('\n')
);

replaceOnce(
  'function isDateInRange(target: string, start: string, end: string) {\n  return target >= start && target <= end;\n}',
  [
    'function isDateInRange(target: string, start: string, end: string) {',
    '  return target >= start && target <= end;',
    '}',
    '',
    'function getMonthRange(year: number, month: number) {',
    '  const start = toDateString(new Date(year, month - 1, 1));',
    '  const end = toDateString(new Date(year, month, 0));',
    '  return { start, end };',
    '}',
  ].join('\n')
);

replaceOnce(
  '  const [staffs, setStaffs] = useState<Staff[]>([]);\n  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);',
  '  const [staffs, setStaffs] = useState<Staff[]>([]);\n  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);\n  const [orderDueSchedules, setOrderDueSchedules] = useState<OrderDueSchedule[]>([]);'
);

replaceOnce(
  '  useEffect(() => {\n    if (!token) return;\n    void fetchSchedules();\n  }, [token, viewYear, viewMonth]);',
  '  useEffect(() => {\n    if (!token) return;\n    void fetchSchedules();\n    void fetchOrderDueSchedules();\n  }, [token, viewYear, viewMonth]);'
);

const orderDueFunction = [
  '  async function fetchOrderDueSchedules() {',
  '    if (!ORDER_SUPABASE_URL || !ORDER_SUPABASE_ANON_KEY) {',
  '      setOrderDueSchedules([]);',
  '      return;',
  '    }',
  '',
  '    const { start, end } = getMonthRange(viewYear, viewMonth);',
  '    const params = new URLSearchParams();',
  '    params.set("select", "id,order_no,status,item_name,quantity,unit,usage_place,delivery_place,supplier,due_date");',
  '    params.set("due_date", `gte.${start}`);',
  '    params.append("due_date", `lte.${end}`);',
  '    params.set("status", "neq.キャンセル");',
  '    params.set("order", "due_date.asc");',
  '',
  '    try {',
  '      const res = await fetch(`${ORDER_SUPABASE_URL}/rest/v1/orders?${params.toString()}`, {',
  '        headers: {',
  '          apikey: ORDER_SUPABASE_ANON_KEY,',
  '          Authorization: `Bearer ${ORDER_SUPABASE_ANON_KEY}`,',
  '        },',
  '      });',
  '',
  '      if (!res.ok) throw new Error("発注納期の取得に失敗しました。");',
  '',
  '      const data = await res.json();',
  '      const normalized = Array.isArray(data)',
  '        ? data',
  '            .filter((item) => item?.due_date)',
  '            .map((item) => ({',
  '              id: String(item.id),',
  '              order_no: item.order_no || "",',
  '              status: item.status || "",',
  '              item_name: item.item_name || "",',
  '              quantity: item.quantity ?? null,',
  '              unit: item.unit ?? null,',
  '              usage_place: item.usage_place ?? null,',
  '              delivery_place: item.delivery_place ?? null,',
  '              supplier: item.supplier ?? null,',
  '              due_date: item.due_date,',
  '            }))',
  '        : [];',
  '      setOrderDueSchedules(normalized);',
  '    } catch (error) {',
  '      console.error(error);',
  '      setOrderDueSchedules([]);',
  '    }',
  '  }',
  '',
].join('\n');

replaceOnce(
  '  function openMessageModal() {',
  orderDueFunction + '  function openMessageModal() {'
);

replaceOnce(
  '              const daySchedules = schedules.filter((item) => isDateInRange(cell.date, item.start_date, item.end_date));\n              return (',
  '              const daySchedules = schedules.filter((item) => isDateInRange(cell.date, item.start_date, item.end_date));\n              const dayOrderDueSchedules = orderDueSchedules.filter((item) => item.due_date === cell.date);\n              return ('
);

replaceOnce(
  '                    {daySchedules.map((item) => (\n                      <button key={`${cell.date}_${item.id}`} onClick={() => openEditScheduleModal(item)} className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-800 hover:bg-sky-100">\n                        <div className="truncate font-semibold">{item.title}</div>\n                        <div className="truncate text-[11px] opacity-80">{item.assignee_names.join(" / ") || "担当なし"}</div>\n                      </button>\n                    ))}',
  [
    '                    {daySchedules.map((item) => (',
    '                      <button key={`${cell.date}_${item.id}`} onClick={() => openEditScheduleModal(item)} className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-800 hover:bg-sky-100">',
    '                        <div className="truncate font-semibold">{item.title}</div>',
    '                        <div className="truncate text-[11px] opacity-80">{item.assignee_names.join(" / ") || "担当なし"}</div>',
    '                      </button>',
    '                    ))}',
    '                    {dayOrderDueSchedules.map((item) => (',
    '                      <button',
    '                        key={`${cell.date}_order_${item.id}`}',
    '                        onClick={() => window.open(ORDER_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}',
    '                        className="block w-full rounded-lg bg-amber-50 px-2 py-1 text-left text-xs text-amber-900 hover:bg-amber-100"',
    '                        title={`${item.order_no} ${item.item_name}`}',
    '                      >',
    '                        <div className="truncate font-bold">発注納期：{item.item_name}</div>',
    '                        <div className="truncate text-[11px] opacity-80">',
    '                          {item.quantity ?? "-"}{item.unit || ""} / {item.supplier || item.delivery_place || item.usage_place || "発注"}',
    '                        </div>',
    '                      </button>',
    '                    ))}',
  ].join('\n')
);

fs.writeFileSync(file, text);
