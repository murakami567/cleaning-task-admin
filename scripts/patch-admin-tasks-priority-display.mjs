import fs from "node:fs";

const file = "src/AdminTasksPagePreview.tsx";
let src = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  if (src.includes(to)) return;
  if (!src.includes(from)) {
    throw new Error(`patch target not found: ${label}`);
  }
  src = src.replace(from, to);
}

replaceOnce(
  [
    "type Attendee = {",
    "  userId: string;",
    "  name: string;",
    "  availablePropertyIds: string[];",
    "};",
  ].join("\n"),
  [
    "type Attendee = {",
    "  userId: string;",
    "  name: string;",
    "  availablePropertyIds: string[];",
    "  uncheckedPropertyIds: string[];",
    '  propertyMatchKind?: "priority" | "normal" | "other";',
    "};",
  ].join("\n"),
  "Attendee type"
);

replaceOnce(
  [
    "      availablePropertyIds: Array.isArray(e.staff_members?.available_property_ids)",
    "        ? e.staff_members.available_property_ids",
    "        : [],",
    "    }));",
  ].join("\n"),
  [
    "      availablePropertyIds: Array.isArray(e.staff_members?.available_property_ids)",
    "        ? e.staff_members.available_property_ids",
    "        : [],",
    "      uncheckedPropertyIds: Array.isArray(e.staff_members?.unchecked_property_ids)",
    "        ? e.staff_members.unchecked_property_ids",
    "        : [],",
    "    }));",
  ].join("\n"),
  "fetchAvailableStaffByDate mapping"
);

replaceOnce(
  [
    "  // 「シフトが出勤」かつ「アカウントの対応可能物件にその物件が含まれる」者だけに絞る。",
    "  // 物件マスタに該当が無い場合 (property_id が引けない) は安全側で全員許可する。",
    "  const filterAttendeesForProperty = (",
    "    attendees: Attendee[],",
    "    propertyName: string | undefined | null",
    "  ): Attendee[] => {",
    "    if (!propertyName) return attendees;",
    "    const propertyId = propertyNameToId.get(propertyName);",
    "    if (!propertyId) return attendees;",
    "    return attendees.filter((u) => u.availablePropertyIds.includes(propertyId));",
    "  };",
  ].join("\n"),
  [
    "  // 担当者を物件対応設定に応じて2枠に分けて表示する。",
    "  // チェック解除済みを先に、対応可能を次に表示し、その他は表示しない。",
    "  const filterAttendeesForProperty = (",
    "    attendees: Attendee[],",
    "    propertyName: string | undefined | null",
    "  ): Attendee[] => {",
    '    const propertyId = propertyName ? propertyNameToId.get(propertyName) : "";',
    "",
    "    return attendees",
    "      .map((u) => {",
    "        const isPriority = !!propertyId && u.uncheckedPropertyIds.includes(propertyId);",
    "        const isNormal = !!propertyId && u.availablePropertyIds.includes(propertyId);",
    '        const propertyMatchKind: Attendee["propertyMatchKind"] = isPriority',
    '          ? "priority"',
    "          : isNormal",
    '          ? "normal"',
    '          : "other";',
    "        return { ...u, propertyMatchKind };",
    "      })",
    '      .filter((u) => u.propertyMatchKind !== "other")',
    "      .sort((a, b) => {",
    "        const rank = { priority: 0, normal: 1, other: 2 } as const;",
    '        const ar = rank[a.propertyMatchKind ?? "other"];',
    '        const br = rank[b.propertyMatchKind ?? "other"];',
    "        if (ar !== br) return ar - br;",
    '        return a.name.localeCompare(b.name, "ja");',
    "      });",
    "  };",
  ].join("\n"),
  "filterAttendeesForProperty"
);

replaceOnce(
  [
    "        attendees.map((u) => (",
    '          <label key={u.userId} className="flex items-center gap-2 text-sm">',
    "            <input",
    '              type="checkbox"',
    "              checked={selected.includes(u.userId)}",
    "              onChange={() => toggle(u.userId)}",
    "            />",
    "            <span>{u.name}</span>",
    "          </label>",
    "        ))",
  ].join("\n"),
  [
    '        <div className="space-y-3">',
    "          {[",
    "            {",
    '              key: "priority" as const,',
    '              title: "チェック解除済み",',
    '              frameClass: "border-red-200 bg-red-50/40",',
    '              headerClass: "border-red-200 bg-red-50 text-red-900",',
    "            },",
    "            {",
    '              key: "normal" as const,',
    '              title: "対応可能",',
    '              frameClass: "border-sky-200 bg-sky-50/30",',
    '              headerClass: "border-sky-200 bg-sky-50 text-sky-900",',
    "            },",
    "          ].map((group) => {",
    "            const members = attendees.filter(",
    "              (u) => u.propertyMatchKind === group.key",
    "            );",
    "",
    "            return (",
    "              <section",
    "                key={group.key}",
    "                className={[",
    '                  "overflow-hidden rounded-lg border",',
    "                  group.frameClass,",
    '                ].join(" ")}',
    "              >",
    "                <div",
    "                  className={[",
    '                    "border-b px-3 py-2 text-xs font-semibold",',
    "                    group.headerClass,",
    '                  ].join(" ")}',
    "                >",
    "                  {group.title}",
    "                </div>",
    '                <div className="space-y-1 bg-white p-2">',
    "                  {members.length === 0 ? (",
    '                    <div className="px-1 py-2 text-xs text-black/40">',
    "                      該当者なし",
    "                    </div>",
    "                  ) : (",
    "                    members.map((u) => (",
    "                      <label",
    "                        key={u.userId}",
    '                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-black/5"',
    "                      >",
    "                        <input",
    '                          type="checkbox"',
    "                          checked={selected.includes(u.userId)}",
    "                          onChange={() => toggle(u.userId)}",
    "                        />",
    '                        <span className="truncate">{u.name}</span>',
    "                      </label>",
    "                    ))",
    "                  )}",
    "                </div>",
    "              </section>",
    "            );",
    "          })}",
    "        </div>",
  ].join("\n"),
  "MultiAssignSelect grouped sections"
);

fs.writeFileSync(file, src);
console.log("patched cleaning task assignee grouped priority display");
