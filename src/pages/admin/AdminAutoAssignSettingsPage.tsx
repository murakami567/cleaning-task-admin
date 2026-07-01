import React, { useEffect, useMemo, useRef, useState } from "react";
import PropertyPrioritySettingsPage from "../../PropertyPrioritySettingsPage";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type PropertyRow = {
  id: string;
  property_name: string;
  property_code?: string | null;
  sort_order?: number | string | null;
  is_active?: boolean;
  max_assignable_count?: number | string | null;
};

type Tab = "properties" | "priority";
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

function NumberInput({ value, onChange, placeholder, onBlur, onKeyDown, className = "" }: any) {
  return (
    <input
      type="number"
      className={`h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none ${className}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
    />
  );
}

function toNullablePositiveNumber(value: number | string | null | undefined) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toPositiveNumberOrDefault(value: number | string | null | undefined, fallback: number) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function AdminAutoAssignSettingsPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("");
  const [query, setQuery] = useState("");
  const propertyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
      const res = await fetch(`${API_BASE}/properties`);
      if (!res.ok) throw new Error(`properties ${res.status}`);
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
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
          sort_order: toPositiveNumberOrDefault(row.sort_order, 999),
          is_active: row.is_active ?? true,
          max_assignable_count: toNullablePositiveNumber(row.max_assignable_count),
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

  const schedulePropertySave = (row: PropertyRow, delay = 600) => {
    showStatus("保存待ち");
    if (propertyTimers.current[row.id]) clearTimeout(propertyTimers.current[row.id]);
    propertyTimers.current[row.id] = setTimeout(() => void saveProperty(row), delay);
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

  const filteredProperties = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties
      .filter((p) => p.is_active !== false)
      .filter((p) => !q || `${p.property_name} ${p.property_code ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => (Number(a.sort_order ?? 999) || 999) - (Number(b.sort_order ?? 999) || 999));
  }, [properties, query]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-3xl font-black tracking-tight">自動割当設定</div>
          <div className="mt-1 text-sm text-slate-500">
            新ロジック: 物件の並び順 → 物件ごとの優先スタッフ → 最大対応数で割り当てます。
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus ? <div className="text-sm font-bold text-slate-500">{saveStatus}</div> : null}
          <Button onClick={() => void loadAll()}>{loading ? "読込中" : "更新"}</Button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div className="font-extrabold text-slate-900">現在の割当ルール</div>
        <div className="mt-2 leading-7">
          対象日の未割当タスクを確認 → 物件の並び順で処理 → 優先順位設定の上からスタッフを配置 → 各スタッフへ最大対応数まで割当。
          最大対応数が5以上の物件で残数が2以下になった場合、その残りはスキップします。
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button className={tab === "properties" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("properties")}>物件優先度・最大対応数</Button>
        <Button className={tab === "priority" ? "bg-black text-white" : "bg-white"} onClick={() => setTab("priority")}>スタッフ優先順位</Button>
      </div>

      {tab === "properties" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className="h-11 w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="物件検索"
            />
          </div>

          <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">物件</th>
                  <th className="px-4 py-3">物件優先度</th>
                  <th className="px-4 py-3">最大対応数</th>
                  <th className="px-4 py-3">説明</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-bold">
                      {p.property_name}
                      <div className="text-xs font-normal text-slate-500">{p.property_code || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <NumberInput
                        className="w-28"
                        value={p.sort_order ?? ""}
                        placeholder="999"
                        onChange={(v: string) => updateProperty(p.id, { sort_order: v })}
                        onBlur={() => schedulePropertySave(p, 0)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <NumberInput
                        className="w-28"
                        value={p.max_assignable_count ?? ""}
                        placeholder="1"
                        onChange={(v: string) => updateProperty(p.id, { max_assignable_count: v })}
                        onBlur={() => schedulePropertySave(p, 0)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      優先度は小さい数字から処理。最大対応数は1人がこの物件で持てる部屋数。
                      {savingKey === `property-${p.id}` ? " 保存中..." : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === "priority" ? <PropertyPrioritySettingsPage /> : null}
    </div>
  );
}
