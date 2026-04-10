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

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}分`;
  return `${h}時間${m}分`;
}

function workTypeLabel(workType: string) {
  switch (workType) {
    case "cleaning":
      return "清掃";
    case "inspection":
      return "点検";
    case "linen":
      return "リネン対応";
    case "support":
      return "補助作業";
    default:
      return workType || "-";
  }
}

export default function AdminWorklogReportPage() {
  const [date, setDate] = useState("");
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTodayWorklogs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("admin_access_token") || "";

      const res = await fetch(`${API_BASE}/api/admin-portal/worklogs/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`worklogs fetch failed: ${res.status} / ${text}`);
      }

      const data = JSON.parse(text);

      setDate(data?.date || "");
      setWorklogs(Array.isArray(data?.worklogs) ? data.worklogs : []);
    } catch (e) {
      console.error(e);
      setError("実働報告の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTodayWorklogs();
  }, []);

  const totalMinutes = useMemo(
    () => worklogs.reduce((sum, row) => sum + Number(row.work_minutes || 0), 0),
    [worklogs]
  );

  const totalCount = worklogs.length;

  const uniqueStaffCount = useMemo(() => {
    const set = new Set(worklogs.map((w) => w.user_id).filter(Boolean));
    return set.size;
  }, [worklogs]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="text-[18px] font-extrabold">管理ページ | 実働報告</div>
              <div className="mt-1 text-sm text-slate-500">
                一般画面から今日登録された実働内容を確認します。
              </div>
              <div className="mt-2 text-sm text-slate-500">
                対象日: {date || "本日"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadTodayWorklogs()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50"
            >
              更新
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard label="報告件数" value={totalCount} />
          <SummaryCard label="報告スタッフ数" value={uniqueStaffCount} />
          <SummaryCard label="総実働時間" value={formatMinutes(totalMinutes)} />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            読み込み中...
          </div>
        ) : worklogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            本日の実働報告はありません。
          </div>
        ) : (
          <Card>
            <div className="overflow-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">スタッフ</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">物件</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">部屋</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">開始</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">終了</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">休憩</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">実働</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">作業種別</th>
                    <th className="border-b bg-slate-50 px-4 py-3 text-left font-bold">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {worklogs.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="border-b px-4 py-3">
                        <div className="font-medium">{row.staff_name || "-"}</div>
                        <div className="text-xs text-slate-500">{row.staff_code || ""}</div>
                      </td>
                      <td className="border-b px-4 py-3">{row.property_name || "-"}</td>
                      <td className="border-b px-4 py-3">{row.room_name || "-"}</td>
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
