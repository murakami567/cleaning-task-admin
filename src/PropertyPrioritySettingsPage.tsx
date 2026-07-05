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
  available_property_ids?: string[] | null;
  unchecked_property_ids?: string[] | null;
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

function canHandleProperty(staff: Staff, propertyId: string) {
  const available = Array.isArray(staff.available_property_ids)
    ? staff.available_property_ids.map(String)
    : [];
  const priority = Array.isArray(staff.unchecked_property_ids)
    ? staff.unchecked_property_ids.map(String)
    : [];
  return available.includes(propertyId) || priority.includes(propertyId);
}

export default function PropertyPrioritySettingsPage({ readOnly = false }: { readOnly?: boolean }) {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [priorities, setPriorities] = useState<PriorityRow[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const visibleStaffs = useMemo(() => {
    return staffs
      .filter((s) => s.is_active !== false)
      .filter((s) => ["staff", "checker"].includes(normalizeRole(s.role)))
      .slice()
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  }, [staffs]);

  const availableStaffsForSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return [];
    return visibleStaffs.filter((s) => canHandleProperty(s, selectedPropertyId));
  }, [visibleStaffs, selectedPropertyId]);

  const staffMap = useMemo(() => {
    const map = new Map<string, Staff>();
    visibleStaffs.forEach((s) => map.set(s.id, s));
    return map;
  }, [visibleStaffs]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || null;

  const selectedPriorityStaffIds = useMemo(() => {
    return priorities
      .filter((p) => p.property_id === selectedPropertyId)
      .slice()
      .sort((a, b) => (a.priority_order ?? 999) - (b.priority_order ?? 999))
      .map((p) => p.staff_id)
      .filter((id) => staffMap.has(id));
  }, [priorities, selectedPropertyId, staffMap]);

  const availableStaffsToAdd = useMemo(() => {
    const used = new Set(selectedPriorityStaffIds);
    return availableStaffsForSelectedProperty.filter((s) => !used.has(s.id));
  }, [availableStaffsForSelectedProperty, selectedPriorityStaffIds]);

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

      const nextProperties: Property[] = Array.isArray(propertyData) ? propertyData : [];
      setStaffs(Array.isArray(staffData) ? staffData : []);
      setProperties(
        nextProperties
          .filter((p) => p.is_active !== false)
          .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      );
      setPriorities(Array.isArray(priorityData) ? priorityData : []);

      const firstProperty = nextProperties
        .filter((p) => p.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))[0];
      setSelectedPropertyId((prev) => prev || firstProperty?.id || "");
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

  useEffect(() => {
    setSelectedStaffId("");
  }, [selectedPropertyId]);

  const saveStaffIds = async (staffIds: string[]) => {
    if (!selectedPropertyId || readOnly) return;
    const token = localStorage.getItem("admin_access_token") || "";
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/property-staff-priorities/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: selectedPropertyId, staff_ids: staffIds }),
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
    if (readOnly) return;
    const next = [...selectedPriorityStaffIds];
    const target = index + diff;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    void saveStaffIds(next);
  };

  const removePriority = (staffId: string) => {
    if (readOnly) return;
    void saveStaffIds(selectedPriorityStaffIds.filter((id) => id !== staffId));
  };

  const addPriority = () => {
    if (readOnly) return;
    if (!selectedStaffId) {
      alert("追加するスタッフを選択してください。");
      return;
    }
    if (selectedPriorityStaffIds.includes(selectedStaffId)) return;
    void saveStaffIds([...selectedPriorityStaffIds, selectedStaffId]);
    setSelectedStaffId("");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">管理画面 ＞ 優先順位設定</div>
          <div className="text-base font-extrabold mt-1">物件別 スタッフ優先順位</div>
          <div className="text-xs text-slate-500 mt-1">
            清掃タスクの物件ごとに、対応可能スタッフだけを優先順に設定します。
          </div>
          {readOnly ? <div className="mt-2 text-xs font-bold text-amber-700">リーダー権限では閲覧のみ可能です。</div> : null}
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
            <div className="text-sm font-extrabold">物件</div>
            <div className="text-xs text-slate-500 mt-1">物件優先度の順に表示</div>
          </div>
          <div className="max-h-[68vh] overflow-auto">
            {properties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => setSelectedPropertyId(property.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                  selectedPropertyId === property.id ? "bg-slate-900 text-white hover:bg-slate-900" : "bg-white"
                }`}
              >
                <div className="text-sm font-extrabold">{property.property_name}</div>
                <div className={selectedPropertyId === property.id ? "text-xs text-slate-200" : "text-xs text-slate-500"}>
                  優先度: {property.sort_order ?? 999} / {property.property_code || "コードなし"}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">
                {selectedProperty ? `${selectedProperty.property_name} の優先スタッフ` : "物件を選択"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                追加候補には、アカウント側でこの物件が対応可能になっているスタッフのみ表示します。
              </div>
            </div>
            {!readOnly ? (
              <button
                type="button"
                disabled={!selectedPropertyId || saving || selectedPriorityStaffIds.length === 0}
                onClick={() => void saveStaffIds([])}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                全解除
              </button>
            ) : null}
          </div>

          <div className="p-4 space-y-4">
            {!readOnly ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap gap-2 items-center">
                <select
                  className="h-11 min-w-[260px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  disabled={!selectedPropertyId || saving}
                >
                  <option value="">追加するスタッフを選択</option>
                  {availableStaffsToAdd.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.staff_name} {s.staff_code ? `(${s.staff_code})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedPropertyId || !selectedStaffId || saving}
                  onClick={addPriority}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
                >
                  追加
                </button>
                {selectedPropertyId && availableStaffsForSelectedProperty.length === 0 ? (
                  <div className="w-full text-xs text-rose-600 font-bold">
                    この物件に対応可能なスタッフがアカウント側で設定されていません。
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              {selectedPriorityStaffIds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  優先スタッフは未設定です。
                </div>
              ) : (
                selectedPriorityStaffIds.map((staffId, index) => {
                  const staff = staffMap.get(staffId);
                  if (!staff) return null;
                  const notAvailable = selectedPropertyId ? !canHandleProperty(staff, selectedPropertyId) : false;
                  return (
                    <div
                      key={staffId}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                        notAvailable ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold">{staff.staff_name}</div>
                        <div className="text-xs text-slate-500">
                          {staff.staff_code || ""} / {staff.role || ""}
                          {notAvailable ? " / 対応可能物件に未設定" : ""}
                        </div>
                      </div>
                      {!readOnly ? (
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
                            disabled={index === selectedPriorityStaffIds.length - 1 || saving}
                            onClick={() => movePriority(index, 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-40"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => removePriority(staffId)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                          >
                            削除
                          </button>
                        </div>
                      ) : null}
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
