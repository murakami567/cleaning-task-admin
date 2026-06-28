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
};

type Property = {
  id: string;
  property_code: string | null;
  property_name: string;
  sort_order?: number | null;
  is_active?: boolean;
};

type PriorityRow = {
  id?: string;
  staff_id: string;
  property_id: string;
  priority_order: number;
};

function normalizeRole(role: string | null | undefined) {
  return String(role || "").trim();
}

export default function PropertyPrioritySettingsPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [priorities, setPriorities] = useState<PriorityRow[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const visibleStaffs = useMemo(() => {
    return staffs
      .filter((s) => s.is_active !== false)
      .filter((s) => ["staff", "checker"].includes(normalizeRole(s.role)))
      .slice()
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [staffs]);

  const propertyMap = useMemo(() => {
    const map = new Map<string, Property>();
    properties.forEach((p) => map.set(p.id, p));
    return map;
  }, [properties]);

  const selectedStaff = visibleStaffs.find((s) => s.id === selectedStaffId) || null;

  const selectedPriorityPropertyIds = useMemo(() => {
    return priorities
      .filter((p) => p.staff_id === selectedStaffId)
      .slice()
      .sort((a, b) => (a.priority_order ?? 999) - (b.priority_order ?? 999))
      .map((p) => p.property_id)
      .filter((id) => propertyMap.has(id));
  }, [priorities, selectedStaffId, propertyMap]);

  const availableToAdd = useMemo(() => {
    const used = new Set(selectedPriorityPropertyIds);
    return properties.filter((p) => p.is_active !== false && !used.has(p.id));
  }, [properties, selectedPriorityPropertyIds]);

  const load = async () => {
    try {
      setLoading(true);
      const [staffRes, propertyRes, priorityRes] = await Promise.all([
        fetch(`${API_BASE}/staffs`),
        fetch(`${API_BASE}/properties`),
        fetch(`${API_BASE}/staff-property-priorities`),
      ]);

      const staffData = await staffRes.json();
      const propertyData = await propertyRes.json();
      const priorityData = await priorityRes.json();

      if (!staffRes.ok) throw new Error(staffData?.detail || "スタッフ取得に失敗しました。");
      if (!propertyRes.ok) throw new Error(propertyData?.detail || "物件取得に失敗しました。");
      if (!priorityRes.ok) throw new Error(priorityData?.detail || "優先順位取得に失敗しました。");

      const nextStaffs: Staff[] = Array.isArray(staffData) ? staffData : [];
      const nextProperties: Property[] = Array.isArray(propertyData) ? propertyData : [];
      setStaffs(nextStaffs);
      setProperties(
        nextProperties
          .filter((p) => p.is_active !== false)
          .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      );
      setPriorities(Array.isArray(priorityData) ? priorityData : []);

      const firstStaff = nextStaffs
        .filter((s) => s.is_active !== false)
        .filter((s) => ["staff", "checker"].includes(normalizeRole(s.role)))
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))[0];
      setSelectedStaffId((prev) => prev || firstStaff?.id || "");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "優先順位設定の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const savePriorityIds = async (propertyIds: string[]) => {
    if (!selectedStaffId) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/staff-property-priorities/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: selectedStaffId, property_ids: propertyIds }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || "優先順位の保存に失敗しました。");
      await load();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "優先順位の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const movePriority = (index: number, diff: number) => {
    const next = [...selectedPriorityPropertyIds];
    const target = index + diff;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    void savePriorityIds(next);
  };

  const removePriority = (propertyId: string) => {
    void savePriorityIds(selectedPriorityPropertyIds.filter((id) => id !== propertyId));
  };

  const addPriority = () => {
    if (!selectedPropertyId) {
      alert("追加する物件を選択してください。");
      return;
    }
    if (selectedPriorityPropertyIds.includes(selectedPropertyId)) return;
    void savePriorityIds([...selectedPriorityPropertyIds, selectedPropertyId]);
    setSelectedPropertyId("");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">管理画面 ＞ 優先順位設定</div>
          <div className="text-base font-extrabold mt-1">アカウント別 物件優先順位</div>
          <div className="text-xs text-slate-500 mt-1">
            自動割り当てで使用する物件優先順。1番が最優先です。
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50"
        >
          {loading ? "読込中..." : "再読込"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="text-sm font-extrabold">スタッフ</div>
            <div className="text-xs text-slate-500 mt-1">staff / checker のみ表示</div>
          </div>
          <div className="max-h-[68vh] overflow-auto">
            {visibleStaffs.map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => setSelectedStaffId(staff.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                  selectedStaffId === staff.id ? "bg-slate-900 text-white hover:bg-slate-900" : "bg-white"
                }`}
              >
                <div className="text-sm font-extrabold">{staff.staff_name}</div>
                <div className={selectedStaffId === staff.id ? "text-xs text-slate-200" : "text-xs text-slate-500"}>
                  {staff.staff_code || "コードなし"} / {staff.role || ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">
                {selectedStaff ? `${selectedStaff.staff_name} の優先物件` : "スタッフを選択"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                上から順に自動割り当ての優先順位として使用します。
              </div>
            </div>
            <button
              type="button"
              disabled={!selectedStaffId || saving || selectedPriorityPropertyIds.length === 0}
              onClick={() => void savePriorityIds([])}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              全解除
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap gap-2 items-center">
              <select
                className="h-11 min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                disabled={!selectedStaffId || saving}
              >
                <option value="">追加する物件を選択</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.property_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedStaffId || !selectedPropertyId || saving}
                onClick={addPriority}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
              >
                追加
              </button>
            </div>

            <div className="space-y-2">
              {selectedPriorityPropertyIds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  優先物件は未設定です。
                </div>
              ) : (
                selectedPriorityPropertyIds.map((propertyId, index) => {
                  const property = propertyMap.get(propertyId);
                  if (!property) return null;
                  return (
                    <div
                      key={propertyId}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold">{property.property_name}</div>
                        <div className="text-xs text-slate-500">{property.property_code || ""}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={index === 0 || saving}
                          onClick={() => movePriority(index, -1)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === selectedPriorityPropertyIds.length - 1 || saving}
                          onClick={() => movePriority(index, 1)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => removePriority(propertyId)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
