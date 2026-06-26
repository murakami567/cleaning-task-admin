import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let src = fs.readFileSync(file, "utf8");

function replaceOnce(from, to, label) {
  if (src.includes(to)) return;
  if (!src.includes(from)) {
    console.log(`patch target not found, skipped: ${label}`);
    return;
  }
  src = src.replace(from, to);
}

replaceOnce(
`type PropertyMaster = {
  id: string;
  property_code: string;
  property_name: string;
  normalized_name: string | null;
  sort_order: number | null;
  is_active: boolean;
};`,
`type PropertyMaster = {
  id: string;
  property_code: string;
  property_name: string;
  normalized_name: string | null;
  sort_order: number | null;
  is_active: boolean;
  max_assignable_count?: number | null;
};`,
"PropertyMaster max_assignable_count"
);

replaceOnce(
`  const [propertyEditForm, setPropertyEditForm] = useState({
    id: "",
    property_code: "",
    property_name: "",
    sort_order: "999",
    is_active: true,
  });`,
`  const [propertyEditForm, setPropertyEditForm] = useState({
    id: "",
    property_code: "",
    property_name: "",
    sort_order: "999",
    max_assignable_count: "",
    is_active: true,
  });`,
"propertyEditForm max_assignable_count"
);

replaceOnce(
`  const [propertyForm, setPropertyForm] = useState({
    property_code: "",
    property_name: "",
    sort_order: "999",
  });`,
`  const [propertyForm, setPropertyForm] = useState({
    property_code: "",
    property_name: "",
    sort_order: "999",
    max_assignable_count: "",
  });`,
"propertyForm max_assignable_count"
);

replaceOnce(
`          sort_order: Number(propertyForm.sort_order || 999),
          is_active: true,`,
`          sort_order: Number(propertyForm.sort_order || 999),
          max_assignable_count: propertyForm.max_assignable_count === "" ? null : Number(propertyForm.max_assignable_count),
          is_active: true,`,
"create property payload max_assignable_count"
);

replaceOnce(
`      setPropertyForm({
        property_code: "",
        property_name: "",
        sort_order: "999",
      });`,
`      setPropertyForm({
        property_code: "",
        property_name: "",
        sort_order: "999",
        max_assignable_count: "",
      });`,
"reset propertyForm max_assignable_count"
);

replaceOnce(
`      sort_order: String(property.sort_order ?? 999),
      is_active: property.is_active,`,
`      sort_order: String(property.sort_order ?? 999),
      max_assignable_count: property.max_assignable_count == null ? "" : String(property.max_assignable_count),
      is_active: property.is_active,`,
"openEditProperty max_assignable_count"
);

replaceOnce(
`          sort_order: Number(propertyEditForm.sort_order || 999),
          is_active: propertyEditForm.is_active,`,
`          sort_order: Number(propertyEditForm.sort_order || 999),
          max_assignable_count: propertyEditForm.max_assignable_count === "" ? null : Number(propertyEditForm.max_assignable_count),
          is_active: propertyEditForm.is_active,`,
"update property payload max_assignable_count"
);

replaceOnce(
`                         <div className={\`mt-1 text-xs \${selected ? "text-white/70" : "text-slate-500"}\`}>
                           {roomCount} 室
                         </div>`,
`                         <div className={\`mt-1 text-xs \${selected ? "text-white/70" : "text-slate-500"}\`}>
                           {roomCount} 室 / 最大対応可能 {p.max_assignable_count ?? "制限なし"}
                         </div>`,
"property list max_assignable_count display"
);

replaceOnce(
`           <Field label="並び順">
             <TextInput
               type="number"
               value={propertyForm.sort_order}
               onChange={(v) => setPropertyForm((p) => ({ ...p, sort_order: v }))}
               placeholder="999"
             />
           </Field>`,
`           <Field label="並び順">
             <TextInput
               type="number"
               value={propertyForm.sort_order}
               onChange={(v) => setPropertyForm((p) => ({ ...p, sort_order: v }))}
               placeholder="999"
             />
           </Field>

           <Field label="最大対応可能数">
             <TextInput
               type="number"
               value={propertyForm.max_assignable_count}
               onChange={(v) => setPropertyForm((p) => ({ ...p, max_assignable_count: v }))}
               placeholder="空欄なら制限なし"
             />
           </Field>`,
"create drawer max_assignable_count field"
);

replaceOnce(
`           <Field label="並び順">
             <TextInput
               type="number"
               value={propertyEditForm.sort_order}
               onChange={(v) => setPropertyEditForm((p) => ({ ...p, sort_order: v }))}
             />
           </Field>

           <label className="inline-flex items-center gap-2 text-sm font-medium">`,
`           <Field label="並び順">
             <TextInput
               type="number"
               value={propertyEditForm.sort_order}
               onChange={(v) => setPropertyEditForm((p) => ({ ...p, sort_order: v }))}
             />
           </Field>

           <Field label="最大対応可能数">
             <TextInput
               type="number"
               value={propertyEditForm.max_assignable_count}
               onChange={(v) => setPropertyEditForm((p) => ({ ...p, max_assignable_count: v }))}
               placeholder="空欄なら制限なし"
             />
           </Field>

           <label className="inline-flex items-center gap-2 text-sm font-medium">`,
"edit drawer max_assignable_count field"
);

fs.writeFileSync(file, src);
console.log("patched property max assignable UI");
