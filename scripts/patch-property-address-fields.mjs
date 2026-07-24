import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

function rep(from, to) {
  if (!text.includes(from)) return;
  text = text.replace(from, to);
}

if (!text.includes("  address?: string | null;")) {
  rep(
    "  task_color?: string | null;\n};",
    "  task_color?: string | null;\n  address?: string | null;\n  google_maps_url?: string | null;\n};"
  );
}

rep(
  "    task_color: DEFAULT_TASK_COLOR,\n  });",
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n  });"
);

rep(
  "    task_color: DEFAULT_TASK_COLOR,\n  });\n\n  const [roomForm",
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n  });\n\n  const [roomForm"
);

rep(
  "    task_color: string;\n    is_active?: boolean;",
  "    task_color: string;\n    address: string;\n    google_maps_url: string;\n    is_active?: boolean;"
);

rep(
  "    task_color: normalizeColor(form.task_color),\n    is_active: form.is_active ?? true,",
  "    task_color: normalizeColor(form.task_color),\n    address: form.address.trim(),\n    google_maps_url: form.google_maps_url.trim(),\n    is_active: form.is_active ?? true,"
);

rep(
  "        task_color: DEFAULT_TASK_COLOR,\n        sort_order: \"999\",",
  "        task_color: DEFAULT_TASK_COLOR,\n        address: \"\",\n        google_maps_url: \"\",\n        sort_order: \"999\","
);

rep(
  "      task_color: normalizeColor(property.task_color),\n      is_active: property.is_active,",
  "      task_color: normalizeColor(property.task_color),\n      address: property.address ?? \"\",\n      google_maps_url: property.google_maps_url ?? \"\",\n      is_active: property.is_active,"
);

rep(
  "        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? \"\"}`.toLowerCase().includes(q);",
  "        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? \"\"} ${p.address ?? \"\"}`.toLowerCase().includes(q);"
);

rep(
  'placeholder="物件名・物件コード・キーで検索"',
  'placeholder="物件名・物件コード・住所で検索"'
);

rep(
  "                            <div className={`mt-1 text-xs ${selected ? \"text-white/70\" : \"text-slate-500\"}`}>\n                              {roomCount} 室 / 最大対応可能 {p.max_assignable_count ?? \"制限なし\"} / 物件点数 {p.cleaning_point ?? 60}pt\n                            </div>",
  "                            {p.address ? (\n                              <div className={`mt-1 text-xs ${selected ? \"text-white/70\" : \"text-slate-500\"}`}>{p.address}</div>\n                            ) : null}\n                            {p.google_maps_url ? (\n                              <div className=\"mt-1\">\n                                <a href={p.google_maps_url} target=\"_blank\" rel=\"noreferrer\" onClick={(e) => e.stopPropagation()} className={`text-xs font-bold underline ${selected ? \"text-sky-200\" : \"text-sky-700\"}`}>Google Mapsを開く</a>\n                              </div>\n                            ) : null}\n                            <div className={`mt-1 text-xs ${selected ? \"text-white/70\" : \"text-slate-500\"}`}>\n                              {roomCount} 室 / 最大対応可能 {p.max_assignable_count ?? \"制限なし\"} / 物件点数 {p.cleaning_point ?? 60}pt\n                            </div>"
);

rep(
  "          <Field label=\"物件名\"><TextInput value={propertyForm.property_name} onChange={(v) => setPropertyForm((p) => ({ ...p, property_name: v }))} placeholder=\"例）アトラス\" /></Field>",
  "          <Field label=\"物件名\"><TextInput value={propertyForm.property_name} onChange={(v) => setPropertyForm((p) => ({ ...p, property_name: v }))} placeholder=\"例）アトラス\" /></Field>\n          <Field label=\"住所\"><TextInput value={propertyForm.address} onChange={(v) => setPropertyForm((p) => ({ ...p, address: v }))} placeholder=\"例）福岡市博多区住吉...\" /></Field>\n          <Field label=\"Google Mapsリンク\"><TextInput type=\"url\" value={propertyForm.google_maps_url} onChange={(v) => setPropertyForm((p) => ({ ...p, google_maps_url: v }))} placeholder=\"https://maps.app.goo.gl/...\" /></Field>"
);

rep(
  "          <Field label=\"物件名\"><TextInput value={propertyEditForm.property_name} onChange={(v) => setPropertyEditForm((p) => ({ ...p, property_name: v }))} /></Field>",
  "          <Field label=\"物件名\"><TextInput value={propertyEditForm.property_name} onChange={(v) => setPropertyEditForm((p) => ({ ...p, property_name: v }))} /></Field>\n          <Field label=\"住所\"><TextInput value={propertyEditForm.address} onChange={(v) => setPropertyEditForm((p) => ({ ...p, address: v }))} /></Field>\n          <Field label=\"Google Mapsリンク\"><TextInput type=\"url\" value={propertyEditForm.google_maps_url} onChange={(v) => setPropertyEditForm((p) => ({ ...p, google_maps_url: v }))} placeholder=\"https://maps.app.goo.gl/...\" /></Field>"
);

fs.writeFileSync(file, text);
console.log("patched property address fields");
