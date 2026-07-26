import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

function replaceOnce(from, to) {
  if (text.includes(to)) return;
  if (!text.includes(from)) {
    console.warn(`patch skipped: ${from.slice(0, 80)}`);
    return;
  }
  text = text.replace(from, to);
}

replaceOnce(
  "  task_color?: string | null;\n};",
  "  task_color?: string | null;\n  address?: string | null;\n  google_maps_url?: string | null;\n  entrance_number?: string | null;\n};"
);

replaceOnce(
  "  prep_ta?: number | null;\n};",
  "  prep_ta?: number | null;\n  keybox_number?: string | null;\n  spare_key_number?: string | null;\n  mailbox_number?: string | null;\n  wifi_ssid?: string | null;\n  wifi_password?: string | null;\n  note?: string | null;\n};"
);

replaceOnce(
  "    task_color: DEFAULT_TASK_COLOR,\n  });\n\n  const [roomEditForm",
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n    entrance_number: \"\",\n  });\n\n  const [roomEditForm"
);

replaceOnce(
  "    prep_ta: \"0\",\n  });\n\n  const [propertySearch",
  "    prep_ta: \"0\",\n    keybox_number: \"\",\n    spare_key_number: \"\",\n    mailbox_number: \"\",\n    wifi_ssid: \"\",\n    wifi_password: \"\",\n    note: \"\",\n  });\n\n  const [propertySearch"
);

replaceOnce(
  "    task_color: DEFAULT_TASK_COLOR,\n  });\n\n  const [roomForm",
  "    task_color: DEFAULT_TASK_COLOR,\n    address: \"\",\n    google_maps_url: \"\",\n    entrance_number: \"\",\n  });\n\n  const [roomForm"
);

replaceOnce(
  "    room_sort_order: \"999\",\n  });\n\n  const [mainTab",
  "    room_sort_order: \"999\",\n    keybox_number: \"\",\n    spare_key_number: \"\",\n    mailbox_number: \"\",\n    wifi_ssid: \"\",\n    wifi_password: \"\",\n    note: \"\",\n  });\n\n  const [mainTab"
);

replaceOnce(
  '        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? ""}`.toLowerCase().includes(q);',
  '        return `${p.property_name} ${p.property_code} ${p.normalized_name ?? ""} ${p.address ?? ""} ${p.entrance_number ?? ""}`.toLowerCase().includes(q);'
);

replaceOnce(
  '        return `${r.room_name} ${r.room_code ?? ""} ${r.room_key}`.toLowerCase().includes(q);',
  '        return `${r.room_name} ${r.room_code ?? ""} ${r.room_key} ${r.keybox_number ?? ""} ${r.spare_key_number ?? ""} ${r.mailbox_number ?? ""} ${r.wifi_ssid ?? ""} ${r.wifi_password ?? ""} ${r.note ?? ""}`.toLowerCase().includes(q);'
);

replaceOnce(
  "    task_color: string;\n    is_active?: boolean;",
  "    task_color: string;\n    address: string;\n    google_maps_url: string;\n    entrance_number: string;\n    is_active?: boolean;"
);

replaceOnce(
  "    task_color: normalizeColor(form.task_color),\n    is_active: form.is_active ?? true,",
  "    task_color: normalizeColor(form.task_color),\n    address: form.address.trim(),\n    google_maps_url: form.google_maps_url.trim(),\n    entrance_number: form.entrance_number.trim(),\n    is_active: form.is_active ?? true,"
);

replaceOnce(
  "        task_color: DEFAULT_TASK_COLOR,\n        sort_order: \"999\",",
  "        task_color: DEFAULT_TASK_COLOR,\n        address: \"\",\n        google_maps_url: \"\",\n        entrance_number: \"\",\n        sort_order: \"999\","
);

replaceOnce(
  "      task_color: normalizeColor(property.task_color),\n      is_active: property.is_active,",
  "      task_color: normalizeColor(property.task_color),\n      address: property.address ?? \"\",\n      google_maps_url: property.google_maps_url ?? \"\",\n      entrance_number: property.entrance_number ?? \"\",\n      is_active: property.is_active,"
);

