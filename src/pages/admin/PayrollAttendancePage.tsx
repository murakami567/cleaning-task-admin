import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";

/* =========================
   簡易UIコンポーネント
========================= */

function Card({ children, className = "" }: any) {
  return <div className={`rounded-2xl border bg-white ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }: any) {
  return <div className={className}>{children}</div>;
}

function Button({
  children,
  variant = "default",
  ...props
}: any) {
  const base = "px-4 py-2 rounded-xl text-sm";

  const styles =
    variant === "outline"
      ? "border bg-white hover:bg-gray-100"
      : "bg-black text-white hover:bg-black/80";

  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
}

/* ========================= */

function yen(v: any) {
  return `¥${Number(v || 0).toLocaleString()}`;
}

function formatDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${Number(m)}/${Number(day)}`;
}

/* ========================= */

export default function PayrollAttendancePage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [data, setData] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");

  const [loading, setLoading] = useState(false);

  /* =========================
     データ取得
  ========================= */

  const loadData = async () => {
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/payroll/daily-results?year=${year}&month=${month}`
    );

    const json = await res.json();

    setData(json);

    if (json.length > 0) {
      setSelectedStaff(json[0].staff_id);
    }

    setLoading(false);
  };

  const runCalculation = async () => {
    setLoading(true);

    await fetch(`${API_BASE}/payroll/calculate-monthly`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ year, month }),
    });

    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [year, month]);

  /* ========================= */

  const staffList = useMemo(() => {
    const map = new Map();
    data.forEach((d) => {
      if (!map.has(d.staff_id)) {
        map.set(d.staff_id, d.staff_name);
      }
    });
    return Array.from(map.entries());
  }, [data]);

  const staffRows = useMemo(() => {
    return data.filter((d) => d.staff_id === selectedStaff);
  }, [data, selectedStaff]);

  const total = staffRows.reduce((sum, r) => sum + (r.final_amount || 0), 0);

  /* ========================= */

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold">給与・勤怠</div>
          <div className="text-sm text-gray-500">
            月次計算・給与明細
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>

          <Button onClick={runCalculation}>
            月次計算
          </Button>
        </div>
      </div>

      {/* スタッフ選択 */}
      <div className="flex gap-2 flex-wrap">
        {staffList.map(([id, name]) => (
          <Button
            key={id}
            variant={selectedStaff === id ? "default" : "outline"}
            onClick={() => setSelectedStaff(id)}
          >
            {name}
          </Button>
        ))}
      </div>

      {/* 明細 */}
      <Card>
        <CardContent className="p-6">
          <div className="text-xl font-bold mb-4">
            給与明細（{year}/{month}）
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">日付</th>
                  <th className="p-2">施設</th>
                  <th className="p-2">部屋数</th>
                  <th className="p-2">単価</th>
                  <th className="p-2">金額</th>
                  <th className="p-2">作業時間</th>
                  <th className="p-2">実働</th>
                  <th className="p-2">交通費</th>
                </tr>
              </thead>

              <tbody>
                {staffRows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">
                      {formatDate(r.target_date)}
                    </td>
                    <td className="p-2">{r.facility}</td>
                    <td className="p-2 text-right">{r.room_count}</td>
                    <td className="p-2 text-right">
                      {yen(r.unit_price)}
                    </td>
                    <td className="p-2 text-right font-bold">
                      {yen(r.final_amount)}
                    </td>
                    <td className="p-2 text-right">
                      {r.work_hours}
                    </td>
                    <td className="p-2 text-right">
                      {r.actual_hours}
                    </td>
                    <td className="p-2 text-right">
                      {yen(r.transportation_fee)}
                    </td>
                  </tr>
                ))}

                {staffRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-400">
                      データがありません
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="p-2">
                    合計
                  </td>
                  <td className="p-2 text-right">
                    {yen(total)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
