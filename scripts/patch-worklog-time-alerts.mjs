import fs from "node:fs";

const patchFile = (file, patches) => {
  let src = fs.readFileSync(file, "utf8");
  for (const { from, to, label } of patches) {
    if (src.includes(to)) continue;
    if (!src.includes(from)) {
      console.warn(`patch target not found, skipped: ${file} - ${label}`);
      continue;
    }
    src = src.replace(from, to);
  }
  fs.writeFileSync(file, src);
};

const normalizeQuarterHourBlock = `function normalizeQuarterHour(time: string) {
  if (!time || !time.includes(":")) return time;
  const [hRaw, mRaw] = time.split(":").map(Number);
  if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return time;

  let h = hRaw;
  let m = Math.round(mRaw / 15) * 15;
  if (m === 60) {
    h = (h + 1) % 24;
    m = 0;
  }

  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

`;

patchFile("src/pages/employee/EmployeeWorklogPage.tsx", [
  {
    label: "default clock out 16",
    from: `  const [clockOutTime, setClockOutTime] = useState("18:00");`,
    to: `  const [clockOutTime, setClockOutTime] = useState("16:00");`,
  },
  {
    label: "default break 0",
    from: `  const [breakMinutes, setBreakMinutes] = useState("60");`,
    to: `  const [breakMinutes, setBreakMinutes] = useState("0");`,
  },
  {
    label: "clear clock out 16",
    from: `    setClockOutTime("18:00");`,
    to: `    setClockOutTime("16:00");`,
  },
  {
    label: "clear break 0",
    from: `    setBreakMinutes("60");`,
    to: `    setBreakMinutes("0");`,
  },
  {
    label: "insert normalizeQuarterHour",
    from: `function timeToMinutes(time: string) {`,
    to: `${normalizeQuarterHourBlock}function timeToMinutes(time: string) {`,
  },
  {
    label: "main mobile width",
    from: `<main className="mx-auto w-full max-w-4xl px-4 pt-6">`,
    to: `<main className="mx-auto w-full max-w-4xl box-border px-3 pt-4 sm:px-4 sm:pt-6">`,
  },
  {
    label: "form mobile overflow",
    from: `className="rounded-3xl border border-slate-200 bg-white shadow-sm"`,
    to: `className="w-full max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"`,
  },
  {
    label: "form inner mobile padding",
    from: `<div className="p-5 md:p-6">`,
    to: `<div className="box-border w-full max-w-full p-4 sm:p-5 md:p-6">`,
  },
  {
    label: "grid min width",
    from: `<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">`,
    to: `<div className="mt-6 grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2">`,
  },
  {
    label: "work start step",
    from: `<TextInput type="time" value={workStartTime} onChange={setWorkStartTime} />`,
    to: `<TextInput type="time" value={workStartTime} onChange={setWorkStartTime} step="900" />`,
  },
  {
    label: "clock in step",
    from: `<TextInput type="time" value={clockInTime} onChange={setClockInTime} />`,
    to: `<TextInput type="time" value={clockInTime} onChange={setClockInTime} step="900" />`,
  },
  {
    label: "clock out step",
    from: `<TextInput type="time" value={clockOutTime} onChange={setClockOutTime} />`,
    to: `<TextInput type="time" value={clockOutTime} onChange={setClockOutTime} step="900" />`,
  },
  {
    label: "TextInput props add step param",
    from: `function TextInput({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {`,
    to: `function TextInput({
  value,
  onChange,
  type = "text",
  step,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {`,
  },
  {
    label: "TextInput step attr",
    from: `      value={value}
      onChange={(e) => onChange(e.target.value)}`,
    to: `      value={value}
      step={step}
      onChange={(e) => onChange(e.target.value)}`,
  },
  {
    label: "TextInput mobile class",
    from: `      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"`,
    to: `      className="block h-11 w-full max-w-full min-w-0 box-border rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"`,
  },
  {
    label: "Field mobile width",
    from: `    <div>
      <div className="mb-2 text-sm font-semibold text-slate-500">{label}</div>`,
    to: `    <div className="w-full min-w-0 max-w-full">
      <div className="mb-2 text-sm font-semibold text-slate-500">{label}</div>`,
  },
  {
    label: "worklog payload normalize times",
    from: `  work_start_time: workStartTime,
   start_time: clockInTime,
   end_time: clockOutTime,`,
    to: `  work_start_time: normalizeQuarterHour(workStartTime),
   start_time: normalizeQuarterHour(clockInTime),
   end_time: normalizeQuarterHour(clockOutTime),`,
  },
]);

