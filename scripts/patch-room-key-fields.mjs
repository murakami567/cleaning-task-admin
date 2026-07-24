import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

function rep(from, to) {
  if (!text.includes(from)) return;
  text = text.replace(from, to);
}

if (!text.includes("keybox_number?: string | null;")) {
  rep(
    "  prep_ta?: number | null;\n};",
    "  prep_ta?: number | null;\n  keybox_number?: string | null;\n  spare_key_number?: string | null;\n  note?: string | null;\n};"
  );
}

if (!text.includes('keybox_number: "",')) {
  rep(
    '    prep_ta: "0",\n  });',
    '    prep_ta: "0",\n    keybox_number: "",\n    spare_key_number: "",\n    note: "",\n  });'
  );

  rep(
    '    room_sort_order: "999",\n  });',
    '    room_sort_order: "999",\n    keybox_number: "",\n    spare_key_number: "",\n    note: "",\n  });'
  );
}

rep(
  '          is_active: true,\n        }),',
  '          is_active: true,\n          keybox_number: roomForm.keybox_number.trim(),\n          spare_key_number: roomForm.spare_key_number.trim(),\n          note: roomForm.note.trim(),\n        }),'
);

rep(
  '      setRoomForm({ property_id: "", room_name: "", room_code: "", capacity: "1", room_sort_order: "999" });',
  '      setRoomForm({ property_id: "", room_name: "", room_code: "", capacity: "1", room_sort_order: "999", keybox_number: "", spare_key_number: "", note: "" });'
);

rep(
  '      prep_ta: String(room.prep_ta ?? 0),\n    });',
  '      prep_ta: String(room.prep_ta ?? 0),\n      keybox_number: room.keybox_number ?? "",\n      spare_key_number: room.spare_key_number ?? "",\n      note: room.note ?? "",\n    });'
);

rep(
  '          prep_ta: Number(roomEditForm.prep_ta || 0),\n        }),',
  '          prep_ta: Number(roomEditForm.prep_ta || 0),\n          keybox_number: roomEditForm.keybox_number.trim(),\n          spare_key_number: roomEditForm.spare_key_number.trim(),\n          note: roomEditForm.note.trim(),\n        }),'
);

rep(
  '        return `${r.room_name} ${r.room_code ?? ""} ${r.room_key}`.toLowerCase().includes(q);',
  '        return `${r.room_name} ${r.room_code ?? ""} ${r.room_key} ${r.keybox_number ?? ""} ${r.spare_key_number ?? ""} ${r.note ?? ""}`.toLowerCase().includes(q);'
);

rep(
  '<TextInput value={roomSearch} onChange={setRoomSearch} placeholder="部屋名・部屋コード・room_keyで検索" />',
  '<TextInput value={roomSearch} onChange={setRoomSearch} placeholder="部屋名・コード・キーボックス・スペア・備考で検索" />'
);

rep(
  '                          <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">定員</th>',
  '                          <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">キーボックス番号</th>\n                          <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">スペア番号</th>\n                          <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">備考</th>\n                          <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">定員</th>'
);

rep(
  '                            <td className="border-b px-4 py-3">{r.room_key}</td>\n                            <td className="border-b px-4 py-3">{r.capacity ?? ""}</td>',
  '                            <td className="border-b px-4 py-3">{r.room_key}</td>\n                            <td className="border-b px-4 py-3">{r.keybox_number ?? ""}</td>\n                            <td className="border-b px-4 py-3">{r.spare_key_number ?? ""}</td>\n                            <td className="border-b px-4 py-3 max-w-[260px] whitespace-pre-wrap">{r.note ?? ""}</td>\n                            <td className="border-b px-4 py-3">{r.capacity ?? ""}</td>'
);

rep(
  '<tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">表示できる部屋がありません。</td></tr>',
  '<tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">表示できる部屋がありません。</td></tr>'
);

rep(
  '              <Field label="並び順"><TextInput type="number" value={roomForm.room_sort_order} onChange={(v) => setRoomForm((p) => ({ ...p, room_sort_order: v }))} placeholder="999" /></Field>',
  '              <Field label="並び順"><TextInput type="number" value={roomForm.room_sort_order} onChange={(v) => setRoomForm((p) => ({ ...p, room_sort_order: v }))} placeholder="999" /></Field>\n              <Field label="キーボックス番号"><TextInput value={roomForm.keybox_number} onChange={(v) => setRoomForm((p) => ({ ...p, keybox_number: v }))} /></Field>\n              <Field label="スペア番号"><TextInput value={roomForm.spare_key_number} onChange={(v) => setRoomForm((p) => ({ ...p, spare_key_number: v }))} /></Field>\n              <Field label="備考"><textarea rows={4} value={roomForm.note} onChange={(e) => setRoomForm((p) => ({ ...p, note: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" /></Field>'
);

rep(
  '          <Field label="並び順"><TextInput type="number" value={roomEditForm.room_sort_order} onChange={(v) => setRoomEditForm((p) => ({ ...p, room_sort_order: v }))} /></Field>',
  '          <Field label="並び順"><TextInput type="number" value={roomEditForm.room_sort_order} onChange={(v) => setRoomEditForm((p) => ({ ...p, room_sort_order: v }))} /></Field>\n          <Field label="キーボックス番号"><TextInput value={roomEditForm.keybox_number} onChange={(v) => setRoomEditForm((p) => ({ ...p, keybox_number: v }))} /></Field>\n          <Field label="スペア番号"><TextInput value={roomEditForm.spare_key_number} onChange={(v) => setRoomEditForm((p) => ({ ...p, spare_key_number: v }))} /></Field>\n          <Field label="備考"><textarea rows={4} value={roomEditForm.note} onChange={(e) => setRoomEditForm((p) => ({ ...p, note: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" /></Field>'
);

// Migrate previously patched field names to the actual database/API column names.
text = text
  .replaceAll("spare_number", "spare_key_number")
  .replaceAll("room_note", "note");

fs.writeFileSync(file, text);
console.log("patched room key fields");
