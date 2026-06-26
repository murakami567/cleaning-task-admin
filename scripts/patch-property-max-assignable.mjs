import fs from "node:fs";

const file = "src/PropertyManagementPage.tsx";
let src = fs.readFileSync(file, "utf8");

function replaceRegex(pattern, to, label) {
  if (src.match(pattern)?.[0]?.includes("max_assignable_count")) return;
  if (!pattern.test(src)) {
    console.log(`patch target not found, skipped: ${label}`);
    return;
  }
  src = src.replace(pattern, to);
}

function replaceText(from, to, label) {
  if (src.includes(to)) return;
  if (!src.includes(from)) {
    console.log(`patch target not found, skipped: ${label}`);
    return;
  }
  src = src.replace(from, to);
}

// 型定義
replaceRegex(
/type PropertyMaster = \{\n([\s\S]*?)  is_active: boolean;\n\};/,
`type PropertyMaster = {
$1  is_active: boolean;
  max_assignable_count?: number | null;
};`,
"PropertyMaster max_assignable_count"
);

// 新規追加フォーム state
replaceRegex(
/const \[propertyForm, setPropertyForm\] = useState\(\{\n\s*property_code: "",\n\s*property_name: "",\n\s*sort_order: "999",\n\s*\}\);/,
`const [propertyForm, setPropertyForm] = useState({
    property_code: "",
    property_name: "",
    sort_order: "999",
    max_assignable_count: "",
  });`,
"propertyForm max_assignable_count"
);

// 編集フォーム state
replaceRegex(
/const \[propertyEditForm, setPropertyEditForm\] = useState\(\{\n\s*id: "",\n\s*property_code: "",\n\s*property_name: "",\n\s*sort_order: "999",\n\s*is_active: true,\n\s*\}\);/,
`const [propertyEditForm, setPropertyEditForm] = useState({
    id: "",
    property_code: "",
    property_name: "",
    sort_order: "999",
    max_assignable_count: "",
    is_active: true,
  });`,
"propertyEditForm max_assignable_count"
);

// 新規追加 payload
replaceText(
`          sort_order: Number(propertyForm.sort_order || 999),
          is_active: true,`,
`          sort_order: Number(propertyForm.sort_order || 999),
          max_assignable_count: propertyForm.max_assignable_count === "" ? null : Number(propertyForm.max_assignable_count),
          is_active: true,`,
"create property payload max_assignable_count"
);

// 新規追加 reset
replaceText(
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

// 編集フォーム初期値
replaceText(
`      sort_order: String(property.sort_order ?? 999),
      is_active: property.is_active,`,
`      sort_order: String(property.sort_order ?? 999),
      max_assignable_count: property.max_assignable_count == null ? "" : String(property.max_assignable_count),
      is_active: property.is_active,`,
"openEditProperty max_assignable_count"
);

// 編集 payload
replaceText(
`          sort_order: Number(propertyEditForm.sort_order || 999),
          is_active: propertyEditForm.is_active,`,
`          sort_order: Number(propertyEditForm.sort_order || 999),
          max_assignable_count: propertyEditForm.max_assignable_count === "" ? null : Number(propertyEditForm.max_assignable_count),
          is_active: propertyEditForm.is_active,`,
"update property payload max_assignable_count"
);

// 物件一覧の表示
replaceText(
`                          {roomCount} 室
                        </div>`,
`                          {roomCount} 室 / 最大対応可能 {p.max_assignable_count ?? "制限なし"}
                        </div>`,
"property list max_assignable_count display"
);

// 物件追加ドロワー: 並び順の直後へ追加
replaceRegex(
/(<Field label="並び順">\n\s*<TextInput\n\s*type="number"\n\s*value=\{propertyForm\.sort_order\}\n\s*onChange=\{\(v\) => setPropertyForm\(\(p\) => \(\{ \.\.\.p, sort_order: v \}\)\)\}\n\s*placeholder="999"\n\s*\/>
\s*<\/Field>)/,
`$1

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

// 物件編集ドロワー: 編集フォームの並び順の直後へ追加
replaceRegex(
/(<Field label="並び順">\n\s*<TextInput\n\s*type="number"\n\s*value=\{propertyEditForm\.sort_order\}\n\s*onChange=\{\(v\) => setPropertyEditForm\(\(p\) => \(\{ \.\.\.p, sort_order: v \}\)\)\}\n\s*\/>
\s*<\/Field>)/,
`$1

          <Field label="最大対応可能数">
            <TextInput
              type="number"
              value={propertyEditForm.max_assignable_count}
              onChange={(v) => setPropertyEditForm((p) => ({ ...p, max_assignable_count: v }))}
              placeholder="空欄なら制限なし"
            />
          </Field>`,
"edit drawer max_assignable_count field"
);

fs.writeFileSync(file, src);
console.log("patched property max assignable UI robust");