replaceOnce(
  "          room_sort_order: Number(roomForm.room_sort_order || 999),\n          is_active: true,",
  "          room_sort_order: Number(roomForm.room_sort_order || 999),\n          is_active: true,\n          keybox_number: roomForm.keybox_number.trim(),\n          spare_key_number: roomForm.spare_key_number.trim(),\n          mailbox_number: roomForm.mailbox_number.trim(),\n          wifi_ssid: roomForm.wifi_ssid.trim(),\n          wifi_password: roomForm.wifi_password.trim(),\n          note: roomForm.note.trim(),"
);

replaceOnce(
  '      setRoomForm({ property_id: "", room_name: "", room_code: "", capacity: "1", room_sort_order: "999" });',
  '      setRoomForm({ property_id: "", room_name: "", room_code: "", capacity: "1", room_sort_order: "999", keybox_number: "", spare_key_number: "", mailbox_number: "", wifi_ssid: "", wifi_password: "", note: "" });'
);

replaceOnce(
  "      prep_ta: String(room.prep_ta ?? 0),\n    });",
  "      prep_ta: String(room.prep_ta ?? 0),\n      keybox_number: room.keybox_number ?? \"\",\n      spare_key_number: room.spare_key_number ?? \"\",\n      mailbox_number: room.mailbox_number ?? \"\",\n      wifi_ssid: room.wifi_ssid ?? \"\",\n      wifi_password: room.wifi_password ?? \"\",\n      note: room.note ?? \"\",\n    });"
);

replaceOnce(
  "          prep_ta: Number(roomEditForm.prep_ta || 0),\n        }),",
  "          prep_ta: Number(roomEditForm.prep_ta || 0),\n          keybox_number: roomEditForm.keybox_number.trim(),\n          spare_key_number: roomEditForm.spare_key_number.trim(),\n          mailbox_number: roomEditForm.mailbox_number.trim(),\n          wifi_ssid: roomEditForm.wifi_ssid.trim(),\n          wifi_password: roomEditForm.wifi_password.trim(),\n          note: roomEditForm.note.trim(),\n        }),"
);

replaceOnce(
  '          <Field label="タスク表示カラー"><ColorField value={propertyForm.task_color} onChange={(v) => setPropertyForm((p) => ({ ...p, task_color: v }))} /></Field>',
  '          <Field label="タスク表示カラー"><ColorField value={propertyForm.task_color} onChange={(v) => setPropertyForm((p) => ({ ...p, task_color: v }))} /></Field>\n          <Field label="住所"><TextInput value={propertyForm.address} onChange={(v) => setPropertyForm((p) => ({ ...p, address: v }))} placeholder="住所を入力" /></Field>\n          <Field label="Google Mapsリンク"><TextInput type="url" value={propertyForm.google_maps_url} onChange={(v) => setPropertyForm((p) => ({ ...p, google_maps_url: v }))} placeholder="https://maps.app.goo.gl/..." /></Field>\n          <Field label="エントランス番号"><TextInput value={propertyForm.entrance_number} onChange={(v) => setPropertyForm((p) => ({ ...p, entrance_number: v }))} placeholder="例）1234#" /></Field>'
);

replaceOnce(
  '          <Field label="タスク表示カラー"><ColorField value={propertyEditForm.task_color} onChange={(v) => setPropertyEditForm((p) => ({ ...p, task_color: v }))} /></Field>',
  '          <Field label="タスク表示カラー"><ColorField value={propertyEditForm.task_color} onChange={(v) => setPropertyEditForm((p) => ({ ...p, task_color: v }))} /></Field>\n          <Field label="住所"><TextInput value={propertyEditForm.address} onChange={(v) => setPropertyEditForm((p) => ({ ...p, address: v }))} placeholder="住所を入力" /></Field>\n          <Field label="Google Mapsリンク"><TextInput type="url" value={propertyEditForm.google_maps_url} onChange={(v) => setPropertyEditForm((p) => ({ ...p, google_maps_url: v }))} placeholder="https://maps.app.goo.gl/..." /></Field>\n          <Field label="エントランス番号"><TextInput value={propertyEditForm.entrance_number} onChange={(v) => setPropertyEditForm((p) => ({ ...p, entrance_number: v }))} placeholder="例）1234#" /></Field>'
);

