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

if (!src.includes(renderBlock)) {
  const target = `        )}
      </div>
    </div>
  );
}`;
  if (!src.includes(target)) throw new Error("worklog editor render target not found");
  src = src.replace(
    target,
    `        )}

${renderBlock}
      </div>
    </div>
  );
}`
  );
}

fs.writeFileSync(file, src);
console.log("patched admin worklog edit and delete UI");
