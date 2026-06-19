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
]);

patchFile("src/pages/admin/AdminWorklogReportPage.tsx", [
  {
    label: "add alert helpers",
    from: `function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}分`;
  return `${h}時間${m}分`;
}
`,
    to: `function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}分`;
  return `${h}時間${m}分`;
}

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
        <span key={alert.label} className={`rounded-full border px-2 py-1 text-xs font-bold ${alert.className}`}>
          {alert.label}
        </span>
      ))}
    </div>
  );
}
`,
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

console.log("patched worklog time defaults and admin alerts");
