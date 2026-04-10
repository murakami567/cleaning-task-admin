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
  work_minutes: number;
};

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

  async function fetchTodayWorklogs() {
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
    } catch (err) {
      console.error("実働報告取得エラー:", err);
      setError(err instanceof Error ? err.message : "実働報告の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTodayWorklogs();
  }, []);

  const totalMinutes = useMemo(
    () => worklogs.reduce((sum, row) => sum + Number(row.work_minutes || 0), 0),
    [worklogs]
  );

  const uniqueStaffCount = useMemo(() => {
    const set = new Set(worklogs.map((w) => w.user_id).filter(Boolean));
    return set.size;
  }, [worklogs]);

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">本日の実働報告</h1>
          <div className="mt-1 text-sm text-slate-500">対象日: {date || "本日"}</div>
        </div>

        <button
          type="button"
          onClick={() => void fetchTodayWorklogs()}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50"
        >
          更新
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">報告件数</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{worklogs.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">報告スタッフ数</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{uniqueStaffCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">総実働時間</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatMinutes(totalMinutes)}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-neutral-100">
            <tr>
              <th className="p-3 text-left">名前</th>
              <th className="p-3 text-left">物件</th>
              <th className="p-3 text-left">部屋</th>
              <th className="p-3 text-left">開始</th>
              <th className="p-3 text-left">終了</th>
              <th className="p-3 text-left">休憩</th>
              <th className="p-3 text-left">実働</th>
              <th className="p-3 text-left">作業種別</th>
              <th className="p-3 text-left">備考</th>
            </tr>
          </thead>

          <tbody>
            {worklogs.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{w.staff_name || "-"}</div>
                  <div className="text-xs text-slate-500">{w.staff_code || ""}</div>
                </td>
                <td className="p-3">{w.property_name || "-"}</td>
                <td className="p-3">{w.room_name || "-"}</td>
                <td className="p-3">{w.start_time || "-"}</td>
                <td className="p-3">{w.end_time || "-"}</td>
                <td className="p-3">{w.break_minutes || 0}分</td>
                <td className="p-3">{formatMinutes(Number(w.work_minutes || 0))}</td>
                <td className="p-3">{workTypeLabel(w.work_type)}</td>
                <td className="p-3 whitespace-pre-wrap">{w.note || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {worklogs.length === 0 && (
          <div className="p-6 text-center text-neutral-400">
            本日の報告はまだありません
          </div>
        )}
      </div>
    </div>
  );
}