replaceOnce(
  '              <Field label="並び順"><TextInput type="number" value={roomForm.room_sort_order} onChange={(v) => setRoomForm((p) => ({ ...p, room_sort_order: v }))} placeholder="999" /></Field>',
  '              <Field label="並び順"><TextInput type="number" value={roomForm.room_sort_order} onChange={(v) => setRoomForm((p) => ({ ...p, room_sort_order: v }))} placeholder="999" /></Field>\n              <Field label="キーボックス番号"><TextInput value={roomForm.keybox_number} onChange={(v) => setRoomForm((p) => ({ ...p, keybox_number: v }))} /></Field>\n              <Field label="スペア番号"><TextInput value={roomForm.spare_key_number} onChange={(v) => setRoomForm((p) => ({ ...p, spare_key_number: v }))} /></Field>\n              <Field label="ポスト番号"><TextInput value={roomForm.mailbox_number} onChange={(v) => setRoomForm((p) => ({ ...p, mailbox_number: v }))} /></Field>\n              <Field label="Wi-Fi SSID"><TextInput value={roomForm.wifi_ssid} onChange={(v) => setRoomForm((p) => ({ ...p, wifi_ssid: v }))} /></Field>\n              <Field label="Wi-Fiパスワード"><TextInput value={roomForm.wifi_password} onChange={(v) => setRoomForm((p) => ({ ...p, wifi_password: v }))} /></Field>\n              <Field label="備考"><textarea rows={4} value={roomForm.note} onChange={(e) => setRoomForm((p) => ({ ...p, note: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" /></Field>'
);

replaceOnce(
  '          <Field label="並び順"><TextInput type="number" value={roomEditForm.room_sort_order} onChange={(v) => setRoomEditForm((p) => ({ ...p, room_sort_order: v }))} /></Field>',
  '          <Field label="並び順"><TextInput type="number" value={roomEditForm.room_sort_order} onChange={(v) => setRoomEditForm((p) => ({ ...p, room_sort_order: v }))} /></Field>\n          <Field label="キーボックス番号"><TextInput value={roomEditForm.keybox_number} onChange={(v) => setRoomEditForm((p) => ({ ...p, keybox_number: v }))} /></Field>\n          <Field label="スペア番号"><TextInput value={roomEditForm.spare_key_number} onChange={(v) => setRoomEditForm((p) => ({ ...p, spare_key_number: v }))} /></Field>\n          <Field label="ポスト番号"><TextInput value={roomEditForm.mailbox_number} onChange={(v) => setRoomEditForm((p) => ({ ...p, mailbox_number: v }))} /></Field>\n          <Field label="Wi-Fi SSID"><TextInput value={roomEditForm.wifi_ssid} onChange={(v) => setRoomEditForm((p) => ({ ...p, wifi_ssid: v }))} /></Field>\n          <Field label="Wi-Fiパスワード"><TextInput value={roomEditForm.wifi_password} onChange={(v) => setRoomEditForm((p) => ({ ...p, wifi_password: v }))} /></Field>\n          <Field label="備考"><textarea rows={4} value={roomEditForm.note} onChange={(e) => setRoomEditForm((p) => ({ ...p, note: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" /></Field>'
);

replaceOnce(
  '               <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">状態</div><div className="mt-1 text-sm font-bold">{viewingRoom.is_active ? "有効" : "無効"}</div></div>',
  '               <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">状態</div><div className="mt-1 text-sm font-bold">{viewingRoom.is_active ? "有効" : "無効"}</div></div>\n               <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">キーボックス番号</div><div className="mt-1 text-sm font-bold">{viewingRoom.keybox_number || "-"}</div></div>\n               <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">スペア番号</div><div className="mt-1 text-sm font-bold">{viewingRoom.spare_key_number || "-"}</div></div>\n               <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">ポスト番号</div><div className="mt-1 text-sm font-bold">{viewingRoom.mailbox_number || "-"}</div></div>\n               <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">Wi-Fi SSID</div><div className="mt-1 break-all text-sm font-bold">{viewingRoom.wifi_ssid || "-"}</div></div>\n               <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2"><div className="text-xs font-semibold text-slate-500">Wi-Fiパスワード</div><div className="mt-1 break-all text-sm font-bold">{viewingRoom.wifi_password || "-"}</div></div>\n               <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2"><div className="text-xs font-semibold text-slate-500">備考</div><div className="mt-1 whitespace-pre-wrap text-sm font-bold">{viewingRoom.note || "-"}</div></div>'
);

fs.writeFileSync(file, text);
console.log("patched room access and property location fields");
