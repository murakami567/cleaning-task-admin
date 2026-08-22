from pathlib import Path

path = Path("src/AdminTasksPagePreview.tsx")
text = path.read_text(encoding="utf-8")

old = '''function dueLabel(v: string) {
  return DUE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
'''
new = '''function dueLabel(v: string) {
  return DUE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function dueChipClass(v: string) {
  switch (v) {
    case "DUE_TODAY":
      return "border-red-600 bg-red-600 text-white";
    case "DUE_TOMORROW":
      return "border-blue-500 bg-white text-blue-600";
    case "DUE_LATER":
    default:
      return "border-slate-400 bg-white text-black";
  }
}

function DueChip({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${dueChipClass(
        value
      )}`}
    >
      {dueLabel(value)}
    </span>
  );
}
'''
if old not in text:
    raise SystemExit("dueLabel target not found")
text = text.replace(old, new, 1)

old_render = '''                            ) : (
                              dueLabel(
                                computeDueLabel(
                                  t.checkoutDate ?? t.date,
                                  t.nextCheckinDate ?? ""
                                )
                              )
                            )}'''
new_render = '''                            ) : (
                              <DueChip
                                value={computeDueLabel(
                                  t.checkoutDate ?? t.date,
                                  t.nextCheckinDate ?? ""
                                )}
                              />
                            )}'''
if old_render not in text:
    raise SystemExit("deadline display target not found")
text = text.replace(old_render, new_render, 1)

path.write_text(text, encoding="utf-8")
print("Applied deadline chips to AdminTasksPagePreview.tsx")
