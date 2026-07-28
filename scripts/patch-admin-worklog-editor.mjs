import fs from "node:fs";

const file = "src/pages/admin/AdminWorklogReportPage.tsx";
let src = fs.readFileSync(file, "utf8");

const importLine = 'import AdminWorklogEditor from "./AdminWorklogEditor";';
if (!src.includes(importLine)) {
  const target = 'import { useEffect, useMemo, useState } from "react";';
  if (!src.includes(target)) throw new Error("worklog editor import target not found");
  src = src.replace(target, `${target}\n${importLine}`);
}

const renderBlock = `        <AdminWorklogEditor
          selectedDate={selectedDate}
          onChanged={() => void loadWorklogs(selectedDate)}
        />`;

// 旧パッチでページ末尾に追加された別一覧があれば先に除去する。
src = src.replace(`\n\n${renderBlock}`, "");

// 既存の実働報告一覧そのものを、編集・削除可能な一覧へ置き換える。
// 集計カードや検索条件は残し、一覧を上下に分けない。
if (!src.includes(renderBlock)) {
  const startMarker = "        {loading ? (";
  const endMarker = "\n      </div>\n    </div>\n  );\n}";
  const start = src.indexOf(startMarker);
  const end = src.lastIndexOf(endMarker);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("worklog list replacement target not found");
  }

  src = src.slice(0, start) + renderBlock + src.slice(end);
}

fs.writeFileSync(file, src);
console.log("patched admin worklog inline edit and delete UI");