const formatMinutesBlock = "function formatMinutes(minutes: number) {\n" +
  "  const h = Math.floor(minutes / 60);\n" +
  "  const m = minutes % 60;\n" +
  "  if (h <= 0) return `${m}分`;\n" +
  "  return `${h}時間${m}分`;\n" +
  "}\n";

const alertHelpersBlock = formatMinutesBlock + `
function timeToMinutes(time: string) {
  if (!time || !time.includes(":")) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function getWorklogAlerts(row: { start_time: string; end_time: string }) {
  const alerts: { label: string; className: string }[] = [];
  const start = timeToMinutes(row.start_time);
  const end = timeToMinutes(row.end_time);

  if (start !== null && start > 10 * 60) {
    alerts.push({ label: "遅刻", className: "border-rose-200 bg-rose-50 text-rose-700" });
  }
  if (end !== null && end < 16 * 60) {
    alerts.push({ label: "早退", className: "border-amber-200 bg-amber-50 text-amber-700" });
  }
  if (end !== null && end > 16 * 60) {
    alerts.push({ label: "残業", className: "border-indigo-200 bg-indigo-50 text-indigo-700" });
  }

  return alerts;
}

function WorklogAlertBadges({ row }: { row: { start_time: string; end_time: string } }) {
  const alerts = getWorklogAlerts(row);
  if (alerts.length === 0) return <span className="text-slate-400">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {alerts.map((alert) => (
        <span key={alert.label} className={"rounded-full border px-2 py-1 text-xs font-bold " + alert.className}>
          {alert.label}
        </span>
      ))}
    </div>
  );
}
`;

const alertFilterBlock = `function hasAlert(row: { start_time: string; end_time: string }, target: "late" | "early") {
  const start = timeToMinutes(row.start_time);
  const end = timeToMinutes(row.end_time);
  if (target === "late") return start !== null && start > 10 * 60;
  if (target === "early") return end !== null && end < 16 * 60;
  return false;
}

`;

patchFile("src/pages/admin/AdminWorklogReportPage.tsx", [
  {
    label: "add alert helpers",
    from: formatMinutesBlock,
    to: alertHelpersBlock + alertFilterBlock,
  },
  {
    label: "add alert filter state",
    from: `  const [workTypeFilter, setWorkTypeFilter] = useState<
    "all" | "cleaning" | "inspection" | "linen" | "support"
  >("all");`,
    to: `  const [workTypeFilter, setWorkTypeFilter] = useState<
    "all" | "cleaning" | "inspection" | "linen" | "support"
  >("all");
  const [alertFilter, setAlertFilter] = useState<"all" | "late" | "early">("all");`,
  },
  {
    label: "filter worklogs by alert",
    from: `  const filteredWorklogs = useMemo(() => {
    return worklogs.filter((row) => matchesWorkTypeFilter(row.work_type, workTypeFilter));
  }, [worklogs, workTypeFilter]);`,
    to: `  const filteredWorklogs = useMemo(() => {
    return worklogs.filter((row) => {
      const workTypeMatched = matchesWorkTypeFilter(row.work_type, workTypeFilter);
      const alertMatched = alertFilter === "all" || hasAlert(row, alertFilter);
      return workTypeMatched && alertMatched;
    });
  }, [worklogs, workTypeFilter, alertFilter]);`,
  },
  {
    label: "add alert filter buttons before date",
    from: `            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">対象日</div>`,
    to: `            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">表示</div>
                <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
                  {[
                    { value: "all", label: "すべて" },
                    { value: "late", label: "遅刻" },
                    { value: "early", label: "早退" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAlertFilter(item.value as "all" | "late" | "early")}
                      className={
                        "h-9 rounded-xl px-3 text-xs font-bold transition " +
                        (alertFilter === item.value
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-50")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">対象日</div>`,
  },
  {
    label: "table min width",
    from: `<table className="w-full min-w-[1460px] text-sm">`,
    to: `<table className="w-full min-w-[1580px] text-sm">`,
  },
  {
    label: "alert header",
    from: `                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">退勤</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">休憩</th>`,
    to: `                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">退勤</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">アラート</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">休憩</th>`,
  },
  {
    label: "alert cell",
    from: `                      <td className="border-b px-4 py-3">{row.end_time || "-"}</td>
                      <td className="border-b px-4 py-3">{row.break_minutes || 0}分</td>`,
    to: `                      <td className="border-b px-4 py-3">{row.end_time || "-"}</td>
                      <td className="border-b px-4 py-3"><WorklogAlertBadges row={row} /></td>
                      <td className="border-b px-4 py-3">{row.break_minutes || 0}分</td>`,
  },
]);

console.log("patched native worklog time UI, mobile width, quarter-hour normalization, admin alerts and alert filter");
