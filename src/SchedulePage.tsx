import React, { useEffect, useMemo, useState } from "react";
import ShiftManagementPage from "./ShiftManagementPage";

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

type MateSchedule = {
  id: string;
  shift_date: string;
  staff_id: string;
  locations: string[];
  note: string;
};

type Draft = {
  locations: string[];
  note: string;
  locationInput: string;
};

function MateSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<MateSchedule[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const token = useMemo(() => localStorage.getItem("admin_access_token") || "", []);

  const loadStaffs = async () => {
    const res = await fetch(`${API_BASE}/staffs`);
    const data = await res.json();
    setStaffs(
      (Array.isArray(data) ? data : []).filter(
        (s: Staff) => s.is_active && ["checker", "staff"].includes(String(s.role || "").toLowerCase())
      )
    );
  };

  const loadSchedules = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mate-schedules?shift_date=${date}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: MateSchedule[] = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSchedules(list);
      const next: Record<string, Draft> = {};
      list.forEach((s) => {
        next[s.staff_id] = {
          locations: Array.isArray(s.locations) ? s.locations : [],
          note: s.note || "",
          locationInput: "",
        };
      });
      setDrafts(next);
    } catch (e) {
      console.error(e);
      setSchedules([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaffs();
  }, []);

  useEffect(() => {
    void loadSchedules(selectedDate);
  }, [selectedDate]);

  const mateStaffs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...staffs].sort(
      (a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999) || a.staff_name.localeCompare(b.staff_name, "ja")
    );
    if (!q) return sorted;
    return sorted.filter((s) =>
      `${s.staff_name} ${s.staff_code || ""}`.toLowerCase().includes(q)
    );
  }, [staffs, search]);

  const getDraft = (staffId: string): Draft =>
    drafts[staffId] || { locations: [], note: "", locationInput: "" };

  const patchDraft = (staffId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [staffId]: { ...getDraft(staffId), ...prev[staffId], ...patch },
    }));
  };

  const addLocation = (staffId: string) => {
    const d = getDraft(staffId);
    const value = d.locationInput.trim();
    if (!value) return;
    const locations = d.locations.includes(value) ? d.locations : [...d.locations, value];
    patchDraft(staffId, { locations, locationInput: "" });
  };

  const removeLocation = (staffId: string, value: string) => {
    const d = getDraft(staffId);
    patchDraft(staffId, { locations: d.locations.filter((x) => x !== value) });
  };

  const save = async (staffId: string) => {
    const d = getDraft(staffId);
    try {
      setSavingId(staffId);
      const res = await fetch(`${API_BASE}/mate-schedules/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shift_date: selectedDate,
          staff_id: staffId,
          locations: d.locations,
          note: d.note,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSchedules(selectedDate);
    } catch (e: any) {
      console.error(e);
      alert(`保存に失敗しました: ${e?.message || ""}`);
    } finally {
      setSavingId(null);
    }
  };

  const registeredCount = schedules.filter((s) => (s.locations || []).length > 0 || s.note).length;

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">管理画面 ＞ スケジュール ＞ メイト</div>
            <div className="mt-1 text-base font-extrabold">メイト勤務予定</div>
            <div className="mt-1 text-xs text-slate-500">checker / staff の出勤場所と連絡事項を管理します。</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            />
            <button
              onClick={() => void loadSchedules(selectedDate)}
              className="h-10 rounded-full border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50"
            >
              更新
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">メイト対象</div>
          <div className="mt-2 text-3xl font-black">{staffs.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">予定登録済み</div>
          <div className="mt-2 text-3xl font-black">{registeredCount}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <div className="text-sm font-extrabold">{selectedDate} メイト一覧</div>
            <div className="mt-1 text-xs text-slate-500">出勤場所は複数登録できます。倉庫・事務所なども直接入力できます。</div>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="メイト名・コードで検索"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none sm:w-[320px]"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? <div className="p-8 text-center text-sm text-slate-500">読み込み中...</div> : null}
          {!loading && mateStaffs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">対象のメイトがいません。</div>
          ) : null}
          {!loading && mateStaffs.map((staff) => {
            const d = getDraft(staff.id);
            return (
              <div key={staff.id} className="p-4">
                <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(280px,1fr)_90px] lg:items-start">
                  <div>
                    <div className="font-extrabold text-slate-900">{staff.staff_name}</div>
                    <div className="mt-1 text-xs text-slate-500">{staff.staff_code || ""} / {staff.role}</div>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-500">出勤場所</div>
                    <div className="flex gap-2">
                      <input
                        value={d.locationInput}
                        onChange={(e) => patchDraft(staff.id, { locationInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addLocation(staff.id);
                          }
                        }}
                        placeholder="例) FFFホテル"
                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none"
                      />
                      <button
                        onClick={() => addLocation(staff.id)}
                        className="h-10 shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"
                      >
                        追加
                      </button>
                    </div>
                    {d.locations.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {d.locations.map((loc) => (
                          <button
                            key={loc}
                            onClick={() => removeLocation(staff.id, loc)}
                            className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                            title="クリックで削除"
                          >
                            {loc} ×
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-400">未登録</div>
                    )}
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-500">連絡事項</div>
                    <textarea
                      value={d.note}
                      onChange={(e) => patchDraft(staff.id, { note: e.target.value })}
                      placeholder="当日の指示・注意事項など"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <button
                    disabled={savingId === staff.id}
                    onClick={() => void save(staff.id)}
                    className="h-10 rounded-full border border-slate-900 bg-slate-900 px-4 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
                  >
                    {savingId === staff.id ? "保存中" : "保存"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [tab, setTab] = useState<"employee" | "mate">("employee");

  return (
    <div>
      <div className="px-4 pt-4">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("employee")}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition ${
              tab === "employee" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            社員
          </button>
          <button
            onClick={() => setTab("mate")}
            className={`rounded-lg px-5 py-2 text-sm font-bold transition ${
              tab === "mate" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            メイト
          </button>
        </div>
      </div>

      {tab === "employee" ? <ShiftManagementPage /> : <MateSchedulePage />}
    </div>
  );
}
