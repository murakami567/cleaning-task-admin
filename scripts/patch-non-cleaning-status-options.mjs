import fs from "fs";

const path = "src/AdminTasksPagePreview.tsx";
let text = fs.readFileSync(path, "utf8");

function rep(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

if (!text.includes("const NON_CLEANING_STATUS_OPTIONS")) {
  rep(
    `const STATUS_OPTIONS = [
  { value: "未着手", label: "未着手" },
  { value: "清掃開始", label: "清掃開始" },
  { value: "清掃中", label: "清掃中" },
  { value: "完了", label: "清掃完了" },
  { value: "持越", label: "持越" },
  { value: "CXL", label: "CXL" },
];`,
    `const STATUS_OPTIONS = [
  { value: "未着手", label: "未着手" },
  { value: "清掃開始", label: "清掃開始" },
  { value: "清掃中", label: "清掃中" },
  { value: "完了", label: "清掃完了" },
  { value: "持越", label: "持越" },
  { value: "CXL", label: "CXL" },
];

const NON_CLEANING_STATUS_OPTIONS = [
  { value: "未着手", label: "未着手" },
  { value: "対応中", label: "対応中" },
  { value: "完了", label: "完了" },
];`
  );
}

rep(
  `function statusLabel(v: string) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}`,
  `function statusLabel(v: string) {
  return (
    STATUS_OPTIONS.find((o) => o.value === v)?.label ??
    NON_CLEANING_STATUS_OPTIONS.find((o) => o.value === v)?.label ??
    v
  );
}`
);

rep(
  `    status: t.status ?? "未着手",`,
  `    status: ["未着手", "対応中", "完了"].includes(t.status) ? t.status : t.status === "清掃中" || t.status === "清掃開始" ? "対応中" : "未着手",`
);

rep(
  `                options={STATUS_OPTIONS}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">日付</div>`,
  `                options={NON_CLEANING_STATUS_OPTIONS}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">日付</div>`
);

// Add status column to non-cleaning list if not already present.
if (!text.includes("<th className=\"bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]\">\n                        ステータス")) {
  rep(
    `                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">
                        日付
                      </th>`,
    `                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">
                        ステータス
                      </th>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">
                        日付
                      </th>`
  );

  rep(
    `                        <tr key={t.id} className="bg-white">
                          <td className="border-b px-3 py-2">{formatMd(t.date)}</td>`,
    `                        <tr key={t.id} className="bg-white">
                          <td className="border-b px-3 py-2">
                            <span className={\`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold \${statusChipClass(t.status)}\`}>
                              {statusLabel(t.status)}
                            </span>
                          </td>
                          <td className="border-b px-3 py-2">{formatMd(t.date)}</td>`
  );

  rep(
    `                          colSpan={6}`,
    `                          colSpan={7}`
  );
}

fs.writeFileSync(path, text);
console.log("patched non-cleaning status options");
