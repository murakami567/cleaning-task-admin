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
    "  task_color?: string | null;\n  address?: string | null;\n  google_maps_url?: string | null;\n  entrance_number?: string | null;\n};"
  );
} else if (!text.includes("  entrance_number?: string | null;")) {
  rep(
    "  google_maps_url?: string | null;\n};",
    "  google_maps_url?: string | null;\n  entrance_number?: string | null;\n};"
  );
}

rep(
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n  });",
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n    entrance_number: \"\",\n  });"
);

rep(
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n  });\n\n  const [roomForm",
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n    entrance_number: \"\",\n  });\n\n  const [roomForm"
);

rep(
  "    address: string;\n    google_maps_url: string;\n    is_active?: boolean;",
  "    address: string;\n    google_maps_url: string;\n    entrance_number: string;\n    is_active?: boolean;"
);

rep(
  "    address: form.address.trim(),\n    google_maps_url: form.google_maps_url.trim(),\n    is_active: form.is_active ?? true,",
  "    address: form.address.trim(),\n    google_maps_url: form.google_maps_url.trim(),\n    entrance_number: form.entrance_number.trim(),\n    is_active: form.is_active ?? true,"
);

rep(
  "        address: \"\",\n        google_maps_url: \"\",\n        sort_order: \"999\",",
  "        address: \"\",\n        google_maps_url: \"\",\n        entrance_number: \"\",\n        sort_order: \"999\","
);

rep(
  "      address: property.address ?? \"\",\n      google_maps_url: property.google_maps_url ?? \"\",\n      is_active: property.is_active,",
  "      address: property.address ?? \"\",\n      google_maps_url: property.google_maps_url ?? \"\",\n      entrance_number: property.entrance_number ?? \"\",\n      is_active: property.is_active,"
);

rep(
  "        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? \"\"} ${p.address ?? \"\"}`.toLowerCase().includes(q);",
  "        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? \"\"} ${p.address ?? \"\"} ${p.entrance_number ?? \"\"}`.toLowerCase().includes(q);"
);

rep(
  'placeholder="物件名・物件コード・住所で検索"',
  'placeholder="物件名・物件コード・住所・エントランス番号で検索"'
);

rep(
  "                            {p.address ? (\n                              <div className={`mt-1 text-xs ${selected ? \"text-white/70\" : \"text-slate-500\"}`}>{p.address}</div>\n                            ) : null}",
  "                            {p.address ? (\n                              <div className={`mt-1 text-xs ${selected ? \"text-white/70\" : \"text-slate-500\"}`}>{p.address}</div>\n                            ) : null}\n                            {p.entrance_number ? (\n                              <div className={`mt-1 text-xs font-semibold ${selected ? \"text-white/80\" : \"text-slate-600\"}`}>エントランス番号：{p.entrance_number}</div>\n                            ) : null}"
);

rep(
  "          <Field label=\"Google Mapsリンク\"><TextInput type=\"url\" value={propertyForm.google_maps_url} onChange={(v) => setPropertyForm((p) => ({ ...p, google_maps_url: v }))} placeholder=\"https://maps.app.goo.gl/...\" /></Field>",
  "          <Field label=\"Google Mapsリンク\"><TextInput type=\"url\" value={propertyForm.google_maps_url} onChange={(v) => setPropertyForm((p) => ({ ...p, google_maps_url: v }))} placeholder=\"https://maps.app.goo.gl/...\" /></Field>\n          <Field label=\"エントランス番号\"><TextInput value={propertyForm.entrance_number} onChange={(v) => setPropertyForm((p) => ({ ...p, entrance_number: v }))} placeholder=\"例）1234#\" /></Field>"
);

rep(
  "          <Field label=\"Google Mapsリンク\"><TextInput type=\"url\" value={propertyEditForm.google_maps_url} onChange={(v) => setPropertyEditForm((p) => ({ ...p, google_maps_url: v }))} placeholder=\"https://maps.app.goo.gl/...\" /></Field>",
  "          <Field label=\"Google Mapsリンク\"><TextInput type=\"url\" value={propertyEditForm.google_maps_url} onChange={(v) => setPropertyEditForm((p) => ({ ...p, google_maps_url: v }))} placeholder=\"https://maps.app.goo.gl/...\" /></Field>\n          <Field label=\"エントランス番号\"><TextInput value={propertyEditForm.entrance_number} onChange={(v) => setPropertyEditForm((p) => ({ ...p, entrance_number: v }))} placeholder=\"例）1234#\" /></Field>"
);

fs.writeFileSync(file, text);
console.log("patched property address and entrance fields");
