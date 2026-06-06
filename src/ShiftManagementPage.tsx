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

type ShiftEntry = {
  id?: string;
  shift_day_id: string;
  staff_id: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  assigned_area: string | null;
  note: string | null;
  staff_members?: Staff;
};

type ShiftDay = {
  id: string;
  shift_date: string;
  note: string | null;
  shift_entries: ShiftEntry[];
};

type StaffSchedule = {
  id: string;
  shift_date: string;
  staff_id: string;
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  place: string | null;
  work_category: string | null;
  details: string | null;
};

// 区分は 3 種類のみ。
const SHIFT_STATUS_OPTIONS = [
  { value: "出勤", label: "出勤" },
  { value: "欠勤", label: "欠勤" },
  { value: "遅刻", label: "遅刻" },
];

const VISIBLE_STATUS_SET = new Set(["出勤", "欠勤", "遅刻"]);

// 15 分刻みの時刻オプション 00:00..23:45
const TIME_OPTIONS_15 = (() => {
  const out: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const v = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      out.push({ value: v, label: v });
    }
  }
  return out;
})();

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

function Card({ children }: any) {
  return <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">{children}</div>;
}

function TextInput({ value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <input
      type={type}
      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Select({ value, onChange, options }: any) {
  return (
    <select
      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none bg-white"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function statusClass(status: string) {
  if (status === "出勤") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "欠勤") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "遅刻") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function normalizeTime(t?: string | null) {
  if (!t) return "";
  return String(t).slice(0, 5); // "HH:MM:SS" -> "HH:MM"
}

function timeToMinutes(t: string) {
  if (!t) return -1;
  const [hh, mm] = t.split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

export default function ShiftManagementPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftDay, setShiftDay] = useState<ShiftDay | null>(null);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleStaff, setScheduleStaff] = useState<Staff | null>(null);
  const [nowMin, setNowMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const currentUser: { id: string; role?: string } | null = useMemo(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.id ? { id: String(obj.id), role: obj.role } : null;
    } catch {
      return null;
    }
  }, []);
  const adminToken = useMemo(() => localStorage.getItem("admin_access_token") || "", []);

  // 1 分ごとに「現在時刻」を更新
  useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const loadStaffs = async () => {
    const res = await fetch(`${API_BASE}/staffs`);
    const data = await res.json();
    setStaffs((data || []).filter((x: Staff) => x.is_active));
  };

  const loadShift = async (shiftDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shifts?shift_date=${shiftDate}`);
      const data = await res.json();

      if (data && data.length > 0) {
        setShiftDay(data[0]);
      } else {
        const createRes = await fetch(`${API_BASE}/shifts/create_day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shift_date: shiftDate, note: "" }),
        });
        const created = await createRes.json();
        setShiftDay({ ...created, shift_entries: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (shiftDate: string) => {
    try {
      const res = await fetch(`${API_BASE}/staff-schedules?shift_date=${shiftDate}`);
      if (!res.ok) throw new Error(`schedules fetch failed: ${res.status}`);
      const data = await res.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSchedules([]);
    }
  };

  useEffect(() => {
    void loadStaffs();
  }, []);

  useEffect(() => {
    void loadShift(selectedDate);
    void loadSchedules(selectedDate);
  }, [selectedDate]);

  const entryMap = useMemo(() => {
    const map = new Map<string, ShiftEntry>();
    (shiftDay?.shift_entries || []).forEach((e) => {
      map.set(e.staff_id, e);
    });
    return map;
  }, [shiftDay]);

  // 区分が 出勤/欠勤/遅刻 のスタッフのみ表示。
  // (シフト表で 出勤 と設定されたメンバーが対象。その後 欠勤/遅刻 に変更しても表示は維持)
  const visibleStaff = useMemo(() => {
    return staffs.filter((s) => {
      const entry = entryMap.get(s.id);
      return entry && VISIBLE_STATUS_SET.has(entry.status);
    });
  }, [staffs, entryMap]);

  const filteredStaffs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleStaff;
    return visibleStaff.filter((s) => {
      const name = (s.staff_name || "").toLowerCase();
      const code = (s.staff_code || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [visibleStaff, searchQuery]);

  // 各スタッフの「今この瞬間に重なっている予定」
  const activeSchedulesByStaff = useMemo(() => {
    const map = new Map<string, StaffSchedule[]>();
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);
    schedules.forEach((sch) => {
      // 当日でない場合は「今」概念がないので全予定を出す
      if (isToday) {
        const s = timeToMinutes(normalizeTime(sch.start_time));
        const e = timeToMinutes(normalizeTime(sch.end_time));
        if (s < 0 || e < 0) return;
        if (!(s <= nowMin && nowMin < e)) return;
      }
      const arr = map.get(sch.staff_id) || [];
      arr.push(sch);
      map.set(sch.staff_id, arr);
    });
    return map;
  }, [schedules, nowMin, selectedDate]);

  const saveEntry = async (staffId: string, patch: Partial<ShiftEntry>) => {
    if (!shiftDay) return;

    const current = entryMap.get(staffId);

    const body = {
      shift_day_id: shiftDay.id,
      staff_id: staffId,
      status: patch.status ?? current?.status ?? "出勤",
      start_time: patch.start_time ?? current?.start_time ?? "09:00",
      end_time: patch.end_time ?? current?.end_time ?? "18:00",
      assigned_area: patch.assigned_area ?? current?.assigned_area ?? "",
      note: patch.note ?? current?.note ?? "",
    };

    const res = await fetch(`${API_BASE}/shifts/upsert_entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      alert("シフト保存に失敗しました。");
      return;
    }

    await loadShift(selectedDate);
  };

  const summary = useMemo(() => {
    const entries = (shiftDay?.shift_entries || []).filter((e) =>
      VISIBLE_STATUS_SET.has(e.status)
    );
    return {
      出勤: entries.filter((x) => x.status === "出勤").length,
      欠勤: entries.filter((x) => x.status === "欠勤").length,
      遅刻: entries.filter((x) => x.status === "遅刻").length,
    };
  }, [shiftDay]);

  const openScheduleModal = (staff: Staff) => setScheduleStaff(staff);
  const closeScheduleModal = () => setScheduleStaff(null);

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">管理画面 ＞ シフト管理</div>
          <div className="text-base font-extrabold mt-1">シフト管理</div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <TextInput type="date" value={selectedDate} onChange={setSelectedDate} />
          <Button onClick={() => { void loadShift(selectedDate); void loadSchedules(selectedDate); }}>更新</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["出勤", "欠勤", "遅刻"] as const).map((k) => (
          <Card key={k}>
            <div className="p-4">
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-3xl font-black mt-2">{summary[k]}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold">日別シフト一覧</div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedDate} / {loading ? "読み込み中..." : "保存は即時反映"}
              {isToday ? (
                <span className="ml-2">／ 予定は現在時刻 {String(Math.floor(nowMin / 60)).padStart(2, "0")}:{String(nowMin % 60).padStart(2, "0")} と重なるもののみ表示</span>
              ) : (
                <span className="ml-2">／ 当日以外は全予定を表示</span>
              )}
              {searchQuery.trim() ? (
                <span className="ml-2">
                  ／ 該当 {filteredStaffs.length} 件 / 全 {visibleStaff.length} 件
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-[320px]">
            <TextInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="スタッフ名・コードで検索"
            />
            {searchQuery ? (
              <Button onClick={() => setSearchQuery("")}>クリア</Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-3 py-3 w-[180px]">スタッフ</th>
                <th className="text-left px-3 py-3 w-[140px]">区分</th>
                <th className="text-left px-3 py-3 w-[130px]">時間</th>
                <th className="text-left px-3 py-3 w-[160px]">場所</th>
                <th className="text-left px-3 py-3 w-[140px]">作業分類</th>
                <th className="text-left px-3 py-3">備考</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                    {searchQuery.trim()
                      ? "該当するスタッフが見つかりませんでした。"
                      : "出勤予定のスタッフがいません（シフト表で出勤に設定してください）。"}
                  </td>
                </tr>
              ) : null}
              {filteredStaffs.map((staff) => {
                const entry = entryMap.get(staff.id);
                const actives = activeSchedulesByStaff.get(staff.id) || [];

                return (
                  <tr
                    key={staff.id}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openScheduleModal(staff)}
                  >
                    <td className="px-3 py-3">
                      <div className="font-extrabold">{staff.staff_name}</div>
                      <div className="text-xs text-slate-500">{staff.staff_code || ""}</div>
                    </td>

                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={entry?.status || "出勤"}
                        onChange={(v: string) => void saveEntry(staff.id, { status: v })}
                        options={SHIFT_STATUS_OPTIONS}
                      />
                      <div className="mt-1">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClass(
                            entry?.status || "出勤"
                          )}`}
                        >
                          {entry?.status || "出勤"}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-700">
                      {actives.length === 0 ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <div className="space-y-1">
                          {actives.map((s) => (
                            <div key={s.id}>
                              {normalizeTime(s.start_time)}〜{normalizeTime(s.end_time)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-700">
                      {actives.length === 0 ? "-" : (
                        <div className="space-y-1">
                          {actives.map((s) => (
                            <div key={s.id}>{s.place || "-"}</div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-700">
                      {actives.length === 0 ? "-" : (
                        <div className="space-y-1">
                          {actives.map((s) => (
                            <div key={s.id}>{s.work_category || "-"}</div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-700">
                      {actives.length === 0 ? "-" : (
                        <div className="space-y-1">
                          {actives.map((s) => (
                            <div key={s.id} className="whitespace-pre-wrap">{s.details || "-"}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {scheduleStaff ? (
        <ScheduleModal
          staff={scheduleStaff}
          date={selectedDate}
          schedules={schedules.filter((s) => s.staff_id === scheduleStaff.id)}
          canEdit={!!currentUser && currentUser.id === scheduleStaff.id}
          adminToken={adminToken}
          onClose={closeScheduleModal}
          onChanged={() => void loadSchedules(selectedDate)}
        />
      ) : null}
    </div>
  );
}

function ScheduleModal({
  staff,
  date,
  schedules,
  canEdit,
  adminToken,
  onClose,
  onChanged,
}: {
  staff: Staff;
  date: string;
  schedules: StaffSchedule[];
  canEdit: boolean;
  adminToken: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  type Draft = {
    id?: string;
    start_time: string;
    end_time: string;
    place: string;
    work_category: string;
    details: string;
  };

  const initialDrafts: Draft[] = schedules
    .slice()
    .sort((a, b) => normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time)))
    .map((s) => ({
      id: s.id,
      start_time: normalizeTime(s.start_time),
      end_time: normalizeTime(s.end_time),
      place: s.place || "",
      work_category: s.work_category || "",
      details: s.details || "",
    }));

  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  const handleAdd = () => {
    setDrafts((prev) => [
      ...prev,
      {
        start_time: "09:00",
        end_time: "10:00",
        place: "",
        work_category: "",
        details: "",
      },
    ]);
  };

  const updateDraft = (idx: number, patch: Partial<Draft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const handleSave = async (idx: number) => {
    const d = drafts[idx];
    if (d.end_time <= d.start_time) {
      alert("終了時間は開始時間より後にしてください。");
      return;
    }
    try {
      setSavingIdx(idx);
      const res = await fetch(`${API_BASE}/staff-schedules/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          id: d.id,
          shift_date: date,
          staff_id: staff.id,
          start_time: d.start_time,
          end_time: d.end_time,
          place: d.place,
          work_category: d.work_category,
          details: d.details,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `${res.status}`);
      }
      const saved = await res.json();
      // 新規追加だった場合は id をセットして使い回せるように
      setDrafts((prev) => prev.map((x, i) => (i === idx ? { ...x, id: saved.id } : x)));
      onChanged();
    } catch (e: any) {
      console.error(e);
      alert(`保存に失敗しました: ${e?.message || ""}`);
    } finally {
      setSavingIdx(null);
    }
  };

  const handleDelete = async (idx: number) => {
    const d = drafts[idx];
    if (!d.id) {
      setDrafts((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm("この予定を削除しますか？")) return;
    try {
      setSavingIdx(idx);
      const res = await fetch(`${API_BASE}/staff-schedules/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id: d.id }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `${res.status}`);
      }
      setDrafts((prev) => prev.filter((_, i) => i !== idx));
      onChanged();
    } catch (e: any) {
      console.error(e);
      alert(`削除に失敗しました: ${e?.message || ""}`);
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs text-slate-500">{date} のスケジュール</div>
            <div className="text-lg font-extrabold">{staff.staff_name}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-3">
          {!canEdit ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              本人のみ編集できます。閲覧専用で表示しています。
            </div>
          ) : null}

          {drafts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center">
              スケジュール未登録
            </div>
          ) : null}

          {drafts.map((d, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="mb-1 text-[10px] font-semibold text-slate-500">開始</div>
                  <Select
                    value={d.start_time}
                    onChange={(v: string) => updateDraft(idx, { start_time: v })}
                    options={TIME_OPTIONS_15}
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-semibold text-slate-500">終了</div>
                  <Select
                    value={d.end_time}
                    onChange={(v: string) => updateDraft(idx, { end_time: v })}
                    options={TIME_OPTIONS_15}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 text-[10px] font-semibold text-slate-500">場所</div>
                <TextInput
                  value={d.place}
                  onChange={(v: string) => updateDraft(idx, { place: v })}
                  placeholder="例) FFFホテル 1001"
                />
              </div>

              <div>
                <div className="mb-1 text-[10px] font-semibold text-slate-500">作業分類</div>
                <TextInput
                  value={d.work_category}
                  onChange={(v: string) => updateDraft(idx, { work_category: v })}
                  placeholder="例) 清掃 / 点検 / 移動"
                />
              </div>

              <div>
                <div className="mb-1 text-[10px] font-semibold text-slate-500">詳細</div>
                <textarea
                  value={d.details}
                  onChange={(e) => updateDraft(idx, { details: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y"
                  placeholder="自由記述"
                />
              </div>

              {canEdit ? (
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    onClick={() => void handleDelete(idx)}
                    disabled={savingIdx === idx}
                  >
                    削除
                  </Button>
                  <Button
                    className="bg-slate-900 text-white border-slate-900 hover:bg-black"
                    onClick={() => void handleSave(idx)}
                    disabled={savingIdx === idx}
                  >
                    {savingIdx === idx ? "保存中" : d.id ? "更新" : "登録"}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}

          {canEdit ? (
            <Button
              className="w-full border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100"
              onClick={handleAdd}
            >
              ＋ 予定を追加
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
