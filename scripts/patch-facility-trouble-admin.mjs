import fs from "node:fs";

const file = "src/FacilityManagementPage.tsx";
let src = fs.readFileSync(file, "utf8");

const replaceOnce = (from, to, label) => {
  if (src.includes(to)) return;
  if (!src.includes(from)) throw new Error(`patch target not found: ${label}`);
  src = src.replace(from, to);
};

replaceOnce(
`  note: string;
};`,
`  note: string;
  report_date?: string | null;
  reporter_name?: string | null;
  photo_url?: string | null;
};`,
"FacilityItem type"
);

replaceOnce(
`    value === "完了"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "対応中"`,
`    value === "対応完了" || value === "完了"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "対応中"`,
"StatusBadge completed"
);

replaceOnce(`    status: "未着手",`, `    status: "保留",`, "initial status");
replaceOnce(`      status: "未着手",`, `      status: "保留",`, "new status");

replaceOnce(
`      .sort((a, b) => String(a.start_date || "").localeCompare(String(b.start_date || ""), "ja"));`,
`      .sort((a, b) => String(b.report_date || b.start_date || "").localeCompare(String(a.report_date || a.start_date || ""), "ja"));`,
"sort report date"
);

replaceOnce(
`      end_date: form.end_date,
      status: form.status,
      note: form.note,`,
`      end_date: form.end_date,
      status: form.status,
      note: form.note,
      report_date: form.report_date || form.start_date,
      reporter_name: form.reporter_name || form.assignee,
      photo_url: form.photo_url || "",`,
"save body extra fields"
);

replaceOnce(
`            { ["未着手", "対応中", "保留", "完了"].map((v) => (`,
`            {["保留", "対応中", "対応完了"].map((v) => (`,
"status filter options"
);

replaceOnce(
`                <th className="text-left px-3 py-3">物件/部屋</th>
                <th className="text-left px-3 py-3 w-[130px]">担当</th>
                <th className="text-left px-3 py-3">対応内容</th>
                <th className="text-left px-3 py-3 w-[150px]">期間</th>
                <th className="text-left px-3 py-3 w-[110px]">状態</th>`,
`                <th className="text-left px-3 py-3">物件/部屋</th>
                <th className="text-left px-3 py-3 w-[120px]">報告者</th>
                <th className="text-left px-3 py-3">報告内容</th>
                <th className="text-left px-3 py-3 w-[120px]">報告日</th>
                <th className="text-left px-3 py-3 w-[120px]">対応日</th>
                <th className="text-left px-3 py-3 w-[110px]">状態</th>`,
"table header"
);

replaceOnce(
`                  <td className="px-3 py-4">{it.assignee}</td>
                  <td className="px-3 py-4">
                    <div className="font-bold">{it.content}</div>
                    {it.note ? <div className="text-xs text-slate-500 mt-1">📝 {it.note}</div> : null}
                  </td>
                  <td className="px-3 py-4 font-semibold">
                    {it.start_date}〜
                    <br />
                    {it.end_date}
                  </td>`,
`                  <td className="px-3 py-4">{it.reporter_name || it.assignee || "-"}</td>
                  <td className="px-3 py-4">
                    <div className="font-bold">{it.content}</div>
                    {it.photo_url ? <div className="text-xs text-blue-600 mt-1">写真あり</div> : null}
                    {it.note ? <div className="text-xs text-slate-500 mt-1">📝 {it.note}</div> : null}
                  </td>
                  <td className="px-3 py-4 font-semibold">{it.report_date || it.start_date || "-"}</td>
                  <td className="px-3 py-4 font-semibold">{it.end_date || "-"}</td>`,
"table cells"
);

replaceOnce(
`                 { value: "未着手", label: "未着手" },
                 { value: "対応中", label: "対応中" },
                 { value: "保留", label: "保留" },
                 { value: "完了", label: "完了" },`,
`                 { value: "保留", label: "保留" },
                 { value: "対応中", label: "対応中" },
                 { value: "対応完了", label: "対応完了" },`,
"drawer status options"
);

replaceOnce(
`          <Field label="担当">
            <TextInput value={form.assignee} onChange={(v: string) => setForm((s) => ({ ...s, assignee: v }))} />
          </Field>`,
`          <Field label="報告者">
            <TextInput value={form.reporter_name || form.assignee} onChange={(v: string) => setForm((s) => ({ ...s, reporter_name: v, assignee: v }))} />
          </Field>`,
"reporter field"
);

replaceOnce(
`          <Field label="開始日">
            <TextInput
              type="date"
              value={form.start_date || ""}
              onChange={(v: string) => setForm((s) => ({ ...s, start_date: v }))}
            />
          </Field>`,
`          <Field label="報告日">
            <TextInput
              type="date"
              value={form.report_date || form.start_date || ""}
              onChange={(v: string) => setForm((s) => ({ ...s, report_date: v, start_date: v }))}
            />
          </Field>`,
"report date field"
);

replaceOnce(
`          <Field label="終了日">`,
`          <Field label="対応日">`,
"end date label"
);

replaceOnce(
`            <Field label="対応内容">`,
`            <Field label="報告内容">`,
"content label"
);

replaceOnce(
`          <div className="sm:col-span-2">
            <Field label="備考">`,
`          {form.photo_url ? (
            <div className="sm:col-span-2">
              <Field label="写真">
                <img src={form.photo_url} alt="設備トラブル写真" className="max-h-[260px] rounded-xl border border-slate-200 object-contain" />
              </Field>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <Field label="備考">`,
"photo preview"
);

fs.writeFileSync(file, src);
console.log("patched facility trouble admin UI");
