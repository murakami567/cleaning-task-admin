import fs from "fs";

const path = "src/ShiftBoardPage.tsx";
let text = fs.readFileSync(path, "utf8");

if (!text.includes('import PropertyPrioritySettingsPage from "./PropertyPrioritySettingsPage";')) {
  text = text.replace(
    'import AccountManagementPage from "./AccountManagementPage";\n',
    'import AccountManagementPage from "./AccountManagementPage";\nimport PropertyPrioritySettingsPage from "./PropertyPrioritySettingsPage";\n'
  );
}

text = text.replace(
  'useState<"shift" | "account" | "mate">("shift")',
  'useState<"shift" | "account" | "priority" | "mate">("shift")'
);

text = text.replace(
  '3タブ構成（シフト / アカウント管理 / メイトカルテ）',
  '4タブ構成（シフト / アカウント管理 / 優先順位設定 / メイトカルテ）'
);

if (!text.includes('mainTab === "priority"')) {
  text = text.replace(
    `                <TabButton active={mainTab === "account"} onClick={() => setMainTab("account")}>
                  アカウント管理
                </TabButton>
                <TabButton active={mainTab === "mate"} onClick={() => setMainTab("mate")}>`,
    `                <TabButton active={mainTab === "account"} onClick={() => setMainTab("account")}>
                  アカウント管理
                </TabButton>
                <TabButton active={mainTab === "priority"} onClick={() => setMainTab("priority")}>
                  優先順位設定
                </TabButton>
                <TabButton active={mainTab === "mate"} onClick={() => setMainTab("mate")}>`
  );

  text = text.replace(
    `        {mainTab === "account" && <AccountManagementPage />}

        {mainTab === "mate" && (`,
    `        {mainTab === "account" && <AccountManagementPage />}

        {mainTab === "priority" && <PropertyPrioritySettingsPage />}

        {mainTab === "mate" && (`
  );
}

fs.writeFileSync(path, text);
console.log("patched ShiftBoardPage priority tab");
