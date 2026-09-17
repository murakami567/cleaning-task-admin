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
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [newLocations, setNewLocations] = useState<string[]>([]);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [newNote, setNewNote] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
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
        next[s.id] = {
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
    setShowAdd(false);
    setSelectedStaffIds([]);
  }, [selectedDate]);

  const staffMap = useMemo(() => new Map(staffs.map((s) => [s.id, s])), [staffs]);

  const sortedSchedules = useMemo(
    () =>
      [...schedules].sort((a, b) => {
        const sa = staffMap.get(a.staff_id);
        const sb = staffMap.get(b.staff_id);
        return (sa?.sort_order ?? 9999) - (sb?.sort_order ?? 9999) ||
          (sa?.staff_name || "").localeCompare(sb?.staff_name || "", "ja");
      }),
    [schedules, staffMap]
  );

  const selectableStaffs = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    const registered = new Set(schedules.map((s) => s.staff_id));
    return [...staffs]
      .filter((s) => !registered.has(s.id))
      .filter((s) => !q || `${s.staff_name} ${s.staff_code || ""}`.toLowerCase().includes(q))
      .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999) || a.staff_name.localeCompare(b.staff_name, "ja"));
  }, [staffs, schedules, staffSearch]);

  const patchDraft = (scheduleId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [scheduleId]: {
        locations: prev[scheduleId]?.locations || [],
        note: prev[scheduleId]?.note || "",
        locationInput: prev[scheduleId]?.locationInput || "",
        ...patch,
      },
    }));
  };

  const addDraftLocation = (scheduleId: string) => {
    const d = drafts[scheduleId];
    const value = d?.locationInput.trim();
    if (!value) return;
    patchDraft(scheduleId, {
      locations: d.locations.includes(value) ? d.locations : [...d.locations, value],
      locationInput: "",
    });
  };

  const addNewLocation = () => {
    const value = newLocationInput.trim();
    if (!value) return;
    setNewLocations((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setNewLocationInput("");
  };

  const saveSchedule = async (schedule: MateSchedule) => {
    const d = drafts[schedule.id];
    if (!d) return;
    try {
      setSavingId(schedule.id);
      const res = await fetch(`${API_BASE}/mate-schedules/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shift_date: selectedDate,
          staff_id: schedule.staff_id,
          locations: d.locations,
          note: d.note,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSchedules(selectedDate);
    } catch (e: any) {
      alert(`保存に失敗しました: ${e?.message || ""}`);
    } finally {
      setSavingId(null);
    }
  };

  const deleteSchedule = async (schedule: MateSchedule) => {
    const name = staffMap.get(schedule.staff_id)?.staff_name || "このメイト";
    if (!window.confirm(`${name} の勤務予定を削除しますか？`)) return;
    try {
      setSavingId(schedule.id);
      const res = await fetch(`${API_BASE}/mate-schedules/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: schedule.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSchedules(selectedDate);
    } catch (e: any) {
      alert(`削除に失敗しました: ${e?.message || ""}`);
    } finally {
      setSavingId(null);
    }
  };

  const bulkSave = async () => {
    if (selectedStaffIds.length === 0) return alert("メイトを1名以上選択してください。");
    if (newLocations.length === 0) return alert("出勤場所を1件以上登録してください。");
    try {
      setBulkSaving(true);
      for (const staffId of selectedStaffIds) {
        const res = await fetch(`${API_BASE}/mate-schedules/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            shift_date: selectedDate,
            staff_id: staffId,
            locations: newLocations,
            note: newNote,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setShowAdd(false);
      setSelectedStaffIds([]);
      setStaffSearch("");
      setNewLocations([]);
      setNewLocationInput("");
      setNewNote("");
      await loadSchedules(selectedDate);
    } catch (e: any) {
      alert(`登録に失敗しました: ${e?.message || ""}`);
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">管理画面 ＞ スケジュール ＞ メイト</div>
            <div className="mt-1 text-base font-extrabold">メイト勤務予定</div>
            <div className="mt-1 text-xs text-slate-500">勤務予定があるメイトのみ登録・管理します。</div>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" />
            <button onClick={() => void loadSchedules(selectedDate)} className="h-10 rounded-full border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50">更新</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <div className="text-sm font-extrabold">{selectedDate} の勤務予定</div>
            <div className="mt-1 text-xs text-slate-500">登録済み {schedules.length}名</div>
          </div>
          <button onClick={() => setShowAdd((v) => !v)} className="h-10 rounded-full bg-slate-900 px-5 text-sm font-bold text-white hover:bg-black">
            {showAdd ? "閉じる" : "＋ 勤務予定を追加"}
          </button>
        </div>

        {showAdd && (
          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4 text-sm font-extrabold">勤務予定を一括登録</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-bold text-slate-600">メイトを選択（複数可）</div>
                <input value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} placeholder="名前・コードで検索" className="mb-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" />
                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                  {selectableStaffs.length === 0 ? <div className="p-3 text-center text-xs text-slate-400">選択できるメイトがいません。</div> : selectableStaffs.map((staff) => (
                    <label key={staff.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                      <input type="checkbox" checked={selectedStaffIds.includes(staff.id)} onChange={(e) => setSelectedStaffIds((prev) => e.target.checked ? [...prev, staff.id] : prev.filter((id) => id !== staff.id))} className="h-4 w-4" />
                      <span className="text-sm font-bold">{staff.staff_name}</span>
                      {staff.staff_code && <span className="text-xs text-slate-400">{staff.staff_code}</span>}
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-xs font-bold text-slate-500">{selectedStaffIds.length}名選択中</div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-xs font-bold text-slate-600">出勤場所</div>
                  <div className="flex gap-2">
                    <input value={newLocationInput} onChange={(e) => setNewLocationInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewLocation(); } }} placeholder="例）FFFホテル" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none" />
                    <button onClick={addNewLocation} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold hover:bg-slate-50">追加</button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {newLocations.map((loc) => <button key={loc} onClick={() => setNewLocations((prev) => prev.filter((x) => x !== loc))} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">{loc} ×</button>)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold text-slate-600">連絡事項</div>
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={4} placeholder="当日の指示・注意事項など" className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" />
                </div>
                <div className="flex justify-end">
                  <button disabled={bulkSaving} onClick={() => void bulkSave()} className="h-10 rounded-full bg-slate-900 px-6 text-sm font-bold text-white hover:bg-black disabled:opacity-50">{bulkSaving ? "登録中..." : `${selectedStaffIds.length}名を登録`}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {loading && <div className="p-10 text-center text-sm text-slate-500">読み込み中...</div>}
          {!loading && sortedSchedules.length === 0 && <div className="p-12 text-center"><div className="text-sm font-bold text-slate-600">この日の勤務予定はありません。</div><div className="mt-1 text-xs text-slate-400">「＋ 勤務予定を追加」から登録してください。</div></div>}
          {!loading && sortedSchedules.map((schedule) => {
            const staff = staffMap.get(schedule.staff_id);
            const d = drafts[schedule.id] || { locations: [], note: "", locationInput: "" };
            return (
              <div key={schedule.id} className="p-4">
                <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(260px,1fr)_170px] lg:items-start">
                  <div>
                    <div className="font-extrabold text-slate-900">{staff?.staff_name || "不明なメイト"}</div>
                    <div className="mt-1 text-xs text-slate-500">{staff?.staff_code || ""}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-500">出勤場所</div>
                    <div className="flex gap-2">
                      <input value={d.locationInput} onChange={(e) => patchDraft(schedule.id, { locationInput: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDraftLocation(schedule.id); } }} placeholder="出勤場所を追加" className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none" />
                      <button onClick={() => addDraftLocation(schedule.id)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold hover:bg-slate-50">追加</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{d.locations.map((loc) => <button key={loc} onClick={() => patchDraft(schedule.id, { locations: d.locations.filter((x) => x !== loc) })} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">{loc} ×</button>)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold text-slate-500">連絡事項</div>
                    <textarea value={d.note} onChange={(e) => patchDraft(schedule.id, { note: e.target.value })} rows={3} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                  </div>
                  <div className="flex gap-2 lg:justify-end">
                    <button disabled={savingId === schedule.id} onClick={() => void saveSchedule(schedule)} className="h-9 rounded-full bg-slate-900 px-4 text-xs font-bold text-white hover:bg-black disabled:opacity-50">保存</button>
                    <button disabled={savingId === schedule.id} onClick={() => void deleteSchedule(schedule)} className="h-9 rounded-full border border-red-200 px-4 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">削除</button>
                  </div>
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
          <button onClick={() => setTab("employee")} className={`rounded-lg px-5 py-2 text-sm font-bold transition ${tab === "employee" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>社員</button>
          <button onClick={() => setTab("mate")} className={`rounded-lg px-5 py-2 text-sm font-bold transition ${tab === "mate" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>メイト</button>
        </div>
      </div>
      {tab === "employee" ? <ShiftManagementPage /> : <MateSchedulePage />}
    </div>
  );
}
