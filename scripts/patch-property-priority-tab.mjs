import fs from "fs";

const path = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

if (!text.includes('import PropertyPrioritySettingsPage from "./PropertyPrioritySettingsPage";')) {
  text = text.replace(
    'import React, { useEffect, useMemo, useState } from "react";\n',
    'import React, { useEffect, useMemo, useState } from "react";\nimport PropertyPrioritySettingsPage from "./PropertyPrioritySettingsPage";\n'
  );
}

text = text.replace(
  'type MainTab = "rooms" | "prep";',
  'type MainTab = "rooms" | "priority" | "prep";'
);

text = text.replace(
  `{mainTab === "rooms"
              ? "物件マスタ・部屋マスタを管理します。"
              : "翌日以降の清掃に対する準備物を確認します。"}`,
  `{mainTab === "rooms"
              ? "物件マスタ・部屋マスタを管理します。"
              : mainTab === "priority"
              ? "スタッフごとの物件優先順位を設定します。"
              : "翌日以降の清掃に対する準備物を確認します。"}`
);

if (!text.includes('mainTab === "priority"')) {
  text = text.replace(
    `        <ChipButton active={mainTab === "rooms"} onClick={() => setMainTab("rooms")}>
          物件・部屋一覧
        </ChipButton>
        <ChipButton active={mainTab === "prep"} onClick={() => setMainTab("prep")}>
          準備物確認
        </ChipButton>`,
    `        <ChipButton active={mainTab === "rooms"} onClick={() => setMainTab("rooms")}>
          物件・部屋一覧
        </ChipButton>
        <ChipButton active={mainTab === "priority"} onClick={() => setMainTab("priority")}>
          優先順位設定
        </ChipButton>
        <ChipButton active={mainTab === "prep"} onClick={() => setMainTab("prep")}>
          準備物確認
        </ChipButton>`
  );
}

if (!text.includes('{mainTab === "priority" ? (')) {
  text = text.replace(
    `      {mainTab === "rooms" ? (
        <>`,
    `      {mainTab === "priority" ? (
        <PropertyPrioritySettingsPage />
      ) : mainTab === "rooms" ? (
        <>`
  );
}

fs.writeFileSync(path, text);
console.log("patched PropertyManagementPage priority tab");
