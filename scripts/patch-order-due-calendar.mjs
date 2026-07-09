import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

if (text.includes("VITE_ORDER_SUPABASE_URL")) {
  process.exit(0);
}

function replaceOnce(target, replacement) {
  if (!text.includes(target)) {
    throw new Error(`patch target not found: ${target.slice(0, 80)}`);
  }
  text = text.replace(target, replacement);
}

replaceOnce(
  `const API_BASE =\n  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";`,
  `const API_BASE =\n  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";\n\nconst ORDER_SUPABASE_URL = import.meta.env.VITE_ORDER_SUPABASE_URL || "";\nconst ORDER_SUPABASE_ANON_KEY = import.meta.env.VITE_ORDER_SUPABASE_ANON_KEY || "";\nconst ORDER_MANAGEMENT_URL =\n  import.meta.env.VITE_ORDER_MANAGEMENT_URL || "https://order-management-hoq5.onrender.com";`
);

replaceOnce(
  `type PortalSchedule = {\n  id: string;\n  start_date: string;\n  end_date: string;\n  assignee_ids: string[];\n  assignee_names: string[];\n  title: string;\n  description: string;\n  created_at?: string;\n  updated_at?: string;\n};`,
  `type PortalSchedule = {\n  id: string;\n  start_date: string;\n  end_date: string;\n  assignee_ids: string[];\n  assignee_names: string[];\n  title: string;\n  description: string;\n  created_at?: string;\n  updated_at?: string;\n};\n\ntype OrderDueSchedule = {\n  id: string;\n  order_no: string;\n  status: string;\n  item_name: string;\n  quantity: number | null;\n  unit: string | null;\n  usage_place: string | null;\n  delivery_place: string | null;\n  supplier: string | null;\n  due_date: string;\n};`
);

replaceOnce(
  `function isDateInRange(target: string, start: string, end: string) {\n  return target >= start && target <= end;\n}`,
  `function isDateInRange(target: string, start: string, end: string) {\n  return target >= start && target <= end;\n}\n\nfunction getMonthRange(year: number, month: number) {\n  const start = toDateString(new Date(year, month - 1, 1));\n  const end = toDateString(new Date(year, month, 0));\n  return { start, end };\n}`
);

replaceOnce(
  `  const [staffs, setStaffs] = useState<Staff[]>([]);\n  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);`,
  `  const [staffs, setStaffs] = useState<Staff[]>([]);\n  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);\n  const [orderDueSchedules, setOrderDueSchedules] = useState<OrderDueSchedule[]>([]);`
);

replaceOnce(
  `  useEffect(() => {\n    if (!token) return;\n    void fetchSchedules();\n  }, [token, viewYear, viewMonth]);`,
  `  useEffect(() => {\n    if (!token) return;\n    void fetchSchedules();\n    void fetchOrderDueSchedules();\n  }, [token, viewYear, viewMonth]);`
);

