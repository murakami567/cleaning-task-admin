import fs from "fs";

const path = "src/FacilityManagementPage.tsx";
let text = fs.readFileSync(path, "utf8");

if (!text.includes("photo_url: string | null;")) {
  text = text.replace(
    "  note: string;\n};",
    "  note: string;\n  photo_url: string | null;\n};"
  );
}

text = text.replace(
  '    note: "",\n  });',
  '    note: "",\n    photo_url: "",\n  });'
);

text = text.replace(
  '      note: "",\n    });',
  '      note: "",\n      photo_url: "",\n    });'
);

if (!text.includes("photo_url: form.photo_url")) {
  text = text.replace(
    "      note: form.note,\n    };",
    "      note: form.note,\n      photo_url: form.photo_url || null,\n    };"
  );
}

if (!text.includes('>写真</th>')) {
  text = text.replace(
    '<th className="text-left px-3 py-3">対応内容</th>',
    '<th className="text-left px-3 py-3 w-[96px]">写真</th>\n                <th className="text-left px-3 py-3">対応内容</th>'
  );
}

if (!text.includes('aria-label="設備対応写真"')) {
  text = text.replace(
    '                  <td className="px-3 py-4">{it.assignee}</td>\n                  <td className="px-3 py-4">',
    `                  <td className="px-3 py-4">{it.assignee}</td>\n                  <td className="px-3 py-4">\n                    {it.photo_url ? (\n                      <a\n                        href={it.photo_url}\n                        target="_blank"\n                        rel="noreferrer"\n                        onClick={(event) => event.stopPropagation()}\n                        aria-label="設備対応写真"\n                        className="block h-16 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"\n                      >\n                        <img\n                          src={it.photo_url}\n                          alt={\`${it.property_name} ${it.room_name} 設備対応写真\`}\n                          className="h-full w-full object-cover"\n                          loading="lazy"\n                          onError={(event) => {\n                            event.currentTarget.style.display = "none";\n                          }}\n                        />\n                      </a>\n                    ) : (\n                      <span className="text-xs text-slate-400">なし</span>\n                    )}\n                  </td>\n                  <td className="px-3 py-4">`
  );
}

if (!text.includes('Field label="報告写真"')) {
  text = text.replace(
    '          <div className="sm:col-span-2">\n            <Field label="対応内容">',
    `          {form.photo_url ? (\n            <div className="sm:col-span-2">\n              <Field label="報告写真">\n                <a href={form.photo_url} target="_blank" rel="noreferrer">\n                  <img\n                    src={form.photo_url}\n                    alt="設備対応の報告写真"\n                    className="max-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain"\n                  />\n                </a>\n              </Field>\n            </div>\n          ) : null}\n\n          <div className="sm:col-span-2">\n            <Field label="対応内容">`
  );
}

fs.writeFileSync(path, text);
console.log("patched facility photo display");
