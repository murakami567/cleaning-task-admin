import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

text = text.replace(
  '    <div className="min-h-screen bg-slate-50 p-6">',
  '    <div className="min-h-screen bg-slate-50 p-6 xl:h-screen xl:overflow-hidden">'
);

text = text.replace(
  '          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">',
  '          <div className="grid grid-cols-1 gap-4 xl:h-[calc(100vh-190px)] xl:min-h-0 xl:grid-cols-[420px_minmax(0,1fr)]">'
);

text = text.replace(
  '            <Card>\n              <CardBody>\n                <div className="mb-4 flex items-center justify-between gap-3">',
  '            <div className="xl:min-h-0">\n            <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-slate-200 bg-white shadow-sm">\n              <div className="flex min-h-0 flex-1 flex-col p-4">\n                <div className="mb-4 flex shrink-0 items-center justify-between gap-3">'
);

text = text.replace(
  '                <div className="mb-4">\n                  <TextInput value={propertySearch}',
  '                <div className="mb-4 shrink-0">\n                  <TextInput value={propertySearch}'
);

text = text.replace(
  '                <div className="space-y-2">\n                  {filteredProperties.map((p) => {',
  '                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">\n                  {filteredProperties.map((p) => {'
);

text = text.replace(
  '                </div>\n              </CardBody>\n            </Card>\n\n            <Card>\n              <CardBody>\n                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">',
  '                </div>\n              </div>\n            </div>\n            </div>\n\n            <div className="xl:min-h-0">\n            <div className="flex h-full min-h-0 flex-col rounded-[24px] border border-slate-200 bg-white shadow-sm">\n              <div className="flex min-h-0 flex-1 flex-col p-4">\n                <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">'
);

text = text.replace(
  '                  <div className="overflow-auto rounded-2xl border border-slate-200">',
  '                  <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-2xl border border-slate-200">'
);

text = text.replace(
  '                      <thead>',
  '                      <thead className="sticky top-0 z-10 bg-slate-50">'
);

text = text.replace(
  '                )}\n              </CardBody>\n            </Card>\n          </div>',
  '                )}\n              </div>\n            </div>\n            </div>\n          </div>'
);

fs.writeFileSync(file, text);
console.log("patched independent property and room scrolling");
