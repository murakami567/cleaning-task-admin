import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

if (text.includes("mobileMasterTab")) {
  console.log("mobile property tabs already applied");
} else {
  text = text.replace(
    '  const [roomSearch, setRoomSearch] = useState("");',
    '  const [roomSearch, setRoomSearch] = useState("");\n  const [mobileMasterTab, setMobileMasterTab] = useState<"properties" | "rooms">("properties");'
  );

  const gridStart = '          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">\n            <Card>';
  const mobileTabs = [
    '          <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">',
    '            <button type="button" onClick={() => setMobileMasterTab("properties")} className={mobileMasterTab === "properties" ? "rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-extrabold text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700"}>物件</button>',
    '            <button type="button" onClick={() => setMobileMasterTab("rooms")} className={mobileMasterTab === "rooms" ? "rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-extrabold text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700"}>部屋</button>',
    '          </div>',
    '',
    '          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">',
    '            <div className={mobileMasterTab === "properties" ? "block" : "hidden md:block"}>',
    '            <Card>'
  ].join('\n');
  text = text.replace(gridStart, mobileTabs);

  text = text.replace(
    '                        onClick={() => setSelectedPropertyId(p.id)}',
    '                        onClick={() => { setSelectedPropertyId(p.id); setMobileMasterTab("rooms"); }}'
  );

  text = text.replace(
    '              </CardBody>\n            </Card>\n\n            <Card>\n              <CardBody>\n                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">\n                  <div>\n                    <div className="text-xl font-extrabold">部屋一覧',
    '              </CardBody>\n            </Card>\n            </div>\n\n            <div className={mobileMasterTab === "rooms" ? "block" : "hidden md:block"}>\n            <Card>\n              <CardBody>\n                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">\n                  <div>\n                    <div className="text-xl font-extrabold">部屋一覧'
  );

  text = text.replace(
    '                  <div className="w-full max-w-sm">\n                    <TextInput value={roomSearch}',
    '                  <div className="w-full space-y-2 md:max-w-sm">\n                    <div className="md:hidden"><Select value={selectedPropertyId} onChange={setSelectedPropertyId} options={properties.map((p) => ({ value: p.id, label: p.property_name }))} /></div>\n                    <TextInput value={roomSearch}'
  );

  text = text.replace(
    '              </CardBody>\n            </Card>\n          </div>\n        </>',
    '              </CardBody>\n            </Card>\n            </div>\n          </div>\n        </>'
  );

  text = text.replace('className="min-h-screen bg-slate-50 p-6"', 'className="min-h-screen bg-slate-50 px-3 py-4 md:p-6"');
  fs.writeFileSync(file, text);
  console.log("mobile property tabs applied");
}
