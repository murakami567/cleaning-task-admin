import fs from "fs";

const path = "src/ShiftBoardPage.tsx";
let text = fs.readFileSync(path, "utf8");

text = text.replace('import PropertyPrioritySettingsPage from "./PropertyPrioritySettingsPage";\n', "");
text = text.replace(
  'useState<"shift" | "account" | "priority" | "mate">("shift")',
  'useState<"shift" | "account" | "mate">("shift")'
);
text = text.replace(
  '4タブ構成（シフト / アカウント管理 / 優先順位設定 / メイトカルテ）',
  '3タブ構成（シフト / アカウント管理 / メイトカルテ）'
);
text = text.replace(
  `                <TabButton active={mainTab === "priority"} onClick={() => setMainTab("priority")}>
                  優先順位設定
                </TabButton>
`,
  ""
);
text = text.replace(
  `
        {mainTab === "priority" && <PropertyPrioritySettingsPage />}
`,
  ""
);

fs.writeFileSync(path, text);
console.log("removed ShiftBoardPage priority tab");
