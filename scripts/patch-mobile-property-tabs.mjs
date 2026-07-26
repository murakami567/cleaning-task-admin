import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let text = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  if (text.includes(to)) return;
  if (!text.includes(from)) {
    throw new Error(`mobile property patch target not found: ${label}`);
  }
  text = text.replace(from, to);
}

replaceOnce(
  '  const [roomSearch, setRoomSearch] = useState("");',
  '  const [roomSearch, setRoomSearch] = useState("");\n  const [mobileMasterTab, setMobileMasterTab] = useState<"properties" | "rooms">("properties");',
  "mobile tab state"
);

replaceOnce(
  '    <div className="min-h-screen bg-slate-50 p-6">',
  '    <div className="min-h-screen bg-slate-50 px-3 py-4 md:p-6">',
  "mobile page padding"
);

replaceOnce(
  '          <div className="grid grid-cols-1 gap-4 xl:h-[calc(100vh-230px)] xl:min-h-[520px] xl:grid-cols-[420px_minmax(0,1fr)] xl:overflow-hidden">\n            <PropertyListPanel',
  '          <div className="mb-4 grid grid-cols-2 gap-2 md:hidden">\n            <button type="button" onClick={() => setMobileMasterTab("properties")} className={mobileMasterTab === "properties" ? "rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-extrabold text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700"}>物件</button>\n            <button type="button" onClick={() => setMobileMasterTab("rooms")} className={mobileMasterTab === "rooms" ? "rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-extrabold text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700"}>部屋</button>\n          </div>\n\n          <div className="grid grid-cols-1 gap-4 xl:h-[calc(100vh-230px)] xl:min-h-[520px] xl:grid-cols-[420px_minmax(0,1fr)] xl:overflow-hidden">\n            <div className={mobileMasterTab === "properties" ? "block min-h-0" : "hidden min-h-0 md:block"}>\n            <PropertyListPanel',
  "mobile tabs and property wrapper"
);

replaceOnce(
  '              onSelectProperty={setSelectedPropertyId}',
  '              onSelectProperty={(propertyId) => { setSelectedPropertyId(propertyId); setMobileMasterTab("rooms"); }}',
  "mobile property selection"
);

replaceOnce(
  '              onEditProperty={openEditProperty}\n            />\n\n            <RoomListPanel',
  '              onEditProperty={openEditProperty}\n            />\n            </div>\n\n            <div className={mobileMasterTab === "rooms" ? "block min-h-0" : "hidden min-h-0 md:block"}>\n            <RoomListPanel',
  "mobile room wrapper start"
);

replaceOnce(
  '              onEditRoom={openEditRoom}\n            />\n          </div>',
  '              onEditRoom={openEditRoom}\n            />\n            </div>\n          </div>',
  "mobile room wrapper end"
);

fs.writeFileSync(file, text);
console.log("mobile property tabs applied");
