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
  password?: string | null;
  area?: string | null;
  available_property_ids?: string[] | null;
};

type Property = {
  id: string;
  property_code: string | null;
  property_name: string;
  sort_order?: number | null;
  is_active?: boolean;
};

const AREA_OPTIONS = [
  { value: "", label: "未設定" },
  { value: "博多", label: "博多" },
  { value: "天神", label: "天神" },
  { value: "F6", label: "F6" },
];

function Button({ children, className = "", ...props }: any) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-slate-50 disabled:opacity-50 ${className}`}
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [q, setQ] = useState("");
  const [propertyQuery, setPropertyQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: "",
    staff_code: "",
    staff_name: "",
    role: "staff",
    is_active: true,
    sort_order: "999",
    note: "",
    password: "",
    area: "",
    available_property_ids: [] as string[],
  });

  const loadStaffs = async () => {
    try {
      const res = await fetch(`${API_BASE}/staffs`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "スタッフ取得に失敗しました。");
      }

      setStaffs(data || []);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "スタッフ取得に失敗しました。");
    }
  };

  const loadProperties = async () => {
    try {
      const res = await fetch(`${API_BASE}/properties`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "物件取得に失敗しました。");
      const list: Property[] = Array.isArray(data) ? data : [];
      // 有効物件のみ、sort_order 昇順
      const filtered = list
        .filter((p) => p.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      setProperties(filtered);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadStaffs();
    void loadProperties();
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
    setPropertyQuery("");
    setForm({
      id: "",
      staff_code: "",
      staff_name: "",
      role: "staff",
      is_active: true,
      sort_order: "999",
      note: "",
      password: "",
      area: "",
      available_property_ids: [],
    });
    setDrawerOpen(true);
  };

  const openEdit = (staff: Staff) => {
    setSelected(staff);
    setPropertyQuery("");
    setForm({
      id: staff.id,
      staff_code: staff.staff_code ?? "",
      staff_name: staff.staff_name,
      role: staff.role ?? "staff",
      is_active: staff.is_active,
      sort_order: String(staff.sort_order ?? 999),
      note: staff.note ?? "",
      password: "",
      area: staff.area ?? "",
      available_property_ids: Array.isArray(staff.available_property_ids)
        ? staff.available_property_ids
        : [],
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!form.staff_code.trim()) {
      alert("スタッフコードを入力してください。");
      return;
    }

    if (!form.staff_name.trim()) {
      alert("名前を入力してください。");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        staff_id: form.id || null,
        staff_code: form.staff_code.trim(),
        staff_name: form.staff_name.trim(),
        role: form.role,
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 999),
        note: form.note,
        password: form.password || null,
        area: form.area || "",
        available_property_ids: form.available_property_ids,
      };

      const res = await fetch(`${API_BASE}/staffs/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "保存に失敗しました。");
      }

      setDrawerOpen(false);
      await loadStaffs();
      alert("保存しました。");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
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
                <th className="text-left px-3 py-3">エリア</th>
                <th className="text-left px-3 py-3">対応物件</th>
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
                  <td className="px-3 py-3">{staff.area || ""}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {Array.isArray(staff.available_property_ids) && staff.available_property_ids.length > 0
                      ? `${staff.available_property_ids.length} 件`
                      : ""}
                  </td>
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
              <Button
                className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                onClick={save}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="スタッフコード">
            <TextInput
              value={form.staff_code}
              onChange={(v: string) => setForm((s) => ({ ...s, staff_code: v }))}
            />
          </Field>

          <Field label="名前">
            <TextInput
              value={form.staff_name}
              onChange={(v: string) => setForm((s) => ({ ...s, staff_name: v }))}
            />
          </Field>

          <Field label="権限">
            <Select
              value={form.role}
              onChange={(v: string) => setForm((s) => ({ ...s, role: v }))}
              options={[
                { value: "admin", label: "admin" },
                { value: "sub_admin", label: "sub_admin" },
                { value: "payroll_admin", label: "payroll_admin" },
                { value: "leader", label: "leader" },
                { value: "checker", label: "checker" },
                { value: "staff", label: "staff" },
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

          <Field label="パスワード">
            <TextInput
              type="text"
              value={form.password}
              onChange={(v: string) => setForm((s) => ({ ...s, password: v }))}
              placeholder={selected ? "未入力なら変更なし" : "パスワードを入力"}
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

          <Field label="対応エリア">
            <Select
              value={form.area}
              onChange={(v: string) => setForm((s) => ({ ...s, area: v }))}
              options={AREA_OPTIONS}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={`対応可能物件 (${form.available_property_ids.length} 件選択中)`}>
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                  <input
                    className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none"
                    placeholder="物件名で絞り込み"
                    value={propertyQuery}
                    onChange={(e) => setPropertyQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        available_property_ids: properties.map((p) => p.id),
                      }))
                    }
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    onClick={() =>
                      setForm((s) => ({ ...s, available_property_ids: [] }))
                    }
                  >
                    全解除
                  </button>
                </div>

                <div className="max-h-[260px] overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {properties
                    .filter((p) => {
                      const qq = propertyQuery.trim().toLowerCase();
                      if (!qq) return true;
                      return `${p.property_name} ${p.property_code ?? ""}`
                        .toLowerCase()
                        .includes(qq);
                    })
                    .map((p) => {
                      const checked = form.available_property_ids.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                            checked
                              ? "bg-sky-50 border-sky-300"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setForm((s) => {
                                const next = new Set(s.available_property_ids);
                                if (e.target.checked) next.add(p.id);
                                else next.delete(p.id);
                                return { ...s, available_property_ids: Array.from(next) };
                              });
                            }}
                          />
                          <span className="truncate">{p.property_name}</span>
                        </label>
                      );
                    })}

                  {properties.length === 0 ? (
                    <div className="col-span-full text-xs text-slate-500 px-2 py-3">
                      物件が登録されていません。物件管理から追加してください。
                    </div>
                  ) : null}
                </div>
              </div>
            </Field>
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
