import { useEffect, useState } from "react";

type Worklog = {
  id: number;
  employee_name: string;
  property_name: string;
  room_name: string;
  start_time: string;
  end_time: string;
  work_minutes: number;
  created_at: string;
};

export default function AdminWorklogReportPage() {
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayWorklogs();
  }, []);

  async function fetchTodayWorklogs() {
    try {
      const res = await fetch("/api/worklogs/today");
      const data = await res.json();
      setWorklogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">本日の実働報告</h1>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100">
            <tr>
              <th className="p-3 text-left">名前</th>
              <th className="p-3 text-left">物件</th>
              <th className="p-3 text-left">部屋</th>
              <th className="p-3 text-left">開始</th>
              <th className="p-3 text-left">終了</th>
              <th className="p-3 text-left">実働</th>
            </tr>
          </thead>

          <tbody>
            {worklogs.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3">{w.employee_name}</td>
                <td className="p-3">{w.property_name}</td>
                <td className="p-3">{w.room_name}</td>
                <td className="p-3">{w.start_time}</td>
                <td className="p-3">{w.end_time}</td>
                <td className="p-3">{w.work_minutes}分</td>
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
