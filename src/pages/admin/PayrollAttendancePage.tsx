import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

type PayrollType = "piece" | "hourly";

type StaffPayrollSetting = {
  id: string;
  staff_id: string;
  staff_name: string;
  payroll_type: PayrollType | string;
  hourly_rate: number;
  minimum_hours: number;
  transportation_fee: number;
  valid_from?: string;
  valid_to?: string | null;
  is_active?: boolean;
  note?: string;
};

type RoomPieceRate = {
  id: string;
  property_name: string;
  room_name: string;
  room_key?: string | null;
  rate: number;
  is_active?: boolean;
};

type PropertyTypePieceRate = {
  id: string;
  property_name: string;
  property_type: string;
  rate: number;
  is_active?: boolean;
};

type PayrollDailyResult = {
  id: string;
  target_date: string;
  staff_id: string;
  staff_name: string;
  payroll_type: PayrollType | string;
  facility: string;
  room_count: number;
  worker_count: number;
  unit_price: number;
  cleaning_amount: number;
  work_hours: number;
  actual_hours: number;
  hourly_rate: number;
  hourly_amount: number;
  base_amount: number;
  minimum_guarantee: number;
  adjustment_amount: number;
  busy_season_allowance: string;
  transportation_fee: number;
  final_amount: number;
  status: string;
  note?: string;
};

type PayrollSettingsResponse = {
  staff_payroll_settings: StaffPayrollSetting[];
  room_piece_rates: RoomPieceRate[];
  property_type_piece_rates: PropertyTypePieceRate[];
};

