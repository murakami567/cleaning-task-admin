import React, { useEffect, useMemo, useRef, useState } from "react";

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
  daily_capacity_point?: number | string | null;
  solo_enabled?: boolean | null;
  shared_enabled?: boolean | null;
};

type Tab = "properties" | "staffs";
type SaveStatus = "" | "保存待ち" | "保存中..." | "✓ 保存済み" | "保存失敗";

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

function NumberInput({ value, onChange, placeholder, onBlur, onKeyDown }: any) {
  return (
    <input
      type="number"
      className="h-10 w-28 rounded-xl border border-slate-200 px-3 text-sm outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
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

function toNullablePositiveNumber(value: number | string | null | undefined) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function AdminAutoAssignSettingsPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [staffs, setStaffs] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("");
  const [query, setQuery] = useState("");
  const propertyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const staffTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStatus = (status: SaveStatus) => {
    setSaveStatus(status);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    if (status === "✓ 保存済み") {
      statusTimer.current = setTimeout(() => setSaveStatus(""), 1500);
    }
  };

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
    return () => {
      Object.values(propertyTimers.current).forEach(clearTimeout);
      Object.values(staffTimers.current).forEach(clearTimeout);
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  const saveProperty = async (row: PropertyRow) => {
    setSavingKey(`property-${row.id}`);
    showStatus("保存中...");
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
          max_assignable_count: toNullablePositiveNumber(row.max_assignable_count),
          cleaning_point: toPositiveNumberOrDefault(row.cleaning_point, 60),
        }),
      });
      if (!res.ok) throw new Error(`property update ${res.status}`);
      showStatus("✓ 保存済み");
    } catch (e) {
      console.error(e);
      showStatus("保存失敗");
      alert("物件設定の保存に失敗しました。数値を確認してください。");
    } finally {
      setSavingKey("");
    }
  };

  const saveStaff = async (row: StaffRow) => {
    setSavingKey(`staff-${row.id}`);
    showStatus("保存中...");
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
          daily_capacity_point: toPositiveNumberOrDefault(row.daily_capacity_point, 300),
          solo_enabled: row.solo_enabled !== false,
          shared_enabled: row.shared_enabled !== false,
        }),
      });
      if (!res.ok) throw new Error(`staff update ${res.status}`);
      showStatus("✓ 保存済み");
    } catch (e) {
      console.error(e);
      showStatus("保存失敗");
      alert("スタッフ設定の保存に失敗しました。");
    } finally {
      setSavingKey("");
    }
  };

  const schedulePropertySave = (row: PropertyRow, delay = 600) => {
    showStatus("保存待ち");
    if (propertyTimers.current[row.id]) clearTimeout(propertyTimers.current[row.id]);
    propertyTimers.current[row.id] = setTimeout(() => void saveProperty(row), delay);
  };

  const scheduleStaffSave = (row: StaffRow, delay = 600) => {
    showStatus("保存待ち");
    if (staffTimers.current[row.id]) clearTimeout(staffTimers.current[row.id]);
    staffTimers.current[row.id] = setTimeout(() => void saveStaff(row), delay);
  };

  const updateProperty = (id: string, patch: Partial<PropertyRow>, immediate = false) => {
    let nextRow: PropertyRow | null = null;
    setProperties((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        nextRow = { ...x, ...patch };
        return nextRow;
      })
    );
    setTimeout(() => {
      if (nextRow) schedulePropertySave(nextRow, immediate ? 0 : 600);
    }, 0);
  };

  const updateStaff = (id: string, patch: Partial<StaffRow>, immediate = false) => {
    let nextRow: StaffRow | null = null;
    setStaffs((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        nextRow = { ...x, ...patch };
        return nextRow;
      })
    );
    setTimeout(() => {
      if (nextRow) scheduleStaffSave(nextRow, immediate ? 0 : 600);
    }, 0);
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
        <div className="flex items-center gap-3">
          {saveStatus ? <div className="text-sm font-bold text-slate-500">{saveStatus}</div> : null}
          <Button onClick={() => void loadAll()}>{loading ? "読込中" : "更新"}</Button>
        </div>
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
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">物件</th>
                <th className="px-4 py-3">割当方式</th>
                <th className="px-4 py-3">最大対応数</th>
                <th className="px-4 py-3">物件点数</th>
                <th className="px-4 py-3">説明</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-bold">{p.property_name}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={p.assignment_mode || "solo"}
                      onChange={(v: string) => updateProperty(p.id, { assignment_mode: v }, true)}
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
                      onChange={(v: string) => updateProperty(p.id, { max_assignable_count: v })}
                      onBlur={() => schedulePropertySave(p, 0)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={p.cleaning_point ?? ""}
                      placeholder="60"
                      onChange={(v: string) => updateProperty(p.id, { cleaning_point: v })}
                      onBlur={() => schedulePropertySave(p, 0)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {modeLabel(p.assignment_mode)} / 物件点数は1部屋あたりの作業pt / 最大対応数は1人がその物件で持てる部屋数
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "staffs" ? (
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">スタッフ</th>
                <th className="px-4 py-3">1日上限pt</th>
                <th className="px-4 py-3">単独</th>
                <th className="px-4 py-3">分業</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffs.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3 font-bold">{s.staff_name}<div className="text-xs font-normal text-slate-500">{s.staff_code}</div></td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={s.daily_capacity_point ?? ""}
                      placeholder="300"
                      onChange={(v: string) => updateStaff(s.id, { daily_capacity_point: v })}
                      onBlur={() => scheduleStaffSave(s, 0)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={s.solo_enabled !== false}
                      onChange={(e) => updateStaff(s.id, { solo_enabled: e.target.checked }, true)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={s.shared_enabled !== false}
                      onChange={(e) => updateStaff(s.id, { shared_enabled: e.target.checked }, true)}
                    />
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
