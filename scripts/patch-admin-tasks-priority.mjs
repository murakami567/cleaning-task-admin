import fs from "node:fs";

const file = "src/AdminTasksPagePreview.tsx";
let src = fs.readFileSync(file, "utf8");

const replaceOnce = (from, to, label) => {
  if (src.includes(to)) return;
  if (!src.includes(from)) {
    throw new Error(`patch target not found: ${label}`);
  }
  src = src.replace(from, to);
};

replaceOnce(
`type Attendee = {
  userId: string;
  name: string;
  availablePropertyIds: string[];
};`,
`type Attendee = {
  userId: string;
  name: string;
  availablePropertyIds: string[];
  uncheckedPropertyIds: string[];
  propertyMatchKind?: "priority" | "normal" | "other";
};`,
"Attendee type"
);

replaceOnce(
`      availablePropertyIds: Array.isArray(e.staff_members?.available_property_ids)
        ? e.staff_members.available_property_ids
        : [],
    }));`,
`      availablePropertyIds: Array.isArray(e.staff_members?.available_property_ids)
        ? e.staff_members.available_property_ids
        : [],
      uncheckedPropertyIds: Array.isArray(e.staff_members?.unchecked_property_ids)
        ? e.staff_members.unchecked_property_ids
        : [],
    }));`,
"fetchAvailableStaffByDate mapping"
);

replaceOnce(
`  // 「シフトが出勤」かつ「アカウントの対応可能物件にその物件が含まれる」者だけに絞る。
  // 物件マスタに該当が無い場合 (property_id が引けない) は安全側で全員許可する。
  const filterAttendeesForProperty = (
    attendees: Attendee[],
    propertyName: string | undefined | null
  ): Attendee[] => {
    if (!propertyName) return attendees;
    const propertyId = propertyNameToId.get(propertyName);
    if (!propertyId) return attendees;
    return attendees.filter((u) => u.availablePropertyIds.includes(propertyId));
  };`,
`  // 担当者を物件対応設定に応じて優先表示する。
  // チェック解除済み物件 = 最優先・薄赤、対応可能物件 = 通常・薄青、その他 = 白。
  // 物件マスタに該当が無い場合は、全員をその他として表示する。
  const filterAttendeesForProperty = (
    attendees: Attendee[],
    propertyName: string | undefined | null
  ): Attendee[] => {
    const propertyId = propertyName ? propertyNameToId.get(propertyName) : "";

    return attendees
      .map((u) => {
        const isPriority = !!propertyId && u.uncheckedPropertyIds.includes(propertyId);
        const isNormal = !!propertyId && u.availablePropertyIds.includes(propertyId);
        const propertyMatchKind: Attendee["propertyMatchKind"] = isPriority
          ? "priority"
          : isNormal
          ? "normal"
          : "other";
        return { ...u, propertyMatchKind };
      })
      .sort((a, b) => {
        const rank = { priority: 0, normal: 1, other: 2 } as const;
        const ar = rank[a.propertyMatchKind ?? "other"];
        const br = rank[b.propertyMatchKind ?? "other"];
        if (ar !== br) return ar - br;
        return a.name.localeCompare(b.name, "ja");
      });
  };`,
"filterAttendeesForProperty"
);

replaceOnce(
`        attendees.map((u) => (
          <label key={u.userId} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(u.userId)}
              onChange={() => toggle(u.userId)}
            />
            <span>{u.name}</span>
          </label>
        ))`,
`        attendees.map((u) => {
          const toneClass =
            u.propertyMatchKind === "priority"
              ? "border-red-200 bg-red-50 text-red-900"
              : u.propertyMatchKind === "normal"
              ? "border-sky-200 bg-sky-50 text-sky-900"
              : "border-slate-100 bg-white text-slate-700";
          const badge =
            u.propertyMatchKind === "priority"
              ? "解除済"
              : u.propertyMatchKind === "normal"
              ? "対応可"
              : "";
          return (
            <label
              key={u.userId}
              className={\`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-sm \${toneClass}\`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(u.userId)}
                  onChange={() => toggle(u.userId)}
                />
                <span className="truncate">{u.name}</span>
              </span>
              {badge ? (
                <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold">
                  {badge}
                </span>
              ) : null}
            </label>
          );
        })`,
"MultiAssignSelect labels"
);

fs.writeFileSync(file, src);
console.log("patched AdminTasksPagePreview priority display");
