import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

text = text.replace(
  'className="fixed inset-0 z-[999] flex justify-end bg-black/40"',
  'className="fixed inset-0 z-[999] flex justify-end overflow-y-auto bg-black/40"'
);

text = text.replace(
  'className="h-full w-[520px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col"',
  'className="min-h-full w-[520px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col"'
);

text = text.replace(
  'className="p-4 overflow-auto flex-1"',
  'className="p-4 overflow-y-auto overscroll-contain flex-1"'
);

text = text.replace(
  'className="min-h-screen bg-slate-50 px-3 py-4 md:p-6"',
  'className="min-h-screen overflow-visible bg-slate-50 px-3 py-4 md:p-6"'
);

fs.writeFileSync(file, text);
console.log("patched property page scrolling");
