import fs from "fs";
const path = "src/pages/admin/AdminAutoAssignSettingsPage.tsx";
let text = fs.readFileSync(path, "utf8");

if (!text.includes('PropertyPrioritySettingsPage')) {
  text = text.replace(
    'import React, { useEffect, useMemo, useRef, useState } from "react";\n',
    'import React, { useEffect, useMemo, useRef, useState } from "react";\nimport PropertyPrioritySettingsPage from "../../PropertyPrioritySettingsPage";\n'
  );
}

text = text.replace('type Tab = "properties" | "staffs";', 'type Tab = "properties" | "staffs" | "priority";');

if (!text.includes('setTab("priority")')) {
  text = text.replace(
    '<Button className={tab === "staffs" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("staffs")}>スタッフ上限</Button>',
    '<Button className={tab === "staffs" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("staffs")}>スタッフ上限</Button>\n        <Button className={tab === "priority" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("priority")}>優先順位設定</Button>'
  );
}

// 古いパッチで追加された重複表示を削除し、readOnly対応の1つだけに統一する。
text = text.replace(
  '      {tab === "priority" ? <PropertyPrioritySettingsPage /> : null}\n\n      {tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}',
  '      {tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}'
);
text = text.replace(
  '      {tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}\n\n      {tab === "priority" ? <PropertyPrioritySettingsPage /> : null}',
  '      {tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}'
);
text = text.replace(
  '      {tab === "priority" ? <PropertyPrioritySettingsPage /> : null}\n\n      {tab === "properties" ? (',
  '      {tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}\n\n      {tab === "properties" ? ('
);

if (
  !text.includes('{tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}') &&
  !text.includes('{tab === "priority" ? <PropertyPrioritySettingsPage /> : null}')
) {
  text = text.replace(
    '      {tab === "properties" ? (',
    '      {tab === "priority" ? <PropertyPrioritySettingsPage readOnly={readOnly} /> : null}\n\n      {tab === "properties" ? ('
  );
}

fs.writeFileSync(path, text);
console.log("patched AdminAutoAssignSettingsPage priority tab");
