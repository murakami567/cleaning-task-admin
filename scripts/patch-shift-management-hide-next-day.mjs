import fs from "fs";

const path = "src/ShiftManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

// フロントから手動の「翌日連絡」を非表示にする。
// 既存API・モーダル実装は裏側に残すが、開く導線だけ削除する。
text = text.replace(
  `\n  const [nextDayModalOpen, setNextDayModalOpen] = useState(false);\n`,
  "\n"
);

text = text.replace(
  `          <Button
            className="border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
            onClick={() => setNextDayModalOpen(true)}
          >
            翌日連絡
          </Button>
`,
  ""
);

text = text.replace(
  `
      {nextDayModalOpen ? (
        <NextDayNotificationModal
          adminToken={adminToken}
          onClose={() => setNextDayModalOpen(false)}
        />
      ) : null}
`,
  ""
);

fs.writeFileSync(path, text);
console.log("hidden next day notification button on ShiftManagementPage");
