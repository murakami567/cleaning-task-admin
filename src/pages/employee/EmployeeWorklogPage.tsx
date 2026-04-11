import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type PropertyMaster = {
  id: string;
  property_name: string;
};

type RoomMaster = {
  id: string;
  property_id: string;
  room_name: string;
};

type WorkPlaceRow = {
  id: string;
  property_id: string;
  room_id: string;
};

const WORK_TYPE_OPTIONS = [
  { value: "cleaning", label: "清掃" },
  { value: "inspection", label: "インスペクション" },
  { value: "linen", label: "リネン" },
  { value: "support", label: "補助作業" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function makeRow(): WorkPlaceRow {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    property_id: "",
    room_id: "",
  };
}

function timeToMinutes(time: string) {
  if (!time || !time.includes(":")) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function EmployeeWorklogPage() {
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);

  const [workDate, setWorkDate] = useState(todayString());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakMinutes, setBreakMinutes] = useState("60");
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(["cleaning"]);
  const [rows, setRows] = useState<WorkPlaceRow[]>([makeRow()]);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadMasters();
  }, []);

  async function loadMasters() {
    try {
      setLoadingMasters(true);

      const [pRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/properties`),
        fetch(`${API_BASE}/rooms`),
      ]);

      if (!pRes.ok) throw new Error(`properties failed: ${pRes.status}`);
      if (!rRes.ok) throw new Error(`rooms failed: ${rRes.status}`);

      const pData = await pRes.json();
      const rData = await rRes.json();

      setProperties(Array.isArray(pData) ? pData : []);
      setRooms(Array.isArray(rData) ? rData : []);
    } catch (e) {
      console.error(e);
      setErrorMessage("物件・部屋データの取得に失敗しました。");
    } finally {
      setLoadingMasters(false);
    }
  }

  const actualMinutes = useMemo(() => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const rest = Number(breakMinutes || 0);

    if (!startTime || !endTime || end <= start) return 0;

    return Math.max(end - start - rest, 0);
  }, [startTime, endTime, breakMinutes]);

  function toggleWorkType(value: string) {
    setSelectedWorkTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function updateRow(rowId: string, key: keyof WorkPlaceRow, value: string) {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(rowId: string) {
    setRows((prev) => {
      if (prev.length === 1) {
        return [{ ...prev[0], property_id: "", room_id: "" }];
      }
      return prev.filter((row) => row.id !== rowId);
    });
  }

  function clearForm() {
    setWorkDate(todayString());
    setStartTime("10:00");
    setEndTime("18:00");
    setBreakMinutes("60");
    setSelectedWorkTypes(["cleaning"]);
    setRows([makeRow()]);
    setNote("");
    setSuccessMessage("");
    setErrorMessage("");
  }

  function getRoomsByProperty(propertyId: string) {
    return rooms.filter((room) => room.property_id === propertyId);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!workDate || !startTime || !endTime) {
      setErrorMessage("日付・出勤時刻・退勤時刻を入力してください。");
      return;
    }

    if (selectedWorkTypes.length === 0) {
      setErrorMessage("作業内容を1つ以上選択してください。");
      return;
    }

    const validRows = rows.filter((row) => row.property_id && row.room_id);

    if (validRows.length === 0) {
      setErrorMessage("物件 / 部屋を1件以上入力してください。");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("employee_access_token") || "";
      const workTypeValue = selectedWorkTypes.join(",");

      for (const row of validRows) {
        const property = properties.find((p) => p.id === row.property_id);
        const room = rooms.find((r) => r.id === row.room_id);

        if (!property || !room) continue;

        const res = await fetch(`${API_BASE}/api/employee/worklogs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            work_date: workDate,
            property_name: property.property_name,
            room_name: room.room_name,
            start_time: startTime,
            end_time: endTime,
            break_minutes: Number(breakMinutes || 0),
            work_type: workTypeValue,
            note,
          }),
        });

        const text = await res.text();

        if (!res.ok) {
          throw new Error(`実働登録失敗: ${res.status} / ${text}`);
        }
      }

      setSuccessMessage("実働を登録しました。");
      clearForm();
    } catch (error) {
      console.error("実働登録エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "実働登録に失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-4 pt-5 pb-4">
          <div>
            <div className="text-xs font-medium text-slate-500">一般画面</div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">実働記入</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 pt-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="p-5 md:p-6">
            <div className="text-3xl font-black text-slate-900">実働記入</div>
            <div className="mt-2 text-sm text-slate-500">
              送信はサーバー保存で登録します
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="日付">
                <TextInput type="date" value={workDate} onChange={setWorkDate} />
              </Field>

              <Field label="作業開始時間">
                <TextInput type="time" value={startTime} onChange={setStartTime} />
              </Field>

              <Field label="出勤時刻">
                <TextInput type="time" value={startTime} onChange={setStartTime} />
              </Field>

              <Field label="退勤時刻">
                <TextInput type="time" value={endTime} onChange={setEndTime} />
              </Field>

              <Field label="休憩（分）">
                <TextInput type="number" value={breakMinutes} onChange={setBreakMinutes} />
              </Field>

              <Field label="実働（分）">
                <input
                  type="text"
                  value={String(actualMinutes)}
                  readOnly
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
                />
              </Field>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-sm font-semibold text-slate-500">
                作業内容（複数選択）
              </div>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPE_OPTIONS.map((item) => {
                  const active = selectedWorkTypes.includes(item.value);

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggleWorkType(item.value)}
                      className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-500">
                  物件 / 部屋（＋で行を追加）
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white hover:bg-black"
                >
                  ＋
                </button>
              </div>

              <div className="space-y-3">
                {rows.map((row) => {
                  const roomOptions = getRoomsByProperty(row.property_id);

                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_1fr_44px] gap-3"
                    >
                      <div>
                        <div className="mb-2 text-sm font-semibold text-slate-500">物件</div>
                        <select
                          value={row.property_id}
                          onChange={(e) => {
                            updateRow(row.id, "property_id", e.target.value);
                            updateRow(row.id, "room_id", "");
                          }}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                          disabled={loadingMasters}
                        >
                          <option value="">選択してください</option>
                          {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.property_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-semibold text-slate-500">部屋</div>
                        <select
                          value={row.room_id}
                          onChange={(e) => updateRow(row.id, "room_id", e.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                          disabled={!row.property_id || loadingMasters}
                        >
                          <option value="">選択してください</option>
                          {roomOptions.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.room_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-500 hover:bg-slate-50"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <Field label="備考">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="例：分業 / 気づき / 引継ぎ"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none"
                />
              </Field>
            </div>

            {successMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-5">
            <button
              type="button"
              onClick={clearForm}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              クリア
            </button>

            <button
              type="submit"
              disabled={loading || loadingMasters}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50"
            >
              {loading ? "送信中..." : "送信"}
            </button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
    />
  );
}

function BottomNav() {
  const location = useLocation();

  const items = [
    { to: "/employee/home", label: "ホーム" },
    { to: "/employee/tasks", label: "タスク" },
    { to: "/employee/schedule", label: "予定" },
    { to: "/employee/worklog", label: "実働" },
    { to: "/employee/settings", label: "設定" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-2 py-2">
        {items.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
