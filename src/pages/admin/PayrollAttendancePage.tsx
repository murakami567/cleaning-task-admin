import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";

type PayrollDailyResult = {
  id: string;
  target_date: string;
  staff_id: string;
  staff_name: string;
  payroll_type: string;
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

type StaffMaster = {
  id: string;
  staff_code?: string;
  staff_name: string;
  role?: string;
  is_active?: boolean;
};

type PropertyMaster = {
  id: string;
  property_name: string;
  normalized_name?: string;
  is_active?: boolean;
};

type RoomMaster = {
  id: string;
  property_id: string;
  room_name: string;
  room_key?: string;
  is_active?: boolean;
};

type StaffPayrollSetting = {
  id?: string;
  staff_id: string;
  staff_name?: string;
  payroll_type?: string;
  hourly_rate?: number;
  minimum_hours?: number;
  minimum_guarantee?: number;
  transportation_fee?: number;
  is_active?: boolean;
};

type RoomPieceRate = {
  id?: string;
  property_id?: string;
  room_id: string;
  property_name?: string;
  room_name?: string;
  unit_price?: number;
  rate?: number;
  busy_season_allowance?: string;
  is_active?: boolean;
};

type PropertyTypePieceRate = {
  id?: string;
  property_id: string;
  property_name?: string;
  work_type?: string;
  property_type?: string;
  unit_price?: number;
  rate?: number;
  is_active?: boolean;
};

type SettingsTab = "staff" | "room" | "property";

function yen(value: any) {
  return `¥${Number(value || 0).toLocaleString()}`;
}

function formatMd(value?: string) {
  if (!value) return "";
  const d = String(value).slice(0, 10).split("-");
  if (d.length !== 3) return value;
  return `${Number(d[1])}/${Number(d[2])}`;
}

function typeLabel(type?: string) {
  return type === "hourly" ? "時給計算" : "単価計算";
}

function settingTypeLabel(type?: string) {
  return type === "hourly" ? "時給" : "単価";
}

function Button({ children, active, variant = "default", className = "", disabled, ...props }: any) {
  const style = active || variant === "default"
    ? "bg-black text-white hover:bg-black/90 disabled:bg-black/40"
    : "border bg-white text-black hover:bg-black/5 disabled:text-black/40";
  return <button className={`h-10 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed ${style} ${className}`} disabled={disabled} {...props}>{children}</button>;
}

function Card({ children, className = "" }: any) {
  return <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>{children}</div>;
}

function Metric({ label, value }: { label: string; value: any }) {
  return <Card className="p-4"><div className="text-xs text-neutral-500">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></Card>;
}

function Pill({ children, tone = "default" }: any) {
  const cls = tone === "good"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : tone === "warn"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-neutral-200 bg-white text-neutral-700";
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${cls}`}>{children}</span>;
}

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `request failed: ${res.status}`);
  }
  return res.json();
}

export default function PayrollAttendancePage() {
  const now = new Date();
  const [tab, setTab] = useState<"daily" | "settings" | "statement">("daily");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [targetDate, setTargetDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [expandedStaffId, setExpandedStaffId] = useState("");
  const [editingPayroll, setEditingPayroll] = useState<PayrollDailyResult | null>(null);
  const [rows, setRows] = useState<PayrollDailyResult[]>([]);
  const [settings, setSettings] = useState<any>({ staff_payroll_settings: [], room_piece_rates: [], property_type_piece_rates: [] });
  const [staffs, setStaffs] = useState<StaffMaster[]>([]);
  const [properties, setProperties] = useState<PropertyMaster[]>([]);
  const [rooms, setRooms] = useState<RoomMaster[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    const res = await fetch(`${API_BASE}/payroll/settings`);
    if (!res.ok) throw new Error("設定の取得に失敗しました");
    return res.json();
  };

  const fetchResults = async () => {
    const res = await fetch(`${API_BASE}/payroll/daily-results?year=${year}&month=${month}`);
    if (!res.ok) throw new Error("給与計算結果の取得に失敗しました");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchMasterData = async () => {
    const [staffRes, propertyRes, roomRes] = await Promise.all([
      fetch(`${API_BASE}/staffs`),
      fetch(`${API_BASE}/properties`),
      fetch(`${API_BASE}/rooms`),
    ]);
    if (!staffRes.ok) throw new Error("スタッフ一覧の取得に失敗しました");
    if (!propertyRes.ok) throw new Error("物件一覧の取得に失敗しました");
    if (!roomRes.ok) throw new Error("部屋一覧の取得に失敗しました");
    return { staffs: await staffRes.json(), properties: await propertyRes.json(), rooms: await roomRes.json() };
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [settingsData, resultData, masterData] = await Promise.all([fetchSettings(), fetchResults(), fetchMasterData()]);
      setSettings(settingsData);
      setRows(resultData);
      setStaffs(Array.isArray(masterData.staffs) ? masterData.staffs : []);
      setProperties(Array.isArray(masterData.properties) ? masterData.properties : []);
      setRooms(Array.isArray(masterData.rooms) ? masterData.rooms : []);
      if (resultData.length > 0) {
        setSelectedStaffId((prev) => prev && resultData.some((r: PayrollDailyResult) => r.staff_id === prev) ? prev : resultData[0].staff_id);
      } else {
        setSelectedStaffId("");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAll(); }, [year, month]);

  const calculateMonthly = async () => {
    try {
      setCalculating(true);
      setError("");
      await postJson(`${API_BASE}/payroll/calculate-monthly`, { year, month });
      await loadAll();
    } catch (e: any) {
      setError(e.message || "月次計算に失敗しました");
    } finally {
      setCalculating(false);
    }
  };

  const saveStaffPayrollSetting = async (payload: any) => {
    try { setSaving(true); setError(""); await postJson(`${API_BASE}/payroll/settings/staff/upsert`, payload); await loadAll(); }
    catch (e: any) { setError(e.message || "スタッフ給与設定の保存に失敗しました"); }
    finally { setSaving(false); }
  };

  const saveRoomRate = async (payload: any) => {
    try { setSaving(true); setError(""); await postJson(`${API_BASE}/payroll/rates/room/upsert`, payload); await loadAll(); }
    catch (e: any) { setError(e.message || "部屋単価の保存に失敗しました"); }
    finally { setSaving(false); }
  };

  const savePropertyTypeRate = async (payload: any) => {
    try { setSaving(true); setError(""); await postJson(`${API_BASE}/payroll/rates/property-type/upsert`, payload); await loadAll(); }
    catch (e: any) { setError(e.message || "物件タイプ単価の保存に失敗しました"); }
    finally { setSaving(false); }
  };

  const staffList = useMemo(() => {
    const map = new Map<string, PayrollDailyResult>();
    rows.forEach((r) => { if (!map.has(r.staff_id)) map.set(r.staff_id, r); });
    return Array.from(map.values());
  }, [rows]);

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return staffList[0] || null;
    return staffList.find((s) => s.staff_id === selectedStaffId) || staffList[0] || null;
  }, [staffList, selectedStaffId]);

  const selectedRows = useMemo(() => {
    if (!selectedStaff) return [];
    return rows.filter((r) => r.staff_id === selectedStaff.staff_id).sort((a, b) =>
      a.target_date === b.target_date
        ? String(a.facility || "").localeCompare(String(b.facility || ""), "ja")
        : String(a.target_date).localeCompare(String(b.target_date))
    );
  }, [rows, selectedStaff]);

  const dailyRows = useMemo(() => rows.filter((r) => String(r.target_date).slice(0, 10) === targetDate), [rows, targetDate]);

  const dailyStaffGroups = useMemo(() => {
    const map = new Map<string, { staff_id: string; staff_name: string; payroll_type: string; rows: PayrollDailyResult[] }>();
    dailyRows.forEach((r) => {
      const current = map.get(r.staff_id) || { staff_id: r.staff_id, staff_name: r.staff_name, payroll_type: r.payroll_type, rows: [] };
      current.rows.push(r);
      map.set(r.staff_id, current);
    });
    return Array.from(map.values()).sort((a, b) => String(a.staff_name).localeCompare(String(b.staff_name), "ja"));
  }, [dailyRows]);

  const updatePayrollResult = async (payload: any) => {
    try {
      setSaving(true);
      setError("");
      await postJson(`${API_BASE}/payroll/daily-results/update`, payload);
      setEditingPayroll(null);
      await loadAll();
    } catch (e: any) {
      setError(e.message || "給与日次データの更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const deletePayrollResult = async (row: PayrollDailyResult) => {
    if (!window.confirm(`${row.staff_name} / ${row.facility || "-"} の給与データを削除しますか？`)) return;
    try {
      setSaving(true);
      setError("");
      await postJson(`${API_BASE}/payroll/daily-results/delete`, { result_id: row.id });
      await loadAll();
    } catch (e: any) {
      setError(e.message || "給与日次データの削除に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const total = (key: keyof PayrollDailyResult, list = rows) => list.reduce((sum, r) => sum + Number(r[key] || 0), 0);

  return (
    <div className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
      <style>{`@media print { body * { visibility:hidden; } .print-area,.print-area * { visibility:visible; } .print-area { position:absolute; left:0; top:0; width:100%; border:none!important; box-shadow:none!important; transform:scale(.82); transform-origin:top left; } @page { size:A4 portrait; margin:8mm; } }`}</style>
      <div className="w-full space-y-6">
        <button type="button" onClick={() => (window.location.href = "/admin/home")} className="inline-flex h-10 items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-100">← タスク管理に戻る</button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">給与・勤怠</h1><p className="text-sm text-neutral-500">実働報告・完了清掃タスク・単価設定から給与明細を作成</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-xl border bg-white px-3 text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>{[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}年</option>)}</select>
            <select className="h-10 rounded-xl border bg-white px-3 text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}</select>
            <Button variant="outline" onClick={loadAll} disabled={loading}>更新</Button>
            <Button onClick={calculateMonthly} disabled={calculating}>{calculating ? "計算中..." : "月次計算"}</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button active={tab === "daily"} variant={tab === "daily" ? "default" : "outline"} onClick={() => setTab("daily")}>当日確認一覧</Button>
          <Button active={tab === "settings"} variant={tab === "settings" ? "default" : "outline"} onClick={() => setTab("settings")}>単価・スタッフ設定</Button>
          <Button active={tab === "statement"} variant={tab === "statement" ? "default" : "outline"} onClick={() => setTab("statement")}>個別明細</Button>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {loading ? <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-500">読み込み中...</div> : null}

        {tab === "daily" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <div>
                <div className="text-sm font-semibold text-neutral-500">確認日</div>
                <input type="date" value={targetDate} onChange={(e) => { const value = e.target.value; setTargetDate(value); const [y, m] = value.split("-").map(Number); if (y && m) { setYear(y); setMonth(m); } setExpandedStaffId(""); }} className="mt-1 h-10 rounded-xl border bg-white px-3 text-sm" />
              </div>
              <div className="text-sm text-neutral-500">実働報告送信後に作成された当日の給与データを確認します。</div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <Metric label="対象スタッフ" value={`${dailyStaffGroups.length}名`} />
              <Metric label="部屋単価報酬" value={yen(total("cleaning_amount", dailyRows))} />
              <Metric label="時給報酬" value={yen(total("hourly_amount", dailyRows))} />
              <Metric label="最低保証調整" value={yen(total("adjustment_amount", dailyRows))} />
              <Metric label="支給合計" value={yen(total("final_amount", dailyRows))} />
            </div>

            <Card className="overflow-hidden">
              <div className="border-b px-5 py-4">
                <h2 className="text-lg font-semibold">{targetDate.replaceAll("-", "/")} 当日確認一覧</h2>
                <p className="mt-1 text-sm text-neutral-500">スタッフごとに1行で表示。行をタップすると施設・部屋・時間内訳を確認できます。</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-4 py-3 text-left">スタッフ</th><th className="px-4 py-3 text-left">計算方式</th><th className="px-4 py-3 text-right">部屋数</th><th className="px-4 py-3 text-right">清掃報酬</th><th className="px-4 py-3 text-right">実働</th><th className="px-4 py-3 text-right">時給報酬</th><th className="px-4 py-3 text-right">保証調整</th><th className="px-4 py-3 text-right">交通費</th><th className="px-4 py-3 text-right">支給額</th><th className="px-4 py-3 text-left">状態</th></tr></thead>
                  <tbody>
                    {dailyStaffGroups.length === 0 ? <tr><td colSpan={10} className="px-4 py-10 text-center text-neutral-500">対象日の給与データはありません。</td></tr> : null}
                    {dailyStaffGroups.map((group) => {
                      const open = expandedStaffId === group.staff_id;
                      const sum = (key: keyof PayrollDailyResult) => group.rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);
                      const status = group.rows.every((r) => r.status === "確定済") ? "確定済" : "未確定";
                      return <React.Fragment key={group.staff_id}>
                        <tr className="cursor-pointer border-t bg-white hover:bg-neutral-50" onClick={() => setExpandedStaffId(open ? "" : group.staff_id)}>
                          <td className="px-4 py-4"><div className="font-semibold">{group.staff_name}</div><div className="mt-1 text-xs text-neutral-400">{open ? "▲ 詳細を閉じる" : "▼ 詳細を表示"}</div></td>
                          <td className="px-4 py-4"><Pill>{typeLabel(group.payroll_type)}</Pill></td>
                          <td className="px-4 py-4 text-right">{sum("room_count")}</td>
                          <td className="px-4 py-4 text-right">{yen(sum("cleaning_amount"))}</td>
                          <td className="px-4 py-4 text-right">{sum("actual_hours").toFixed(2)}h</td>
                          <td className="px-4 py-4 text-right">{yen(sum("hourly_amount"))}</td>
                          <td className="px-4 py-4 text-right">{yen(sum("adjustment_amount"))}</td>
                          <td className="px-4 py-4 text-right">{yen(sum("transportation_fee"))}</td>
                          <td className="px-4 py-4 text-right text-base font-semibold">{yen(sum("final_amount"))}</td>
                          <td className="px-4 py-4"><Pill tone={status === "確定済" ? "good" : "warn"}>{status}</Pill></td>
                        </tr>
                        {open ? <tr className="border-t bg-neutral-50"><td colSpan={10} className="p-4">
                          <div className="overflow-auto rounded-xl border bg-white">
                            <table className="w-full min-w-[1050px] text-xs">
                              <thead className="bg-neutral-50 text-neutral-500"><tr><th className="px-3 py-2 text-left">施設</th><th className="px-3 py-2 text-left">区分</th><th className="px-3 py-2 text-left">内訳</th><th className="px-3 py-2 text-right">部屋数</th><th className="px-3 py-2 text-right">清掃報酬</th><th className="px-3 py-2 text-right">実働</th><th className="px-3 py-2 text-right">時給報酬</th><th className="px-3 py-2 text-right">保証調整</th><th className="px-3 py-2 text-right">交通費</th><th className="px-3 py-2 text-right">支給額</th><th className="px-3 py-2 text-right">操作</th></tr></thead>
                              <tbody>{group.rows.flatMap((r) => {
  const parts = String(r.note || "").split(" / ").filter(Boolean);
  const pieceDetail = parts.filter((x) => !x.startsWith("時給対象:")).join(" / ") || "-";
  const hourlyDetail = parts.filter((x) => x.startsWith("時給対象:")).join(" / ") || (Number(r.actual_hours || 0) > 0 ? `${Number(r.actual_hours || 0).toFixed(2)}h × ${yen(r.hourly_rate)}` : "-");
  const hasPiece = Number(r.cleaning_amount || 0) !== 0 || Number(r.room_count || 0) > 0;
  const hasHourly = Number(r.hourly_amount || 0) !== 0 || Number(r.actual_hours || 0) > 0 || Number(r.adjustment_amount || 0) !== 0 || Number(r.transportation_fee || 0) !== 0;
  const lines: React.ReactNode[] = [];
  if (hasPiece) lines.push(<tr key={`${r.id}-piece`} className="border-t"><td className="px-3 py-3 font-medium">{r.facility || "-"}</td><td className="px-3 py-3"><span className="rounded-full border bg-neutral-50 px-2 py-1 font-semibold">単価分</span></td><td className="max-w-[360px] px-3 py-3 leading-5 text-neutral-600">{pieceDetail}</td><td className="px-3 py-3 text-right">{r.room_count || 0}</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={(e) => { e.stopPropagation(); setEditingPayroll(r); }} className="rounded-lg border bg-white px-3 py-1.5 font-medium">修正</button><button type="button" onClick={(e) => { e.stopPropagation(); void deletePayrollResult(r); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-600">削除</button></div></td></tr>);
  if (hasHourly) lines.push(<tr key={`${r.id}-hourly`} className="border-t bg-blue-50/30"><td className="px-3 py-3 font-medium">{r.facility || "-"}</td><td className="px-3 py-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 font-semibold text-blue-700">時給換算分</span></td><td className="max-w-[360px] px-3 py-3 leading-5 text-neutral-600">{hourlyDetail}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right">{Number(r.actual_hours || 0).toFixed(2)}h</td><td className="px-3 py-3 text-right font-semibold">{yen(r.hourly_amount)}</td><td className="px-3 py-3 text-right">{yen(r.adjustment_amount)}</td><td className="px-3 py-3 text-right">{yen(r.transportation_fee)}</td><td className="px-3 py-3 text-right font-semibold">{yen(Number(r.hourly_amount || 0) + Number(r.adjustment_amount || 0) + Number(r.transportation_fee || 0))}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={(e) => { e.stopPropagation(); setEditingPayroll(r); }} className="rounded-lg border bg-white px-3 py-1.5 font-medium">修正</button><button type="button" onClick={(e) => { e.stopPropagation(); void deletePayrollResult(r); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-600">削除</button></div></td></tr>);
  return lines;
})}</tbody>
                            </table>
                          </div>
                        </td></tr> : null}
                      </React.Fragment>;
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
            {editingPayroll ? <DailyPayrollEditModal row={editingPayroll} saving={saving} onClose={() => setEditingPayroll(null)} onSave={updatePayrollResult} /> : null}
          </div>
        ) : null}

        {tab === "settings" ? <PayrollSettings settings={settings} staffs={staffs} properties={properties} rooms={rooms} saving={saving} onSaveStaff={saveStaffPayrollSetting} onSaveRoom={saveRoomRate} onSavePropertyType={savePropertyTypeRate} /> : null}
        {tab === "statement" ? <PayrollStatement staffList={staffList} selectedStaffId={selectedStaff?.staff_id || ""} onSelectStaff={setSelectedStaffId} selectedStaff={selectedStaff} rows={selectedRows} total={total} /> : null}
      </div>
    </div>
  );
}

function DailyPayrollEditModal({ row, saving, onClose, onSave }: any) {
  const [form, setForm] = useState({
    cleaning_amount: Number(row.cleaning_amount || 0),
    actual_hours: Number(row.actual_hours || 0),
    hourly_rate: Number(row.hourly_rate || 0),
    hourly_amount: Number(row.hourly_amount || 0),
    adjustment_amount: Number(row.adjustment_amount || 0),
    transportation_fee: Number(row.transportation_fee || 0),
    note: row.note || "",
    status: row.status || "未確定",
  });
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
    <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b p-5"><div><h3 className="text-lg font-semibold">給与日次データを修正</h3><p className="mt-1 text-sm text-neutral-500">{row.staff_name} / {row.facility || "-"}</p></div><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm">閉じる</button></div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <NumberField label="清掃報酬" value={form.cleaning_amount} onChange={(v) => setForm((p) => ({ ...p, cleaning_amount: v }))} />
        <NumberField label="実働時間(h)" value={form.actual_hours} onChange={(v) => setForm((p) => ({ ...p, actual_hours: v }))} />
        <NumberField label="時給" value={form.hourly_rate} onChange={(v) => setForm((p) => ({ ...p, hourly_rate: v }))} />
        <NumberField label="時給報酬" value={form.hourly_amount} onChange={(v) => setForm((p) => ({ ...p, hourly_amount: v }))} />
        <NumberField label="保証調整" value={form.adjustment_amount} onChange={(v) => setForm((p) => ({ ...p, adjustment_amount: v }))} />
        <NumberField label="交通費" value={form.transportation_fee} onChange={(v) => setForm((p) => ({ ...p, transportation_fee: v }))} />
        <Field label="状態"><select className="h-11 w-full rounded-xl border bg-white px-3" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="未確定">未確定</option><option value="確定済">確定済</option></select></Field>
        <div className="md:col-span-2"><Field label="内訳・備考"><textarea rows={4} className="w-full rounded-xl border px-3 py-2" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} /></Field></div>
      </div>
      <div className="flex gap-3 border-t p-5"><Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>キャンセル</Button><Button className="flex-1" disabled={saving} onClick={() => onSave({ result_id: row.id, ...form })}>{saving ? "保存中..." : "保存"}</Button></div>
    </div>
  </div>;
}

function PayrollSettings({ settings, staffs, properties, rooms, saving, onSaveStaff, onSaveRoom, onSavePropertyType }: any) {
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("staff");
  const [staffForm, setStaffForm] = useState({ staff_id: "", payroll_type: "piece_rate", hourly_rate: 0, minimum_guarantee: 0, transportation_fee: 0, is_active: true });
  const [roomForm, setRoomForm] = useState({ property_id: "", room_id: "", unit_price: 0, busy_season_allowance: "", is_active: true });
  const [propertyTypeForm, setPropertyTypeForm] = useState({ property_id: "", work_type: "", unit_price: 0, is_active: true });

  const activeStaffs = staffs.filter((s: StaffMaster) => s.is_active !== false);
  const activeProperties = properties.filter((p: PropertyMaster) => p.is_active !== false);
  const activeRooms = rooms.filter((r: RoomMaster) => r.is_active !== false && (!roomForm.property_id || r.property_id === roomForm.property_id));

  const propertyMap = useMemo(() => new Map(properties.map((p: PropertyMaster) => [p.id, p])), [properties]);
  const roomMap = useMemo(() => new Map(rooms.map((r: RoomMaster) => [r.id, r])), [rooms]);
  const staffSettingMap = useMemo(() => new Map((settings.staff_payroll_settings || []).map((x: any) => [x.staff_id, x])), [settings.staff_payroll_settings]);
  const roomRateMap = useMemo(() => new Map((settings.room_piece_rates || []).map((x: any) => [x.room_id, x])), [settings.room_piece_rates]);
  const propertyTypeRateMap = useMemo(() => new Map((settings.property_type_piece_rates || []).map((x: any) => [`${x.property_id}::${x.work_type}`, x])), [settings.property_type_piece_rates]);

  const configuredStaffs = useMemo(() => {
    const staffMap = new Map(activeStaffs.map((s: StaffMaster) => [s.id, s]));
    return [...(settings.staff_payroll_settings || [])]
      .map((setting: StaffPayrollSetting) => ({ setting, staff: staffMap.get(setting.staff_id) as StaffMaster | undefined }))
      .sort((a, b) => String(a.staff?.staff_name || a.setting.staff_name || "").localeCompare(String(b.staff?.staff_name || b.setting.staff_name || ""), "ja"));
  }, [settings.staff_payroll_settings, activeStaffs]);

  const configuredRoomRates = useMemo(() => {
    return [...(settings.room_piece_rates || [])]
      .map((setting: RoomPieceRate) => {
        const room = roomMap.get(setting.room_id) as RoomMaster | undefined;
        const propertyId = setting.property_id || room?.property_id || "";
        const property = propertyMap.get(propertyId) as PropertyMaster | undefined;
        return { setting, room, property, propertyId };
      })
      .sort((a, b) => {
        const p = String(a.property?.property_name || a.setting.property_name || "").localeCompare(String(b.property?.property_name || b.setting.property_name || ""), "ja", { numeric: true });
        if (p !== 0) return p;
        return String(a.room?.room_name || a.setting.room_name || "").localeCompare(String(b.room?.room_name || b.setting.room_name || ""), "ja", { numeric: true });
      });
  }, [settings.room_piece_rates, roomMap, propertyMap]);

  const configuredPropertyRates = useMemo(() => {
    return [...(settings.property_type_piece_rates || [])]
      .map((setting: PropertyTypePieceRate) => ({ setting, property: propertyMap.get(setting.property_id) as PropertyMaster | undefined }))
      .sort((a, b) => {
        const p = String(a.property?.property_name || a.setting.property_name || "").localeCompare(String(b.property?.property_name || b.setting.property_name || ""), "ja", { numeric: true });
        if (p !== 0) return p;
        return String(a.setting.work_type || a.setting.property_type || "").localeCompare(String(b.setting.work_type || b.setting.property_type || ""), "ja", { numeric: true });
      });
  }, [settings.property_type_piece_rates, propertyMap]);

  useEffect(() => {
    if (!staffForm.staff_id) return;
    const current = staffSettingMap.get(staffForm.staff_id) as any;
    setStaffForm((prev) => ({ ...prev, payroll_type: current?.payroll_type || "piece_rate", hourly_rate: Number(current?.hourly_rate || 0), minimum_guarantee: Number(current?.minimum_guarantee || 0), transportation_fee: Number(current?.transportation_fee || 0), is_active: current?.is_active !== false }));
  }, [staffForm.staff_id, staffSettingMap]);

  useEffect(() => {
    if (!roomForm.room_id) return;
    const current = roomRateMap.get(roomForm.room_id) as any;
    setRoomForm((prev) => ({ ...prev, unit_price: Number(current?.unit_price || current?.rate || 0), busy_season_allowance: current?.busy_season_allowance || "", is_active: current?.is_active !== false }));
  }, [roomForm.room_id, roomRateMap]);

  useEffect(() => {
    if (!propertyTypeForm.property_id || !propertyTypeForm.work_type) return;
    const current = propertyTypeRateMap.get(`${propertyTypeForm.property_id}::${propertyTypeForm.work_type}`) as any;
    setPropertyTypeForm((prev) => ({ ...prev, unit_price: Number(current?.unit_price || current?.rate || 0), is_active: current?.is_active !== false }));
  }, [propertyTypeForm.property_id, propertyTypeForm.work_type, propertyTypeRateMap]);

  const selectConfiguredStaff = (staffId: string) => {
    setStaffForm((prev) => ({ ...prev, staff_id: staffId }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectConfiguredRoom = (propertyId: string, roomId: string) => {
    const current = roomRateMap.get(roomId) as any;
    setRoomForm({ property_id: propertyId, room_id: roomId, unit_price: Number(current?.unit_price || current?.rate || 0), busy_season_allowance: current?.busy_season_allowance || "", is_active: current?.is_active !== false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectConfiguredPropertyRate = (propertyId: string, workType: string) => {
    const current = propertyTypeRateMap.get(`${propertyId}::${workType}`) as any;
    setPropertyTypeForm({ property_id: propertyId, work_type: workType, unit_price: Number(current?.unit_price || current?.rate || 0), is_active: current?.is_active !== false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2 shadow-sm">
        <Button active={settingsTab === "staff"} variant={settingsTab === "staff" ? "default" : "outline"} onClick={() => setSettingsTab("staff")}>スタッフ給与設定</Button>
        <Button active={settingsTab === "room"} variant={settingsTab === "room" ? "default" : "outline"} onClick={() => setSettingsTab("room")}>部屋別単価</Button>
        <Button active={settingsTab === "property"} variant={settingsTab === "property" ? "default" : "outline"} onClick={() => setSettingsTab("property")}>物件別単価</Button>
      </div>

      {settingsTab === "staff" ? (
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">スタッフ給与設定</h2><p className="mt-1 text-sm text-neutral-500">給与形態・時給・最低保証・交通費</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="スタッフ"><select className="h-11 w-full rounded-xl border bg-white px-3" value={staffForm.staff_id} onChange={(e) => setStaffForm((p) => ({ ...p, staff_id: e.target.value }))}><option value="">選択してください</option>{activeStaffs.map((s: StaffMaster) => <option key={s.id} value={s.id}>{s.staff_name}{s.staff_code ? ` (${s.staff_code})` : ""}</option>)}</select></Field>
              <Field label="給与形態"><select className="h-11 w-full rounded-xl border bg-white px-3" value={staffForm.payroll_type} onChange={(e) => setStaffForm((p) => ({ ...p, payroll_type: e.target.value }))}><option value="piece_rate">単価</option><option value="hourly">時給</option></select></Field>
              <NumberField label="時給" value={staffForm.hourly_rate} onChange={(v) => setStaffForm((p) => ({ ...p, hourly_rate: v }))} />
              <NumberField label="最低保証" value={staffForm.minimum_guarantee} onChange={(v) => setStaffForm((p) => ({ ...p, minimum_guarantee: v }))} />
              <NumberField label="交通費" value={staffForm.transportation_fee} onChange={(v) => setStaffForm((p) => ({ ...p, transportation_fee: v }))} />
              <div className="flex items-end gap-3"><CheckField checked={staffForm.is_active} onChange={(v) => setStaffForm((p) => ({ ...p, is_active: v }))} /><Button className="ml-auto min-w-[140px]" disabled={!staffForm.staff_id || saving} onClick={() => onSaveStaff(staffForm)}>{saving ? "保存中..." : "保存"}</Button></div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <ListHeader title="スタッフ給与設定一覧" description="給与設定が登録されている対象者。編集から上のフォームへ読み込みます。" count={`${configuredStaffs.length}名`} />
            <div className="overflow-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-4 py-3 text-left">スタッフ</th><th className="px-4 py-3 text-left">給与形態</th><th className="px-4 py-3 text-right">時給</th><th className="px-4 py-3 text-right">最低保証</th><th className="px-4 py-3 text-right">交通費</th><th className="px-4 py-3 text-left">状態</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>
              {configuredStaffs.length === 0 ? <EmptyRow colSpan={7} text="給与設定済みのスタッフがいません。" /> : null}
              {configuredStaffs.map(({ setting, staff }: any) => <tr key={setting.staff_id} className={`border-t hover:bg-neutral-50 ${staffForm.staff_id === setting.staff_id ? "bg-amber-50" : "bg-white"}`}><td className="px-4 py-3 font-medium">{staff?.staff_name || setting.staff_name || "-"}{staff?.staff_code ? <span className="ml-2 text-xs text-neutral-400">({staff.staff_code})</span> : null}</td><td className="px-4 py-3"><Pill>{settingTypeLabel(setting.payroll_type)}</Pill></td><td className="px-4 py-3 text-right">{yen(setting.hourly_rate)}</td><td className="px-4 py-3 text-right">{yen(setting.minimum_guarantee)}</td><td className="px-4 py-3 text-right">{yen(setting.transportation_fee)}</td><td className="px-4 py-3"><Pill tone={setting.is_active === false ? "warn" : "good"}>{setting.is_active === false ? "無効" : "有効"}</Pill></td><td className="px-4 py-3 text-right"><EditButton onClick={() => selectConfiguredStaff(setting.staff_id)} /></td></tr>)}
            </tbody></table></div>
          </Card>
        </div>
      ) : null}

      {settingsTab === "room" ? (
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">部屋別単価</h2><p className="mt-1 text-sm text-neutral-500">物件・部屋ごとの清掃単価</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="物件"><select className="h-11 w-full rounded-xl border bg-white px-3" value={roomForm.property_id} onChange={(e) => setRoomForm((p) => ({ ...p, property_id: e.target.value, room_id: "" }))}><option value="">選択してください</option>{activeProperties.map((p: PropertyMaster) => <option key={p.id} value={p.id}>{p.property_name}</option>)}</select></Field>
              <Field label="部屋"><select className="h-11 w-full rounded-xl border bg-white px-3" value={roomForm.room_id} onChange={(e) => setRoomForm((p) => ({ ...p, room_id: e.target.value }))}><option value="">選択してください</option>{activeRooms.map((r: RoomMaster) => <option key={r.id} value={r.id}>{r.room_name}</option>)}</select></Field>
              <NumberField label="単価" value={roomForm.unit_price} onChange={(v) => setRoomForm((p) => ({ ...p, unit_price: v }))} />
              <Field label="繁忙期加算"><input className="h-11 w-full rounded-xl border px-3" value={roomForm.busy_season_allowance} onChange={(e) => setRoomForm((p) => ({ ...p, busy_season_allowance: e.target.value }))} placeholder="例: 2026-07:300,2026-08:500" /></Field>
              <CheckField checked={roomForm.is_active} onChange={(v) => setRoomForm((p) => ({ ...p, is_active: v }))} />
              <div className="flex items-end justify-end"><Button className="min-w-[140px]" disabled={!roomForm.room_id || saving} onClick={() => onSaveRoom(roomForm)}>{saving ? "保存中..." : "保存"}</Button></div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <ListHeader title="部屋別単価一覧" description="登録済みの物件・部屋ごとの清掃単価です。" count={`${configuredRoomRates.length}件`} />
            <div className="overflow-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-4 py-3 text-left">物件</th><th className="px-4 py-3 text-left">部屋</th><th className="px-4 py-3 text-right">単価</th><th className="px-4 py-3 text-left">繁忙期加算</th><th className="px-4 py-3 text-left">状態</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>
              {configuredRoomRates.length === 0 ? <EmptyRow colSpan={6} text="部屋別単価が登録されていません。" /> : null}
              {configuredRoomRates.map(({ setting, room, property, propertyId }: any) => <tr key={setting.id || setting.room_id} className={`border-t hover:bg-neutral-50 ${roomForm.room_id === setting.room_id ? "bg-amber-50" : "bg-white"}`}><td className="px-4 py-3 font-medium">{property?.property_name || setting.property_name || "-"}</td><td className="px-4 py-3">{room?.room_name || setting.room_name || "-"}</td><td className="px-4 py-3 text-right">{yen(setting.unit_price ?? setting.rate)}</td><td className="px-4 py-3">{setting.busy_season_allowance || "-"}</td><td className="px-4 py-3"><Pill tone={setting.is_active === false ? "warn" : "good"}>{setting.is_active === false ? "無効" : "有効"}</Pill></td><td className="px-4 py-3 text-right"><EditButton onClick={() => selectConfiguredRoom(propertyId, setting.room_id)} /></td></tr>)}
            </tbody></table></div>
          </Card>
        </div>
      ) : null}

      {settingsTab === "property" ? (
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold">物件別単価</h2><p className="mt-1 text-sm text-neutral-500">物件ごとの清掃以外作業単価</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="物件"><select className="h-11 w-full rounded-xl border bg-white px-3" value={propertyTypeForm.property_id} onChange={(e) => setPropertyTypeForm((p) => ({ ...p, property_id: e.target.value }))}><option value="">選択してください</option>{activeProperties.map((p: PropertyMaster) => <option key={p.id} value={p.id}>{p.property_name}</option>)}</select></Field>
              <Field label="作業種別"><input className="h-11 w-full rounded-xl border px-3" value={propertyTypeForm.work_type} onChange={(e) => setPropertyTypeForm((p) => ({ ...p, work_type: e.target.value }))} placeholder="例: リネン運搬" /></Field>
              <NumberField label="単価" value={propertyTypeForm.unit_price} onChange={(v) => setPropertyTypeForm((p) => ({ ...p, unit_price: v }))} />
              <CheckField checked={propertyTypeForm.is_active} onChange={(v) => setPropertyTypeForm((p) => ({ ...p, is_active: v }))} />
              <div className="flex items-end justify-end lg:col-start-3"><Button className="min-w-[140px]" disabled={!propertyTypeForm.property_id || !propertyTypeForm.work_type || saving} onClick={() => onSavePropertyType(propertyTypeForm)}>{saving ? "保存中..." : "保存"}</Button></div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <ListHeader title="物件別単価一覧" description="物件ごとの清掃以外作業単価です。" count={`${configuredPropertyRates.length}件`} />
            <div className="overflow-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-4 py-3 text-left">物件</th><th className="px-4 py-3 text-left">作業種別</th><th className="px-4 py-3 text-right">単価</th><th className="px-4 py-3 text-left">状態</th><th className="px-4 py-3 text-right">操作</th></tr></thead><tbody>
              {configuredPropertyRates.length === 0 ? <EmptyRow colSpan={5} text="物件別単価が登録されていません。" /> : null}
              {configuredPropertyRates.map(({ setting, property }: any) => { const workType = setting.work_type || setting.property_type || ""; return <tr key={setting.id || `${setting.property_id}::${workType}`} className={`border-t hover:bg-neutral-50 ${propertyTypeForm.property_id === setting.property_id && propertyTypeForm.work_type === workType ? "bg-amber-50" : "bg-white"}`}><td className="px-4 py-3 font-medium">{property?.property_name || setting.property_name || "-"}</td><td className="px-4 py-3">{workType || "-"}</td><td className="px-4 py-3 text-right">{yen(setting.unit_price ?? setting.rate)}</td><td className="px-4 py-3"><Pill tone={setting.is_active === false ? "warn" : "good"}>{setting.is_active === false ? "無効" : "有効"}</Pill></td><td className="px-4 py-3 text-right"><EditButton onClick={() => selectConfiguredPropertyRate(setting.property_id, workType)} /></td></tr>; })}
            </tbody></table></div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ListHeader({ title, description, count }: any) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-neutral-500">{description}</p></div><Pill>{count}</Pill></div>;
}
function EmptyRow({ colSpan, text }: any) { return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-neutral-500">{text}</td></tr>; }
function EditButton({ onClick }: any) { return <button type="button" className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50" onClick={onClick}>編集</button>; }
function Field({ label, children }: any) { return <label className="block text-sm"><span className="mb-1 block text-neutral-600">{label}</span>{children}</label>; }
function NumberField({ label, value, onChange }: any) { return <Field label={label}><input type="number" className="h-11 w-full rounded-xl border px-3" value={value} onChange={(e) => onChange(Number(e.target.value || 0))} /></Field>; }
function CheckField({ checked, onChange }: any) { return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />有効</label>; }

function PayrollStatement({ staffList, selectedStaffId, onSelectStaff, selectedStaff, rows, total }: any) {
  const statementItems = React.useMemo(() => {
    const items: { row: PayrollDailyResult; kind: "piece" | "hourly" }[] = [];
    rows.forEach((r: PayrollDailyResult) => {
      if (Number(r.cleaning_amount || 0) !== 0 || Number(r.room_count || 0) > 0) items.push({ row: r, kind: "piece" });
      if (Number(r.hourly_amount || 0) !== 0 || Number(r.actual_hours || 0) > 0 || Number(r.adjustment_amount || 0) !== 0 || Number(r.transportation_fee || 0) !== 0) items.push({ row: r, kind: "hourly" });
    });
    return items.sort((a, b) => {
      const dateDiff = String(a.row.target_date).localeCompare(String(b.row.target_date));
      if (dateDiff) return dateDiff;
      if (a.kind !== b.kind) return a.kind === "piece" ? -1 : 1;
      return String(a.row.facility || "").localeCompare(String(b.row.facility || ""), "ja");
    });
  }, [rows]);
  let previousDate = "";
  return (
    <Card className="print-area p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold">個別給与明細</h2><p className="mt-1 text-sm text-neutral-500">スタッフを選択して印刷できます</p></div>
        <div className="flex gap-2"><select className="h-10 rounded-xl border bg-white px-3 text-sm print:hidden" value={selectedStaffId} onChange={(e) => onSelectStaff(e.target.value)}>{staffList.map((staff: PayrollDailyResult) => <option key={staff.staff_id} value={staff.staff_id}>{staff.staff_name}</option>)}</select><Button variant="outline" className="print:hidden" onClick={() => window.print()}>印刷</Button></div>
      </div>
      {!selectedStaff ? <div className="rounded-2xl border bg-neutral-50 p-6 text-sm text-neutral-500">対象スタッフがありません</div> : <>
        <div className="mb-5 grid gap-4 md:grid-cols-4"><Metric label="スタッフ" value={selectedStaff.staff_name} /><Metric label="計算方式" value={typeLabel(selectedStaff.payroll_type)} /><Metric label="対象日数" value={`${new Set(rows.map((r: PayrollDailyResult) => r.target_date)).size}日`} /><Metric label="支給合計" value={yen(total("final_amount", rows))} /></div>
        <div className="overflow-auto rounded-2xl border"><table className="w-full min-w-[900px] text-sm"><thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-3 py-3 text-left">日付</th><th className="px-3 py-3 text-left">施設</th><th className="px-3 py-3 text-left">区分</th><th className="px-3 py-3 text-left min-w-[280px]">内訳</th><th className="px-3 py-3 text-right">部屋数</th><th className="px-3 py-3 text-right">清掃報酬</th><th className="px-3 py-3 text-right">実働</th><th className="px-3 py-3 text-right">時給報酬</th><th className="px-3 py-3 text-right">保証調整</th><th className="px-3 py-3 text-right">交通費</th><th className="px-3 py-3 text-right">支給額</th></tr></thead><tbody>{statementItems.map(({ row: r, kind }) => {
          const displayDate = previousDate !== r.target_date;
          previousDate = r.target_date;
          const parts = String(r.note || "").split(" / ").filter(Boolean);
          const pieceDetail = parts.filter((x) => !x.startsWith("時給対象:")).join(" / ") || "-";
          const hourlyDetail = parts.filter((x) => x.startsWith("時給対象:")).join(" / ") || (Number(r.actual_hours || 0) > 0 ? `${Number(r.actual_hours || 0).toFixed(2)}h × ${yen(r.hourly_rate)}` : "-");
          if (kind === "piece") return <tr key={`${r.id}-statement-piece`} className="border-t bg-white"><td className="px-3 py-3 font-medium">{displayDate ? formatMd(r.target_date) : ""}</td><td className="px-3 py-3">{r.facility}</td><td className="px-3 py-3"><span className="rounded-full border bg-neutral-50 px-2 py-1 text-xs font-semibold">単価分</span></td><td className="px-3 py-3 text-xs leading-5 text-neutral-600">{pieceDetail}</td><td className="px-3 py-3 text-right">{r.room_count || ""}</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td></tr>;
          return <tr key={`${r.id}-statement-hourly`} className="border-t bg-blue-50/30"><td className="px-3 py-3 font-medium">{displayDate ? formatMd(r.target_date) : ""}</td><td className="px-3 py-3"></td><td className="px-3 py-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">時給換算分</span></td><td className="px-3 py-3 text-xs leading-5 text-neutral-600">{hourlyDetail}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right">{Number(r.actual_hours || 0).toFixed(2)}h</td><td className="px-3 py-3 text-right font-semibold">{yen(r.hourly_amount)}</td><td className="px-3 py-3 text-right">{yen(r.adjustment_amount)}</td><td className="px-3 py-3 text-right">{yen(r.transportation_fee)}</td><td className="px-3 py-3 text-right font-semibold">{yen(Number(r.hourly_amount || 0) + Number(r.adjustment_amount || 0) + Number(r.transportation_fee || 0))}</td></tr>;
        })}</tbody><tfoot className="border-t-2 bg-neutral-50 font-semibold"><tr><td className="px-3 py-3" colSpan={4}>合計</td><td className="px-3 py-3 text-right">{total("room_count", rows)}</td><td className="px-3 py-3 text-right">{yen(total("cleaning_amount", rows))}</td><td className="px-3 py-3 text-right">{total("actual_hours", rows).toFixed(2)}h</td><td className="px-3 py-3 text-right">{yen(total("hourly_amount", rows))}</td><td className="px-3 py-3 text-right">{yen(total("adjustment_amount", rows))}</td><td className="px-3 py-3 text-right">{yen(total("transportation_fee", rows))}</td><td className="px-3 py-3 text-right">{yen(total("final_amount", rows))}</td></tr></tfoot></table></div>
      </>}
    </Card>
  );
}
