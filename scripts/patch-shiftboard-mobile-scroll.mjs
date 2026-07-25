import fs from "node:fs";

const file = "src/ShiftBoardPage.tsx";
let text = fs.readFileSync(file, "utf8");

// スマホではシフト表を横スクロール可能にし、固定列を日付だけに絞る。
text = text.replace(
  '            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">',
  '            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 md:flex-row md:items-start md:justify-between">'
);

text = text.replace(
  '              <div className="flex items-center gap-2 flex-wrap">',
  '              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">'
);

text = text.replace(
  '              <div className="overflow-auto rounded-[18px] border border-slate-200 max-h-[70vh] w-full">',
  '              <div className="w-full max-w-full overflow-x-auto overflow-y-auto rounded-[18px] border border-slate-200 max-h-[70vh] overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">'
);

text = text.replace(
  '                <table className="min-w-full w-max border-separate border-spacing-0 text-sm">',
  '                <table className="w-max min-w-[980px] border-separate border-spacing-0 text-sm md:min-w-full">'
);

const replacements = [
  [
    'className="sticky top-0 left-[72px] z-40 w-[64px] min-w-[64px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]"',
    'className="sticky top-0 z-30 w-[64px] min-w-[64px] bg-slate-50 px-4 py-3 text-left font-extrabold md:left-[72px] md:z-40 md:shadow-[2px_0_0_#e2e8f0]"'
  ],
  [
    'className="sticky top-0 left-[136px] z-40 w-[96px] min-w-[96px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]"',
    'className="sticky top-0 z-30 w-[96px] min-w-[96px] bg-slate-50 px-4 py-3 text-left font-extrabold md:left-[136px] md:z-40 md:shadow-[2px_0_0_#e2e8f0]"'
  ],
  [
    'className="sticky top-0 left-[232px] z-40 w-[96px] min-w-[96px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]"',
    'className="sticky top-0 z-30 w-[96px] min-w-[96px] bg-slate-50 px-4 py-3 text-left font-extrabold md:left-[232px] md:z-40 md:shadow-[2px_0_0_#e2e8f0]"'
  ],
  [
    'className="sticky top-0 left-[328px] z-40 w-[140px] min-w-[140px] bg-slate-50 px-4 py-3 text-left font-extrabold shadow-[2px_0_0_#e2e8f0]"',
    'className="sticky top-0 z-30 w-[140px] min-w-[140px] bg-slate-50 px-4 py-3 text-left font-extrabold md:left-[328px] md:z-40 md:shadow-[2px_0_0_#e2e8f0]"'
  ],
  [
    'className={`sticky left-[72px] z-30 w-[64px] min-w-[64px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}',
    'className={`w-[64px] min-w-[64px] ${stickyBg} px-4 py-3 md:sticky md:left-[72px] md:z-30 md:shadow-[2px_0_0_#e2e8f0]`}'
  ],
  [
    'className={`sticky left-[136px] z-30 w-[96px] min-w-[96px] ${stickyBg} px-4 py-3 font-semibold shadow-[2px_0_0_#e2e8f0]`}',
    'className={`w-[96px] min-w-[96px] ${stickyBg} px-4 py-3 font-semibold md:sticky md:left-[136px] md:z-30 md:shadow-[2px_0_0_#e2e8f0]`}'
  ],
  [
    'className={`sticky left-[232px] z-30 w-[96px] min-w-[96px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}',
    'className={`w-[96px] min-w-[96px] ${stickyBg} px-4 py-3 md:sticky md:left-[232px] md:z-30 md:shadow-[2px_0_0_#e2e8f0]`}'
  ],
  [
    'className={`sticky left-[328px] z-30 w-[140px] min-w-[140px] ${stickyBg} px-4 py-3 shadow-[2px_0_0_#e2e8f0]`}',
    'className={`w-[140px] min-w-[140px] ${stickyBg} px-4 py-3 md:sticky md:left-[328px] md:z-30 md:shadow-[2px_0_0_#e2e8f0]`}'
  ]
];

for (const [from, to] of replacements) {
  text = text.replace(from, to);
}

fs.writeFileSync(file, text);
console.log("patched shift board mobile horizontal scroll");
