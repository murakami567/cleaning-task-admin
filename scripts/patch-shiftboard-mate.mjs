import fs from "node:fs";

const file = "src/ShiftBoardPage.tsx";
let src = fs.readFileSync(file, "utf8");

if (!src.includes('import MateCartePage from "./MateCartePage";')) {
  src = src.replace(
    'import AccountManagementPage from "./AccountManagementPage";',
    'import AccountManagementPage from "./AccountManagementPage";\nimport MateCartePage from "./MateCartePage";'
  );
}

const from = `{mainTab === "mate" && (
          <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm p-6">
            <div className="text-[18px] font-extrabold">メイトカルテ</div>
            <div className="mt-2 text-sm text-slate-500">次段階で追加します。</div>
          </div>
        )}`;

const to = `{mainTab === "mate" && <MateCartePage />}`;

if (!src.includes(to)) {
  if (!src.includes(from)) {
    throw new Error("mate placeholder not found");
  }
  src = src.replace(from, to);
}

fs.writeFileSync(file, src);
console.log("patched ShiftBoardPage mate tab");
