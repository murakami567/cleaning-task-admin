import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

type EmployeeSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  propertyName: string;
  roomName?: string;
  title: string;
  status?: string;
  note?: string;
};

export default function EmployeeSchedulePage() {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await api.get("/api/employee/schedule");
      setSchedules(Array.isArray(data?.schedules) ? data.schedules : []);
    } catch (error) {
      console.error("スケジュール取得エラー:", error);
      setErrorMessage("スケジュールの取得に失敗しました。");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  const propertyOptions = useMemo(() => {
    const list = schedules
      .map((item) => item.propertyName)
      .filter((value) => !!value);
    return Array.from(new Set(list));
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      const matchesDate = dateFilter ? item.date === dateFilter : true;
      const matchesProperty =
        propertyFilter === "all" ? true : item.propertyName === propertyFilter;
      return matchesDate && matchesProperty;
    });
  }, [schedules, dateFilter, propertyFilter]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">スケジュール</h1>
            <p className="text-sm text-slate-500 mt-1">
              担当予定を日付ごとに確認できます
            </p>
          </div>

          <Link
            to="/employee/home"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            ホームへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                日付
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                物件
              </label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="all">すべて</option>
                {propertyOptions.map((property) => (
                  <option key={property} value={property}>
                    {property}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchSchedules}
                className="w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800"
              >
                再読み込み
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-sm text-slate-500">
            読み込み中...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 shadow-sm text-sm text-red-600">
            {errorMessage}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-sm text-slate-500">
            表示できるスケジュールはありません。
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSchedules.map((item) => (
              <ScheduleCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ScheduleCard({ item }: { item: EmployeeSchedule }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">{item.title}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {item.propertyName}
            {item.roomName ? ` / ${item.roomName}` : ""}
          </p>
        </div>

        {item.status ? <StatusBadge status={item.status} /> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <InfoItem label="日付" value={item.date || "-"} />
        <InfoItem
          label="時間"
          value={`${item.startTime || "--:--"} 〜 ${item.endTime || "--:--"}`}
        />
        <InfoItem label="部屋" value={item.roomName || "-"} />
      </div>

      {item.note ? (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
          {item.note}
        </div>
      ) : null}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    scheduled: {
      label: "予定",
      className: "bg-sky-50 text-sky-700 border-sky-200",
    },
    in_progress: {
      label: "進行中",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    completed: {
      label: "完了",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  };

  const current = map[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}
