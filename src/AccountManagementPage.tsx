import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Staff = {
  id: string;
  staff_code: string | null;
  staff_name: string;
  role: string | null;
  is_active: boolean;
  sort_order: number | null;
  note: string | null;
};

function Button({ children, className = "", ...props }: any) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Drawer({ open, title, subtitle, children, onClose, footer }: any) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex justify-end bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-full w-[520px] max-w-[92vw] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold">{title}</div>
            {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
          </div>
          <button
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">{children}</div>
        <div className="p-4 border-t border-slate-200">{footer}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500 font-semibold">{label}</div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder = "", type = "text" }: any) {
  return (
    <input
      type={type}
      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Select({ value, onChange, options }: any) {
  return (
    <select
      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none bg-white"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function AccountManagementPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);

  const [form, setForm] = useState({
    id: "",
    staff_code: "",
    staff_name: "",
    role: "staff",
    is_active: true,
    sort_order: "999",
    note: "",
  });

  const loadStaffs = async () => {
    const res = await fetch(`${API_BASE}/staffs`);
    const data = await res.json();
    setStaffs(data || []);
  };

  useEffect(() => {
    void loadStaffs();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return staffs
      .filter((s) => (showInactive ? true : s.is_active))
      .filter((s) => {
        if (!qq) return true;
        return `${s.staff_name} ${s.staff_code ?? ""} ${s.role ?? ""} ${s.note ?? ""}`
          .toLowerCase()
          .includes(qq);
      })
      .slice()
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [staffs, q, showInactive]);

  const openNew = () => {
    setSelected(null);
    setForm({
      id: "",
      staff_code: "",
      staff_name: "",
      role: "staff",
      is_active: true,
      sort_order: "999",
      note: "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (staff: Staff) => {
    setSelected(staff);
    setForm({
      id: staff.id,
      staff_code: staff.staff_code ?? "",
      staff_name: staff.staff_name,
      role: staff.role ?? "staff",
      is_active: staff.is_active,
      sort_order: String(staff.sort_order ?? 999),
      note: staff.note ?? "",
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!form.staff_code.trim()) return alert("スタッフコードを入力してください。");
    if (!form.staff_name.trim()) return alert("名前を入力してください。");

    const body = {
      staff_code: form.staff_code.trim(),
      staff_name: form.staff_name.trim(),
      role: form.role,
      is_active: form.is_active,
      sort_order: Number(form.sort_order || 999),
      note: form.note,
    };

    const url = selected ? `${API_BASE}/staffs/update` : `${API_BASE}/staffs/create`;
    const payload = selected ? { staff_id: form.id, ...body } : body;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return alert("保存に失敗しました。");

    setDrawerOpen(false);
    await loadStaffs();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">管理画面 ＞ アカウント管理</div>
          <div className="text-base font-extrabold mt-1">アカウント管理</div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm">🔎</span>
            <input
              className="bg-transparent outline-none text-sm w-[260px] max-w-[56vw]"
              placeholder="検索：名前 / コード / 権限"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            無効も表示
          </label>

          <button
            className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-bold hover:bg-black"
            onClick={openNew}
          >
            ＋アカウント追加
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="text-sm font-extrabold">スタッフ一覧</div>
          <div className="text-xs text-slate-500 mt-1">行クリックで編集</div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-3 py-3">並び順</th>
                <th className="text-left px-3 py-3">スタッフコード</th>
                <th className="text-left px-3 py-3">名前</th>
                <th className="text-left px-3 py-3">権限</th>
                <th className="text-left px-3 py-3">状態</th>
                <th className="text-left px-3 py-3">備考</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((staff) => (
                <tr
                  key={staff.id}
                  className="border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                  onClick={() => openEdit(staff)}
                >
                  <td className="px-3 py-3">{staff.sort_order ?? ""}</td>
                  <td className="px-3 py-3 font-semibold">{staff.staff_code}</td>
                  <td className="px-3 py-3 font-extrabold">{staff.staff_name}</td>
                  <td className="px-3 py-3">{staff.role}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        staff.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {staff.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{staff.note || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={selected ? "アカウント編集" : "アカウント追加"}
        subtitle={selected ? `ID: ${selected.id}` : "新規作成"}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">保存後、一覧に反映されます。</div>
            <div className="flex gap-2">
              <Button onClick={() => setDrawerOpen(false)}>キャンセル</Button>
              <Button className="bg-slate-900 text-white border-slate-900 hover:bg-black" onClick={save}>
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="スタッフコード">
            <TextInput value={form.staff_code} onChange={(v: string) => setForm((s) => ({ ...s, staff_code: v }))} />
          </Field>

          <Field label="名前">
            <TextInput value={form.staff_name} onChange={(v: string) => setForm((s) => ({ ...s, staff_name: v }))} />
          </Field>

          <Field label="権限">
            <Select
              value={form.role}
              onChange={(v: string) => setForm((s) => ({ ...s, role: v }))}
              options={[
                { value: "staff", label: "staff" },
                { value: "leader", label: "leader" },
                { value: "checker", label: "checker" },
                { value: "admin", label: "admin" },
              ]}
            />
          </Field>

          <Field label="並び順">
            <TextInput
              type="number"
              value={form.sort_order}
              onChange={(v: string) => setForm((s) => ({ ...s, sort_order: v }))}
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              有効
            </label>
          </div>

          <div className="sm:col-span-2">
            <Field label="備考">
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none min-h-[88px]"
                value={form.note}
                onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              />
            </Field>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
