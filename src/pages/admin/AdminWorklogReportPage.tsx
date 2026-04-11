import { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Worklog = {
  id: string;
  user_id: string;
  staff_name: string;
  staff_code: string;
  work_date: string;
  property_name: string;
  room_name: string;
  work_start_time: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  work_type: string;
  note: string;
  created_at: string;
  work_minutes: number;
};

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm">{children}</div>;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}分`;
  return `${h}時間${m}分`;
}

function workTypeLabel(workType: string) {
  if (!workType) return "-";

  const map: Record<string, string> = {
    cleaning: "清掃",
    inspection: "インスペクション",
    linen: "リネン",
    support: "補助作業",
  };

  return workType
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => map[t] || t)
    .join(" / ");
}

function matchesWorkTypeFilter(workType: string, filter: string) {
  if (filter === "all") return true;

  const values = (workType || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return values.includes(filter);
}

export default function AdminWorklogReportPage() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState<
    "all" | "cleaning" | "inspection" | "linen" | "support"
  >("all");

  const loadWorklogs = async (targetDate = selectedDate) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("admin_access_token") || "";

      const url = new URL(`${API_BASE}/api/admin-portal/worklogs/today`);
      url.searchParams.set("date", targetDate);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`worklogs fetch failed: ${res.status} / ${text}`);
      }

      const data = JSON.parse(text);

      setWorklogs(Array.isArray(data?.worklogs) ? data.worklogs : []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "実働報告の取得に失敗しました。");
      setWorklogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorklogs(selectedDate);
  }, [selectedDate]);

  const filteredWorklogs = useMemo(() => {
    return worklogs.filter((row) => matchesWorkTypeFilter(row.work_type, workTypeFilter));
  }, [worklogs, workTypeFilter]);

  const totalMinutes = useMemo(
    () => filteredWorklogs.reduce((sum, row) => sum + Number(row.work_minutes || 0), 0),
    [filteredWorklogs]
  );

  const totalCount = filteredWorklogs.length;

  const uniqueStaffCount = useMemo(() => {
    const set = new Set(filteredWorklogs.map((w) => w.user_id).filter(Boolean));
    return set.size;
  }, [filteredWorklogs]);

  const propertySummary = useMemo(() => {
    const map = new Map<string, number>();

    filteredWorklogs.forEach((row) => {
      const key = row.property_name || "未設定";
      map.set(key, (map.get(key) || 0) + Number(row.work_minutes || 0));
    });

    return Array.from(map.entries())
      .map(([propertyName, minutes]) => ({ propertyName, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [filteredWorklogs]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1380px] space-y-4">
        <Card>
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[18px] font-extrabold">管理ページ | 実働報告</div>
              <div className="mt-1 text-sm text-slate-500">
                一般画面から登録された実働内容を確認します。
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">対象日</div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                />
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-slate-500">作業種別</div>
                <select
                  value={workTypeFilter}
                  onChange={(e) =>
                    setWorkTypeFilter(
                      e.target.value as "all" | "cleaning" | "inspection" | "linen" | "support"
                    )
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                >
                  <option value="all">すべて</option>
                  <option value="cleaning">清掃</option>
                  <option value="inspection">インスペクション</option>
                  <option value="linen">リネン</option>
                  <option value="support">補助作業</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => void loadWorklogs(selectedDate)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold hover:bg-slate-50"
              >
                更新
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard label="報告件数" value={totalCount} />
          <SummaryCard label="報告スタッフ数" value={uniqueStaffCount} />
          <SummaryCard label="総作業時間" value={formatMinutes(totalMinutes)} />
        </div>

        {propertySummary.length > 0 ? (
          <Card>
            <div className="p-4">
              <div className="mb-3 text-base font-extrabold text-slate-900">物件別作業時間</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {propertySummary.map((item) => (
                  <div
                    key={item.propertyName}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="text-sm font-semibold text-slate-500">{item.propertyName}</div>
                    <div className="mt-2 text-xl font-black text-slate-900">
                      {formatMinutes(item.minutes)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            読み込み中...
          </div>
        ) : filteredWorklogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            対象日の実働報告はありません。
          </div>
        ) : (
          <Card>
            <div className="overflow-auto">
              <table className="w-full min-w-[1380px] text-sm">
                <thead>
                  <tr>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">スタッフ</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">日付</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">物件</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">作業開始</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">出勤</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">退勤</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">休憩</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">作業時間</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">作業種別</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorklogs.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="border-b px-4 py-3">
                        <div className="font-medium">{row.staff_name || "-"}</div>
                        <div className="text-xs text-slate-500">{row.staff_code || ""}</div>
                      </td>
                      <td className="border-b px-4 py-3">{row.work_date || "-"}</td>
                      <td className="border-b px-4 py-3">{row.property_name || "-"}</td>
                      <td className="border-b px-4 py-3">{row.room_name || "-"}</td>
                      <td className="border-b px-4 py-3">{row.work_start_time || "-"}</td>
                      <td className="border-b px-4 py-3">{row.start_time || "-"}</td>
                      <td className="border-b px-4 py-3">{row.end_time || "-"}</td>
                      <td className="border-b px-4 py-3">{row.break_minutes || 0}分</td>
                      <td className="border-b px-4 py-3 font-medium">
                        {formatMinutes(Number(row.work_minutes || 0))}
                      </td>
                      <td className="border-b px-4 py-3">{workTypeLabel(row.work_type)}</td>
                      <td className="border-b px-4 py-3 whitespace-pre-wrap">{row.note || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