replaceOnce(
  `  async function fetchSchedules() {\n    try {\n      setLoadingCalendar(true);\n      const res = await authorizedFetch(\n        `${API_BASE}/api/admin-portal/calendar-schedules?year=${viewYear}&month=${viewMonth}`\n      );\n      const data = await res.json();\n      const normalized = Array.isArray(data?.schedules)\n        ? data.schedules.map((item: any) => ({\n            id: String(item.id),\n            start_date: item.start_date,\n            end_date: item.end_date,\n            assignee_ids: normalizeArray(item.assignee_ids),\n            assignee_names: normalizeArray(item.assignee_names),\n            title: item.title || "",\n            description: item.description || "",\n            created_at: item.created_at,\n            updated_at: item.updated_at,\n          }))\n        : [];\n      setSchedules(normalized);\n    } finally {\n      setLoadingCalendar(false);\n    }\n  }`,
  `  async function fetchSchedules() {\n    try {\n      setLoadingCalendar(true);\n      const res = await authorizedFetch(\n        `${API_BASE}/api/admin-portal/calendar-schedules?year=${viewYear}&month=${viewMonth}`\n      );\n      const data = await res.json();\n      const normalized = Array.isArray(data?.schedules)\n        ? data.schedules.map((item: any) => ({\n            id: String(item.id),\n            start_date: item.start_date,\n            end_date: item.end_date,\n            assignee_ids: normalizeArray(item.assignee_ids),\n            assignee_names: normalizeArray(item.assignee_names),\n            title: item.title || "",\n            description: item.description || "",\n            created_at: item.created_at,\n            updated_at: item.updated_at,\n          }))\n        : [];\n      setSchedules(normalized);\n    } finally {\n      setLoadingCalendar(false);\n    }\n  }\n\n  async function fetchOrderDueSchedules() {\n    if (!ORDER_SUPABASE_URL || !ORDER_SUPABASE_ANON_KEY) {\n      setOrderDueSchedules([]);\n      return;\n    }\n\n    const { start, end } = getMonthRange(viewYear, viewMonth);\n    const params = new URLSearchParams();\n    params.set("select", "id,order_no,status,item_name,quantity,unit,usage_place,delivery_place,supplier,due_date");\n    params.set("due_date", `gte.${start}`);\n    params.append("due_date", `lte.${end}`);\n    params.set("status", "neq.キャンセル");\n    params.set("order", "due_date.asc");\n\n    try {\n      const res = await fetch(`${ORDER_SUPABASE_URL}/rest/v1/orders?${params.toString()}`, {\n        headers: {\n          apikey: ORDER_SUPABASE_ANON_KEY,\n          Authorization: `Bearer ${ORDER_SUPABASE_ANON_KEY}`,\n        },\n      });\n\n      if (!res.ok) throw new Error("発注納期の取得に失敗しました。");\n\n      const data = await res.json();\n      const normalized = Array.isArray(data)\n        ? data\n            .filter((item) => item?.due_date)\n            .map((item) => ({\n              id: String(item.id),\n              order_no: item.order_no || "",\n              status: item.status || "",\n              item_name: item.item_name || "",\n              quantity: item.quantity ?? null,\n              unit: item.unit ?? null,\n              usage_place: item.usage_place ?? null,\n              delivery_place: item.delivery_place ?? null,\n              supplier: item.supplier ?? null,\n              due_date: item.due_date,\n            }))\n        : [];\n      setOrderDueSchedules(normalized);\n    } catch (error) {\n      console.error(error);\n      setOrderDueSchedules([]);\n    }\n  }`
);

replaceOnce(
  `              const daySchedules = schedules.filter((item) => isDateInRange(cell.date, item.start_date, item.end_date));\n              return (`,
  `              const daySchedules = schedules.filter((item) => isDateInRange(cell.date, item.start_date, item.end_date));\n              const dayOrderDueSchedules = orderDueSchedules.filter((item) => item.due_date === cell.date);\n              return (`
);

replaceOnce(
  `                    {daySchedules.map((item) => (\n                      <button key={`${cell.date}_${item.id}`} onClick={() => openEditScheduleModal(item)} className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-800 hover:bg-sky-100">\n                        <div className="truncate font-semibold">{item.title}</div>\n                        <div className="truncate text-[11px] opacity-80">{item.assignee_names.join(" / ") || "担当なし"}</div>\n                      </button>\n                    ))}`,
  `                    {daySchedules.map((item) => (\n                      <button key={`${cell.date}_${item.id}`} onClick={() => openEditScheduleModal(item)} className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-800 hover:bg-sky-100">\n                        <div className="truncate font-semibold">{item.title}</div>\n                        <div className="truncate text-[11px] opacity-80">{item.assignee_names.join(" / ") || "担当なし"}</div>\n                      </button>\n                    ))}\n                    {dayOrderDueSchedules.map((item) => (\n                      <button\n                        key={`${cell.date}_order_${item.id}`}\n                        onClick={() => window.open(ORDER_MANAGEMENT_URL, "_blank", "noopener,noreferrer")}\n                        className="block w-full rounded-lg bg-amber-50 px-2 py-1 text-left text-xs text-amber-900 hover:bg-amber-100"\n                        title={`${item.order_no} ${item.item_name}`}\n                      >\n                        <div className="truncate font-bold">発注納期：{item.item_name}</div>\n                        <div className="truncate text-[11px] opacity-80">\n                          {item.quantity ?? "-"}{item.unit || ""} / {item.supplier || item.delivery_place || item.usage_place || "発注"}\n                        </div>\n                      </button>\n                    ))}`
);

fs.writeFileSync(file, text);
