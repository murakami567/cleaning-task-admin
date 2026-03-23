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

const SHIFT_STATUS_OPTIONS = [
  { value: "出勤", label: "出勤" },
  { value: "休み", label: "休み" },
  { value: "半休", label: "半休" },
  { value: "応援", label: "応援" },
  { value: "未定", label: "未定" },
];

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
  if (status === "休み") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "半休") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "応援") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function ShiftManagementPage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftDay, setShiftDay] = useState<ShiftDay | null>(null);
  const [loading, setLoading] = useState(false);

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
          body: JSON.stringify({
            shift_date: shiftDate,
            note: "",
          }),
        });
        const created = await createRes.json();
        setShiftDay({ ...created, shift_entries: [] });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaffs();
  }, []);

  useEffect(() => {
    void loadShift(selectedDate);
  }, [selectedDate]);

  const entryMap = useMemo(() => {
    const map = new Map<string, ShiftEntry>();
    (shiftDay?.shift_entries || []).forEach((e) => {
      map.set(e.staff_id, e);
    });
    return map;
  }, [shiftDay]);

  const saveEntry = async (staffId: string, patch: Partial<ShiftEntry>) => {
    if (!shiftDay) return;

    const current = entryMap.get(staffId);

    const body = {
      shift_day_id: shiftDay.id,
      staff_id: staffId,
      status: patch.status ?? current?.status ?? "未定",
      start_time: patch.start_time ?? current?.start_time ?? "09:00",
      end_time: patch.end_time ?? current?.end_time ?? "18:00",
      assigned_area: patch.assigned_area ?? current?.assigned_area ?? "",
      note: patch.note ?? current?.note ?? "",
    };

    const res = await fetch(`${API_BASE}/shifts/upsert_entry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      alert("シフト保存に失敗しました。");
      return;
    }

    await loadShift(selectedDate);
  };

  const summary = useMemo(() => {
    const entries = shiftDay?.shift_entries || [];
    return {
      出勤: entries.filter((x) => x.status === "出勤").length,
      休み: entries.filter((x) => x.status === "休み").length,
      半休: entries.filter((x) => x.status === "半休").length,
      応援: entries.filter((x) => x.status === "応援").length,
    };
  }, [shiftDay]);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">管理画面 ＞ シフト管理</div>
          <div className="text-base font-extrabold mt-1">シフト管理</div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <TextInput type="date" value={selectedDate} onChange={setSelectedDate} />
          <Button onClick={() => void loadShift(selectedDate)}>更新</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["出勤", "休み", "半休", "応援"] as const).map((k) => (
          <Card key={k}>
            <div className="p-4">
              <div className="text-xs text-slate-500">{k}</div>
              <div className="text-3xl font-black mt-2">{summary[k]}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold">日別シフト一覧</div>
            <div className="text-xs text-slate-500 mt-1">
              {selectedDate} / {loading ? "読み込み中..." : "保存は即時反映"}
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-3 py-3">スタッフ</th>
                <th className="text-left px-3 py-3 w-[140px]">区分</th>
                <th className="text-left px-3 py-3 w-[130px]">開始</th>
                <th className="text-left px-3 py-3 w-[130px]">終了</th>
                <th className="text-left px-3 py-3 w-[160px]">担当エリア</th>
                <th className="text-left px-3 py-3">備考</th>
                <th className="text-left px-3 py-3 w-[120px]">状態</th>
              </tr>
            </thead>
            <tbody>
              {staffs.map((staff) => {
                const entry = entryMap.get(staff.id);

                return (
                  <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="font-extrabold">{staff.staff_name}</div>
                      <div className="text-xs text-slate-500">{staff.staff_code || ""}</div>
                    </td>

                    <td className="px-3 py-3">
                      <Select
                        value={entry?.status || "未定"}
                        onChange={(v: string) => void saveEntry(staff.id, { status: v })}
                        options={SHIFT_STATUS_OPTIONS}
                      />
                    </td>

                    <td className="px-3 py-3">
                      <TextInput
                        type="time"
                        value={entry?.start_time || "09:00"}
                        onChange={(v: string) => void saveEntry(staff.id, { start_time: v })}
                      />
                    </td>

                    <td className="px-3 py-3">
                      <TextInput
                        type="time"
                        value={entry?.end_time || "18:00"}
                        onChange={(v: string) => void saveEntry(staff.id, { end_time: v })}
                      />
                    </td>

                    <td className="px-3 py-3">
                      <TextInput
                        value={entry?.assigned_area || ""}
                        onChange={(v: string) => void saveEntry(staff.id, { assigned_area: v })}
                        placeholder="例）FFF / 全体"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <TextInput
                        value={entry?.note || ""}
                        onChange={(v: string) => void saveEntry(staff.id, { note: v })}
                        placeholder="備考"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                          entry?.status || "未定"
                        )}`}
                      >
                        {entry?.status || "未定"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