function yen(value: number | string | null | undefined) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function typeLabel(type?: string) {
  return type === "hourly" ? "時給計算" : "単価計算";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMd(dateStr?: string) {
  if (!dateStr) return "";
  const normalized = String(dateStr).slice(0, 10);
  const parts = normalized.split("-");
  if (parts.length !== 3) return dateStr;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

function calculateMinimumGuarantee(hourlyRate: number, minHours: number) {
  return Number(hourlyRate || 0) * Number(minHours || 0);
}

function calculateFinalAmount(baseAmount: number, adjustment: number, transport: number) {
  return Number(baseAmount || 0) + Number(adjustment || 0) + Number(transport || 0);
}

function getMonthlyTotal(rows: PayrollDailyResult[]) {
  return rows.reduce((sum, row) => sum + Number(row.final_amount || 0), 0);
}

function getCleaningTotal(rows: PayrollDailyResult[]) {
  return rows.reduce((sum, row) => sum + Number(row.cleaning_amount || 0), 0);
}

function getHourlyTotal(rows: PayrollDailyResult[]) {
  return rows.reduce((sum, row) => sum + Number(row.hourly_amount || 0), 0);
}

function getAdjustmentTotal(rows: PayrollDailyResult[]) {
  return rows.reduce((sum, row) => sum + Number(row.adjustment_amount || 0), 0);
}

function getTransportTotal(rows: PayrollDailyResult[]) {
  return rows.reduce((sum, row) => sum + Number(row.transportation_fee || 0), 0);
}

function getUniqueStaffRows(rows: PayrollDailyResult[]) {
  const map = new Map<string, PayrollDailyResult>();
  rows.forEach((row) => {
    if (!map.has(row.staff_id)) map.set(row.staff_id, row);
  });
  return Array.from(map.values()).sort((a, b) => a.staff_name.localeCompare(b.staff_name, "ja"));
}

function getStaffMonthlyRows(rows: PayrollDailyResult[], staffId: string) {
  return rows
    .filter((row) => row.staff_id === staffId)
    .sort((a, b) => {
      if (a.target_date === b.target_date) {
        return String(a.facility || "").localeCompare(String(b.facility || ""), "ja");
      }
      return String(a.target_date).localeCompare(String(b.target_date));
    });
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "dark" }) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "dark"
      ? "bg-neutral-900 text-white border-neutral-900"
      : "bg-white text-neutral-700 border-neutral-200";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${cls}`}>{children}</span>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function StatementTable({ rows }: { rows: PayrollDailyResult[] }) {
  const monthlyTotal = getMonthlyTotal(rows);
  let lastDate = "";

  return (
    <div className="mt-6 overflow-auto rounded-2xl border">
      <table className="w-full min-w-[1040px] text-sm">
        <thead className="bg-neutral-100 text-xs text-neutral-600">
          <tr>
            <th className="px-3 py-3 text-left">日付</th>
            <th className="px-3 py-3 text-left">施設</th>
            <th className="px-3 py-3 text-right">部屋数</th>
            <th className="px-3 py-3 text-right">作業人数</th>
            <th className="px-3 py-3 text-right">単価</th>
            <th className="px-3 py-3 text-right">合計金額</th>
            <th className="px-3 py-3 text-right">作業時間</th>
            <th className="px-3 py-3 text-right">実働時間</th>
            <th className="px-3 py-3 text-right">時給</th>
            <th className="px-3 py-3 text-left">繁忙期手当</th>
            <th className="px-3 py-3 text-right">交通費</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const showDate = row.target_date !== lastDate;
            lastDate = row.target_date;

            return (
              <tr key={row.id} className="border-t bg-white">
                <td className="px-3 py-3">{showDate ? formatMd(row.target_date) : ""}</td>
                <td className="px-3 py-3">{row.facility || ""}</td>
                <td className="px-3 py-3 text-right">{row.room_count || ""}</td>
                <td className="px-3 py-3 text-right">{row.worker_count || ""}</td>
                <td className="px-3 py-3 text-right">{row.unit_price ? yen(row.unit_price) : ""}</td>
                <td className="px-3 py-3 text-right font-semibold">{row.final_amount ? yen(row.final_amount) : ""}</td>
                <td className="px-3 py-3 text-right">{row.work_hours ? `${row.work_hours}h` : ""}</td>
                <td className="px-3 py-3 text-right">{row.actual_hours ? `${row.actual_hours}h` : ""}</td>
                <td className="px-3 py-3 text-right">{row.hourly_rate ? yen(row.hourly_rate) : ""}</td>
                <td className="px-3 py-3">{row.busy_season_allowance || ""}</td>
                <td className="px-3 py-3 text-right">{row.transportation_fee ? yen(row.transportation_fee) : ""}</td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
            <tr className="border-t bg-white">
              <td colSpan={11} className="px-3 py-10 text-center text-neutral-500">
                明細データがありません。対象月を計算してください。
              </td>
            </tr>
          ) : null}

          {rows.length > 0 ? (
            <tr className="border-t bg-neutral-100 font-semibold">
              <td className="px-3 py-3" colSpan={5}>月合計</td>
              <td className="px-3 py-3 text-right">{yen(monthlyTotal)}</td>
              <td className="px-3 py-3" colSpan={5}></td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

async function fetchPayrollSettings(): Promise<PayrollSettingsResponse> {
  const res = await fetch(`${API_BASE}/payroll/settings`);
  if (!res.ok) throw new Error(`settings fetch failed: ${res.status}`);
  return res.json();
}

async function fetchDailyResults(year: number, month: number): Promise<PayrollDailyResult[]> {
  const res = await fetch(`${API_BASE}/payroll/daily-results?year=${year}&month=${month}`);
  if (!res.ok) throw new Error(`daily results fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function calculateMonthly(year: number, month: number) {
  const res = await fetch(`${API_BASE}/payroll/calculate-monthly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year, month }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`calculate failed: ${res.status} / ${text}`);
  }

  return res.json();
}

export default function PayrollAttendancePage() {
  const [tab, setTab] = useState("daily");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);

  const [settings, setSettings] = useState<PayrollSettingsResponse>({
    staff_payroll_settings: [],
    room_piece_rates: [],
    property_type_piece_rates: [],
  });

  const [dailyRows, setDailyRows] = useState<PayrollDailyResult[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const staffRows = useMemo(() => getUniqueStaffRows(dailyRows), [dailyRows]);

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return staffRows[0] ?? null;
    return staffRows.find((row) => row.staff_id === selectedStaffId) ?? staffRows[0] ?? null;
  }, [selectedStaffId, staffRows]);

  const selectedMonthlyRows = useMemo(() => {
    if (!selectedStaff) return [];
    return getStaffMonthlyRows(dailyRows, selectedStaff.staff_id);
  }, [dailyRows, selectedStaff]);

  const totals = useMemo(() => {
    return {
      staff: staffRows.length,
      cleaning: getCleaningTotal(dailyRows),
      hourly: getHourlyTotal(dailyRows),
      adjustment: getAdjustmentTotal(dailyRows),
      transport: getTransportTotal(dailyRows),
      final: getMonthlyTotal(dailyRows),
    };
  }, [dailyRows, staffRows.length]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [settingsData, resultData] = await Promise.all([
        fetchPayrollSettings(),
        fetchDailyResults(year, month),
      ]);

      setSettings(settingsData);
      setDailyRows(resultData);

      if (resultData.length > 0) {
        setSelectedStaffId((prev) => {
          if (prev && resultData.some((row) => row.staff_id === prev)) return prev;
          return resultData[0].staff_id;
        });
      } else {
        setSelectedStaffId("");
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError("");
      await calculateMonthly(year, month);
      await loadAll();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "給与計算に失敗しました");
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const tabButtonVariant = (target: string) => (tab === target ? "default" : "outline");

  return (
    <div className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">給与・勤怠</div>
            <div className="mt-1 text-sm text-neutral-500">
              実働報告・完了清掃タスク・単価設定から給与明細を作成
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {lastUpdated ? `最終更新 ${lastUpdated.toLocaleTimeString()}` : "未取得"}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }).map((_, index) => {
                const y = CURRENT_YEAR - 2 + index;
                return <option key={y} value={y}>{y}年</option>;
              })}
            </select>

            <select
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, index) => {
                const m = index + 1;
                return <option key={m} value={m}>{m}月</option>;
              })}
            </select>

            <Button variant="outline" onClick={() => void loadAll()} disabled={loading || calculating}>
              更新
            </Button>
            <Button onClick={handleCalculate} disabled={loading || calculating}>
              {calculating ? "計算中..." : "月次計算"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={tabButtonVariant("daily")} onClick={() => setTab("daily")}>当日確認一覧</Button>
          <Button variant={tabButtonVariant("settings")} onClick={() => setTab("settings")}>単価・スタッフ設定</Button>
          <Button variant={tabButtonVariant("statement")} onClick={() => setTab("statement")}>個別明細</Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-500">
            読み込み中...
          </div>
        ) : null}

        {tab === "daily" ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-5">
              <Metric label="対象スタッフ" value={`${totals.staff}名`} />
              <Metric label="部屋単価報酬" value={yen(totals.cleaning)} />
              <Metric label="時給報酬" value={yen(totals.hourly)} />
              <Metric label="最低保証調整" value={yen(totals.adjustment)} />
              <Metric label="支給合計" value={yen(totals.final)} />
            </div>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{year}/{pad2(month)} 当月確認一覧</div>
                    <div className="text-sm text-neutral-500">月次計算後のスタッフ別・日別結果</div>
                  </div>
                </div>

                <div className="overflow-auto rounded-2xl border">
                  <table className="w-full min-w-[1040px] text-sm">
                    <thead className="bg-neutral-100 text-left text-xs text-neutral-600">
                      <tr>
                        <th className="px-3 py-3">日付</th>
                        <th className="px-3 py-3">スタッフ</th>
                        <th className="px-3 py-3">計算方式</th>
                        <th className="px-3 py-3">施設</th>
                        <th className="px-3 py-3 text-right">部屋数</th>
                        <th className="px-3 py-3 text-right">清掃報酬</th>
                        <th className="px-3 py-3 text-right">作業時間</th>
                        <th className="px-3 py-3 text-right">実働</th>
                        <th className="px-3 py-3 text-right">時給報酬</th>
                        <th className="px-3 py-3 text-right">保証調整</th>
                        <th className="px-3 py-3 text-right">交通費</th>
                        <th className="px-3 py-3 text-right">支給額</th>
                        <th className="px-3 py-3">状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedStaffId(row.staff_id);
                            setTab("statement");
                          }}
                          className="cursor-pointer border-t bg-white hover:bg-neutral-50"
                        >
                          <td className="px-3 py-3">{formatMd(row.target_date)}</td>
                          <td className="px-3 py-3 font-medium">{row.staff_name}</td>
                          <td className="px-3 py-3"><Pill>{typeLabel(row.payroll_type)}</Pill></td>
                          <td className="px-3 py-3">{row.facility || ""}</td>
                          <td className="px-3 py-3 text-right">{row.room_count || ""}</td>
                          <td className="px-3 py-3 text-right">{yen(row.cleaning_amount)}</td>
                          <td className="px-3 py-3 text-right">{row.work_hours ? `${row.work_hours}h` : ""}</td>
                          <td className="px-3 py-3 text-right">{row.actual_hours ? `${row.actual_hours}h` : ""}</td>
                          <td className="px-3 py-3 text-right">{yen(row.hourly_amount)}</td>
                          <td className="px-3 py-3 text-right">{yen(row.adjustment_amount)}</td>
                          <td className="px-3 py-3 text-right">{yen(row.transportation_fee)}</td>
                          <td className="px-3 py-3 text-right font-semibold">{yen(row.final_amount)}</td>
                          <td className="px-3 py-3"><Pill tone={row.status === "確定済" ? "good" : "warn"}>{row.status}</Pill></td>
                        </tr>
                      ))}

                      {dailyRows.length === 0 ? (
                        <tr className="border-t bg-white">
                          <td colSpan={13} className="px-3 py-10 text-center text-neutral-500">
                            給与計算結果がありません。「月次計算」を実行してください。
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {tab === "settings" ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4">
                  <div className="text-lg font-semibold">スタッフ別給与設定</div>
                  <div className="text-sm text-neutral-500">計算方式・時給・最低保証・交通費</div>
                </div>
                <div className="overflow-auto rounded-2xl border">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-neutral-100 text-left text-xs text-neutral-600">
                      <tr>
                        <th className="px-3 py-3">スタッフ</th>
                        <th className="px-3 py-3">計算方式</th>
                        <th className="px-3 py-3 text-right">時給</th>
                        <th className="px-3 py-3 text-right">最低保証</th>
                        <th className="px-3 py-3 text-right">交通費</th>
                        <th className="px-3 py-3">状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.staff_payroll_settings.map((staff) => (
                        <tr key={staff.id} className="border-t bg-white">
                          <td className="px-3 py-3 font-medium">{staff.staff_name}</td>
                          <td className="px-3 py-3"><Pill>{typeLabel(staff.payroll_type)}</Pill></td>
                          <td className="px-3 py-3 text-right">{yen(staff.hourly_rate)}</td>
                          <td className="px-3 py-3 text-right">
                            {staff.minimum_hours ? `${staff.minimum_hours}h / ${yen(calculateMinimumGuarantee(staff.hourly_rate, staff.minimum_hours))}` : "-"}
                          </td>
                          <td className="px-3 py-3 text-right">{yen(staff.transportation_fee)}</td>
                          <td className="px-3 py-3"><Pill tone={staff.is_active === false ? "warn" : "good"}>{staff.is_active === false ? "無効" : "有効"}</Pill></td>
                        </tr>
                      ))}

                      {settings.staff_payroll_settings.length === 0 ? (
                        <tr className="border-t bg-white">
                          <td colSpan={6} className="px-3 py-10 text-center text-neutral-500">スタッフ給与設定がありません。</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4">
                  <div className="text-lg font-semibold">物件・部屋単価設定</div>
                  <div className="text-sm text-neutral-500">部屋別単価を優先し、なければ物件タイプ単価</div>
                </div>
                <div className="space-y-4">
                  <div className="overflow-auto rounded-2xl border">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-neutral-100 text-left text-xs text-neutral-600">
                        <tr>
                          <th className="px-3 py-3">物件</th>
                          <th className="px-3 py-3">部屋</th>
                          <th className="px-3 py-3 text-right">単価</th>
                          <th className="px-3 py-3">状態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.room_piece_rates.map((rate) => (
                          <tr key={rate.id} className="border-t bg-white">
                            <td className="px-3 py-3 font-medium">{rate.property_name}</td>
                            <td className="px-3 py-3">{rate.room_name}</td>
                            <td className="px-3 py-3 text-right font-semibold">{yen(rate.rate)}</td>
                            <td className="px-3 py-3"><Pill tone={rate.is_active === false ? "warn" : "good"}>{rate.is_active === false ? "無効" : "有効"}</Pill></td>
                          </tr>
                        ))}
                        {settings.room_piece_rates.length === 0 ? (
                          <tr className="border-t bg-white">
                            <td colSpan={4} className="px-3 py-8 text-center text-neutral-500">部屋別単価がありません。</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-auto rounded-2xl border">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-neutral-100 text-left text-xs text-neutral-600">
                        <tr>
                          <th className="px-3 py-3">物件</th>
                          <th className="px-3 py-3">タイプ</th>
                          <th className="px-3 py-3 text-right">単価</th>
                          <th className="px-3 py-3">状態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.property_type_piece_rates.map((rate) => (
                          <tr key={rate.id} className="border-t bg-white">
                            <td className="px-3 py-3 font-medium">{rate.property_name}</td>
                            <td className="px-3 py-3">{rate.property_type}</td>
                            <td className="px-3 py-3 text-right font-semibold">{yen(rate.rate)}</td>
                            <td className="px-3 py-3"><Pill tone={rate.is_active === false ? "warn" : "good"}>{rate.is_active === false ? "無効" : "有効"}</Pill></td>
                          </tr>
                        ))}
                        {settings.property_type_piece_rates.length === 0 ? (
                          <tr className="border-t bg-white">
                            <td colSpan={4} className="px-3 py-8 text-center text-neutral-500">物件タイプ単価がありません。</td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {tab === "statement" ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold">給与明細プレビュー</div>
                    <div className="text-sm text-neutral-500">スタッフを選択して1か月分を表形式で表示</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()} disabled={!selectedStaff}>
                      印刷 / PDF
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {staffRows.map((row) => (
                    <Button
                      key={row.staff_id}
                      variant={selectedStaff?.staff_id === row.staff_id ? "default" : "outline"}
                      onClick={() => setSelectedStaffId(row.staff_id)}
                    >
                      {row.staff_name}
                    </Button>
                  ))}

                  {staffRows.length === 0 ? (
                    <div className="text-sm text-neutral-500">表示できるスタッフがいません。</div>
                  ) : null}
                </div>

                <div className="rounded-2xl border bg-white p-6">
                  <div className="border-b pb-4">
                    <div className="text-2xl font-bold">給与明細書</div>
                    <div className="mt-2 grid gap-2 text-sm text-neutral-600 md:grid-cols-3">
                      <div>対象月：{year}年{month}月</div>
                      <div>氏名：{selectedStaff?.staff_name || "-"}</div>
                      <div>雇用区分：{typeLabel(selectedStaff?.payroll_type)}</div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <Metric label="部屋単価報酬" value={yen(getCleaningTotal(selectedMonthlyRows))} />
                    <Metric label="時給作業報酬" value={yen(getHourlyTotal(selectedMonthlyRows))} />
                    <Metric label="最低保証調整" value={yen(getAdjustmentTotal(selectedMonthlyRows))} />
                    <Metric label="支給合計" value={yen(getMonthlyTotal(selectedMonthlyRows))} />
                  </div>

                  <StatementTable rows={selectedMonthlyRows} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function runPayrollPageTests() {
  const assert = (name: string, condition: boolean) => {
    if (!condition) throw new Error(`Test failed: ${name}`);
  };

  assert("yen formats amount", yen(1300) === "¥1,300");
  assert("piece label", typeLabel("piece") === "単価計算");
  assert("hourly label", typeLabel("hourly") === "時給計算");
  assert("minimum guarantee", calculateMinimumGuarantee(1300, 6) === 7800);
  assert("final amount", calculateFinalAmount(7100, 700, 500) === 8300);
  assert("format date", formatMd("2026-01-06") === "1/6");
  assert("month pad", pad2(1) === "01");
}

try {
  runPayrollPageTests();
} catch (error) {
  console.error(error);
}
