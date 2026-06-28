import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type PropertyRow = {
  id: string;
  property_name: string;
  property_code?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
  assignment_mode?: "solo" | "shared" | "both" | string | null;
  max_assignable_count?: number | string | null;
  cleaning_point?: number | string | null;
};

type StaffRow = {
  id: string;
  staff_code?: string | null;
  staff_name: string;
  role?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
  note?: string | null;
  area?: string | null;
  available_property_ids?: string[] | null;
  unchecked_property_ids?: string[] | null;
  lineworks_channel_id?: string | null;
  daily_capacity_point?: number | null;
  solo_enabled?: boolean | null;
  shared_enabled?: boolean | null;
};

type Tab = "properties" | "staffs";

function Button({ children, className = "", ...props }: any) {
  return (
    <button
      className={`rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-slate-50 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Select({ value, onChange, children }: any) {
  return (
    <select
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

function NumberInput({ value, onChange, placeholder }: any) {
  return (
    <input
      type="number"
      className="h-10 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function modeLabel(mode?: string | null) {
  if (mode === "shared") return "分業";
  if (mode === "both") return "両方可";
  return "単独";
}

function toPositiveNumberOrDefault(value: number | string | null | undefined, fallback: number) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function AdminAutoAssignSettingsPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [staffs, setStaffs] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [query, setQuery] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/properties`),
        fetch(`${API_BASE}/staffs`),
      ]);

      if (!pRes.ok) throw new Error(`properties ${pRes.status}`);
      if (!sRes.ok) throw new Error(`staffs ${sRes.status}`);

      const p = await pRes.json();
      const s = await sRes.json();

      setProperties(Array.isArray(p) ? p : []);
      setStaffs(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error(e);
      alert("自動割当設定の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const saveProperty = async (row: PropertyRow) => {
    setSavingKey(`property-${row.id}`);
    try {
      const res = await fetch(`${API_BASE}/properties/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: row.id,
          property_code: row.property_code ?? "",
          property_name: row.property_name,
          normalized_name: row.property_name,
          sort_order: row.sort_order ?? 999,
          is_active: row.is_active ?? true,
          assignment_mode: row.assignment_mode || "solo",
          max_assignable_count:
            row.max_assignable_count === "" || row.max_assignable_count == null
              ? null
              : Number(row.max_assignable_count),
          cleaning_point: toPositiveNumberOrDefault(row.cleaning_point, 60),
        }),
      });
      if (!res.ok) throw new Error(`property update ${res.status}`);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("物件設定の保存に失敗しました。数値を確認してください。");
    } finally {
      setSavingKey("");
    }
  };

  const saveStaff = async (row: StaffRow) => {
    setSavingKey(`staff-${row.id}`);
    try {
      const res = await fetch(`${API_BASE}/staffs/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: row.id,
          staff_code: row.staff_code ?? "",
          staff_name: row.staff_name,
          role: row.role ?? "staff",
          sort_order: row.sort_order ?? 999,
          is_active: row.is_active ?? true,
          note: row.note ?? "",
          area: row.area ?? null,
          available_property_ids: row.available_property_ids ?? [],
          unchecked_property_ids: row.unchecked_property_ids ?? [],
          lineworks_channel_id: row.lineworks_channel_id ?? null,
          daily_capacity_point: row.daily_capacity_point ?? 300,
          solo_enabled: row.solo_enabled !== false,
          shared_enabled: row.shared_enabled !== false,
        }),
      });
      if (!res.ok) throw new Error(`staff update ${res.status}`);
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("スタッフ設定の保存に失敗しました。");
    } finally {
      setSavingKey("");
    }
  };

  const filteredProperties = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties
      .filter((p) => !q || `${p.property_name} ${p.property_code ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [properties, query]);

  const filteredStaffs = useMemo(() => {
    const q = query.trim().toLowerCase();

    return staffs
      .filter((s) => s.is_active !== false)
      .filter((s) => {
        const role = (s.role ?? "").toLowerCase();
        return role === "staff" || role === "checker";
      })
      .filter(
        (s) =>
          !q ||
          `${s.staff_name} ${s.staff_code ?? ""}`
            .toLowerCase()
            .includes(q)
      )
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [staffs, query]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-black tracking-tight">自動割当設定</div>
          <div className="mt-1 text-sm text-slate-500">
            300pt方式、単独・分業・両方可、物件点数、スタッフ上限を管理します。
          </div>
        </div>
        <Button onClick={() => void loadAll()}>{loading ? "読込中" : "更新"}</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button className={tab === "properties" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("properties")}>物件方式</Button>
        <Button className={tab === "staffs" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("staffs")}>スタッフ上限</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="h-11 w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索"
        />
      </div>

      {tab === "properties" ? (
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">物件</th>
                <th className="px-4 py-3">割当方式</th>
                <th className="px-4 py-3">最大対応数</th>
                <th className="px-4 py-3">物件点数</th>
                <th className="px-4 py-3">説明</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-bold">{p.property_name}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={p.assignment_mode || "solo"}
                      onChange={(v: string) => setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, assignment_mode: v } : x))}
                    >
                      <option value="solo">単独</option>
                      <option value="shared">分業</option>
                      <option value="both">両方可</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={p.max_assignable_count ?? ""}
                      placeholder="制限なし"
                      onChange={(v: string) => setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, max_assignable_count: v } : x))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={p.cleaning_point ?? ""}
                      placeholder="60"
                      onChange={(v: string) => setProperties((prev) => prev.map((x) => x.id === p.id ? { ...x, cleaning_point: v } : x))}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {modeLabel(p.assignment_mode)} / 物件点数は1部屋あたりの作業pt / 最大対応数は1人がその物件で持てる部屋数
                  </td>
                  <td className="px-4 py-3">
                    <Button disabled={savingKey === `property-${p.id}`} onClick={() => void saveProperty(p)}>保存</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "staffs" ? (
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">スタッフ</th>
                <th className="px-4 py-3">1日上限pt</th>
                <th className="px-4 py-3">単独</th>
                <th className="px-4 py-3">分業</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffs.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 font-bold">{s.staff_name}<div className="text-xs font-normal text-slate-500">{s.staff_code}</div></td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={s.daily_capacity_point ?? 300}
                      onChange={(v: string) => setStaffs((prev) => prev.map((x) => x.id === s.id ? { ...x, daily_capacity_point: Number(v || 300) } : x))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={s.solo_enabled !== false}
                      onChange={(e) => setStaffs((prev) => prev.map((x) => x.id === s.id ? { ...x, solo_enabled: e.target.checked } : x))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={s.shared_enabled !== false}
                      onChange={(e) => setStaffs((prev) => prev.map((x) => x.id === s.id ? { ...x, shared_enabled: e.target.checked } : x))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button disabled={savingKey === `staff-${s.id}`} onClick={() => void saveStaff(s)}>保存</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
