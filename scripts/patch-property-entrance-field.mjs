import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  if (!text.includes(from)) {
    throw new Error(`patch target not found: ${label}`);
  }
  text = text.replace(from, to);
}

if (!text.includes("entrance_number?: string | null;")) {
  replaceOnce(
    "  task_color?: string | null;\n};",
    "  task_color?: string | null;\n  address?: string | null;\n  google_maps_url?: string | null;\n  entrance_number?: string | null;\n};",
    "PropertyMaster"
  );
}

for (const marker of [
  '    task_color: DEFAULT_TASK_COLOR,\n  });',
  '    task_color: DEFAULT_TASK_COLOR,\n  });\n\n  const [roomForm',
]) {
  if (text.includes(marker)) {
    text = text.replace(
      marker,
      marker.replace('    task_color: DEFAULT_TASK_COLOR,', '    task_color: DEFAULT_TASK_COLOR,\n    address: "",\n    google_maps_url: "",\n    entrance_number: "",')
    );
  }
}

if (!text.includes("entrance_number: string;")) {
  replaceOnce(
    "    task_color: string;\n    is_active?: boolean;",
    "    task_color: string;\n    address: string;\n    google_maps_url: string;\n    entrance_number: string;\n    is_active?: boolean;",
    "propertyPayload type"
  );
}

if (!text.includes("entrance_number: form.entrance_number.trim(),")) {
  replaceOnce(
    "    task_color: normalizeColor(form.task_color),\n    is_active: form.is_active ?? true,",
    "    task_color: normalizeColor(form.task_color),\n    address: form.address.trim(),\n    google_maps_url: form.google_maps_url.trim(),\n    entrance_number: form.entrance_number.trim(),\n    is_active: form.is_active ?? true,",
    "property payload"
  );
}

if (!text.includes('entrance_number: "",\n        sort_order: "999",')) {
  replaceOnce(
    '        task_color: DEFAULT_TASK_COLOR,\n        sort_order: "999",',
    '        task_color: DEFAULT_TASK_COLOR,\n        address: "",\n        google_maps_url: "",\n        entrance_number: "",\n        sort_order: "999",',
    "property form reset"
  );
}

if (!text.includes('entrance_number: property.entrance_number ?? "",')) {
  replaceOnce(
    "      task_color: normalizeColor(property.task_color),\n      is_active: property.is_active,",
    "      task_color: normalizeColor(property.task_color),\n      address: property.address ?? \"\",\n      google_maps_url: property.google_maps_url ?? \"\",\n      entrance_number: property.entrance_number ?? \"\",\n      is_active: property.is_active,",
    "edit form hydration"
  );
}

if (!text.includes('placeholder="例）1234#"')) {
  const addField = '          <Field label="物件名"><TextInput value={propertyForm.property_name} onChange={(v) => setPropertyForm((p) => ({ ...p, property_name: v }))} placeholder="例）アトラス" /></Field>';
  replaceOnce(
    addField,
    `${addField}\n          <Field label="住所"><TextInput value={propertyForm.address} onChange={(v) => setPropertyForm((p) => ({ ...p, address: v }))} placeholder="例）福岡市博多区住吉..." /></Field>\n          <Field label="Google Mapsリンク"><TextInput type="url" value={propertyForm.google_maps_url} onChange={(v) => setPropertyForm((p) => ({ ...p, google_maps_url: v }))} placeholder="https://maps.app.goo.gl/..." /></Field>\n          <Field label="エントランス番号"><TextInput value={propertyForm.entrance_number} onChange={(v) => setPropertyForm((p) => ({ ...p, entrance_number: v }))} placeholder="例）1234#" /></Field>`,
    "create form fields"
  );
}

if (!text.includes('value={propertyEditForm.entrance_number}')) {
  const editField = '          <Field label="物件名"><TextInput value={propertyEditForm.property_name} onChange={(v) => setPropertyEditForm((p) => ({ ...p, property_name: v }))} /></Field>';
  replaceOnce(
    editField,
    `${editField}\n          <Field label="住所"><TextInput value={propertyEditForm.address} onChange={(v) => setPropertyEditForm((p) => ({ ...p, address: v }))} /></Field>\n          <Field label="Google Mapsリンク"><TextInput type="url" value={propertyEditForm.google_maps_url} onChange={(v) => setPropertyEditForm((p) => ({ ...p, google_maps_url: v }))} placeholder="https://maps.app.goo.gl/..." /></Field>\n          <Field label="エントランス番号"><TextInput value={propertyEditForm.entrance_number} onChange={(v) => setPropertyEditForm((p) => ({ ...p, entrance_number: v }))} placeholder="例）1234#" /></Field>`,
    "edit form fields"
  );
}

if (!text.includes("エントランス番号：{p.entrance_number}")) {
  const countBlock = '                            <div className={`mt-1 text-xs ${selected ? "text-white/70" : "text-slate-500"}`}>\n                              {roomCount} 室 / 最大対応可能 {p.max_assignable_count ?? "制限なし"} / 物件点数 {p.cleaning_point ?? 60}pt\n                            </div>';
  replaceOnce(
    countBlock,
    `                            {p.entrance_number ? (\n                              <div className={\`mt-1 text-xs font-semibold \${selected ? "text-white/80" : "text-slate-600"}\`}>エントランス番号：{p.entrance_number}</div>\n                            ) : null}\n${countBlock}`,
    "property list display"
  );
}

fs.writeFileSync(file, text);
console.log("patched property entrance field");
