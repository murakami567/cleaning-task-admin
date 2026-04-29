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

function Button({
  children,
  active,
  variant = "default",
  className = "",
  disabled,
  ...props
}: any) {
  const style =
    active || variant === "default"
      ? "bg-black text-white hover:bg-black/90 disabled:bg-black/40"
      : "border bg-white text-black hover:bg-black/5 disabled:text-black/40";

  return (
    <button
      className={`h-10 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed ${style} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }: any) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function Pill({ children, tone = "default" }: any) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-neutral-200 bg-white text-neutral-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${cls}`}>
      {children}
    </span>
  );
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

  const [rows, setRows] = useState<PayrollDailyResult[]>([]);
  const [settings, setSettings] = useState<any>({
    staff_payroll_settings: [],
    room_piece_rates: [],
    property_type_piece_rates: [],
  });

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
    const res = await fetch(
      `${API_BASE}/payroll/daily-results?year=${year}&month=${month}`
    );
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

    return {
      staffs: await staffRes.json(),
      properties: await propertyRes.json(),
      rooms: await roomRes.json(),
    };
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [settingsData, resultData, masterData] = await Promise.all([
        fetchSettings(),
        fetchResults(),
        fetchMasterData(),
      ]);

      setSettings(settingsData);
      setRows(resultData);
      setStaffs(Array.isArray(masterData.staffs) ? masterData.staffs : []);
      setProperties(
        Array.isArray(masterData.properties) ? masterData.properties : []
      );
      setRooms(Array.isArray(masterData.rooms) ? masterData.rooms : []);

      if (resultData.length > 0) {
        setSelectedStaffId((prev) =>
          prev && resultData.some((r: PayrollDailyResult) => r.staff_id === prev)
            ? prev
            : resultData[0].staff_id
        );
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

  const calculateMonthly = async () => {
    try {
      setCalculating(true);
      setError("");

      await postJson(`${API_BASE}/payroll/calculate-monthly`, {
        year,
        month,
      });

      await loadAll();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "月次計算に失敗しました");
    } finally {
      setCalculating(false);
    }
  };

  const saveStaffPayrollSetting = async (payload: any) => {
    try {
      setSaving(true);
      setError("");

      await postJson(`${API_BASE}/payroll/settings/staff/upsert`, payload);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "スタッフ給与設定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const saveRoomRate = async (payload: any) => {
    try {
      setSaving(true);
      setError("");

      await postJson(`${API_BASE}/payroll/rates/room/upsert`, payload);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "部屋単価の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const savePropertyTypeRate = async (payload: any) => {
    try {
      setSaving(true);
      setError("");

      await postJson(`${API_BASE}/payroll/rates/property-type/upsert`, payload);
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "物件タイプ単価の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [year, month]);

  const staffList = useMemo(() => {
    const map = new Map<string, PayrollDailyResult>();
    rows.forEach((r) => {
      if (!map.has(r.staff_id)) map.set(r.staff_id, r);
    });
    return Array.from(map.values());
  }, [rows]);

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return staffList[0] || null;
    return (
      staffList.find((s) => s.staff_id === selectedStaffId) ||
      staffList[0] ||
      null
    );
  }, [staffList, selectedStaffId]);

  const selectedRows = useMemo(() => {
    if (!selectedStaff) return [];
    return rows
      .filter((r) => r.staff_id === selectedStaff.staff_id)
      .sort((a, b) => {
        if (a.target_date === b.target_date) {
          return String(a.facility || "").localeCompare(
            String(b.facility || ""),
            "ja"
          );
        }
        return String(a.target_date).localeCompare(String(b.target_date));
      });
  }, [rows, selectedStaff]);

  const total = (key: keyof PayrollDailyResult, list = rows) =>
    list.reduce((sum, r) => sum + Number(r[key] || 0), 0);

  let lastDate = "";

  return (
  <div className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
    <style>
      {`
        @media print {
  body * {
    visibility: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible;
  }

  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
    box-shadow: none !important;
    transform: scale(0.82);
    transform-origin: top left;
  }

  @page {
    size: A4 portrait;
    margin: 8mm;
  }
}
      `}
    </style>

    <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">給与・勤怠</h1>
            <p className="text-sm text-neutral-500">
              実働報告・完了清掃タスク・単価設定から給与明細を作成
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-xl border bg-white px-3 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}月
                </option>
              ))}
            </select>

            <Button variant="outline" onClick={loadAll} disabled={loading}>
              更新
            </Button>
            <Button onClick={calculateMonthly} disabled={calculating}>
              {calculating ? "計算中..." : "月次計算"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            active={tab === "daily"}
            variant={tab === "daily" ? "default" : "outline"}
            onClick={() => setTab("daily")}
          >
            当月確認一覧
          </Button>
          <Button
            active={tab === "settings"}
            variant={tab === "settings" ? "default" : "outline"}
            onClick={() => setTab("settings")}
          >
            単価・スタッフ設定
          </Button>
          <Button
            active={tab === "statement"}
            variant={tab === "statement" ? "default" : "outline"}
            onClick={() => setTab("statement")}
          >
            個別明細
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-neutral-500">
            読み込み中...
          </div>
        )}

        {tab === "daily" && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-5">
              <Metric label="対象スタッフ" value={`${staffList.length}名`} />
              <Metric label="部屋単価報酬" value={yen(total("cleaning_amount"))} />
              <Metric label="時給報酬" value={yen(total("hourly_amount"))} />
              <Metric label="最低保証調整" value={yen(total("adjustment_amount"))} />
              <Metric label="支給合計" value={yen(total("final_amount"))} />
            </div>

            <Card className="p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">
                  {year}/{month} 当月確認一覧
                </h2>
                <p className="text-sm text-neutral-500">
                  スタッフ別・日別の給与計算結果
                </p>
              </div>

              <div className="overflow-auto rounded-2xl border">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-neutral-100 text-xs text-neutral-600">
                    <tr>
                      <th className="px-3 py-3 text-left">日付</th>
                      <th className="px-3 py-3 text-left">スタッフ</th>
                      <th className="px-3 py-3 text-left">計算方式</th>
                      <th className="px-3 py-3 text-left">施設</th>
                      <th className="px-3 py-3 text-right">部屋数</th>
                      <th className="px-3 py-3 text-right">清掃報酬</th>
                      <th className="px-3 py-3 text-right">作業時間</th>
                      <th className="px-3 py-3 text-right">実働</th>
                      <th className="px-3 py-3 text-right">時給報酬</th>
                      <th className="px-3 py-3 text-right">保証調整</th>
                      <th className="px-3 py-3 text-right">交通費</th>
                      <th className="px-3 py-3 text-right">支給額</th>
                      <th className="px-3 py-3 text-left">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="cursor-pointer border-t bg-white hover:bg-neutral-50"
                        onClick={() => {
                          setSelectedStaffId(r.staff_id);
                          setTab("statement");
                        }}
                      >
                        <td className="px-3 py-3">{formatMd(r.target_date)}</td>
                        <td className="px-3 py-3 font-medium">{r.staff_name}</td>
                        <td className="px-3 py-3">
                          <Pill>{typeLabel(r.payroll_type)}</Pill>
                        </td>
                        <td className="px-3 py-3">{r.facility}</td>
                        <td className="px-3 py-3 text-right">
                          {r.room_count || ""}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {yen(r.cleaning_amount)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {r.work_hours ? `${r.work_hours}h` : ""}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {r.actual_hours ? `${r.actual_hours}h` : ""}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {yen(r.hourly_amount)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {yen(r.adjustment_amount)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {yen(r.transportation_fee)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {yen(r.final_amount)}
                        </td>
                        <td className="px-3 py-3">
                          <Pill tone={r.status === "確定済" ? "good" : "warn"}>
                            {r.status}
                          </Pill>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={13}
                          className="px-3 py-10 text-center text-neutral-500"
                        >
                          給与計算結果がありません。月次計算を実行してください。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="p-5">
                <h2 className="text-lg font-semibold">
                  スタッフ別給与設定を追加
                </h2>
                <p className="text-sm text-neutral-500">
                  スタッフ一覧は管理側のスタッフマスタを参照します
                </p>
                <PayrollStaffSettingForm
                  staffs={staffs}
                  onSave={saveStaffPayrollSetting}
                  disabled={saving}
                />
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold">部屋別単価を追加</h2>
                <p className="text-sm text-neutral-500">
                  物件・部屋は管理側の物件/部屋マスタを参照します
                </p>
                <RoomRateForm
                  properties={properties}
                  rooms={rooms}
                  onSave={saveRoomRate}
                  disabled={saving}
                />
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold">
                  物件タイプ単価を追加
                </h2>
                <p className="text-sm text-neutral-500">
                  部屋別単価がない場合に使用されます
                </p>
                <PropertyTypeRateForm
                  properties={properties}
                  onSave={savePropertyTypeRate}
                  disabled={saving}
                />
              </Card>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="p-5">
                <h2 className="text-lg font-semibold">スタッフ別給与設定</h2>
                <p className="mb-4 text-sm text-neutral-500">
                  計算方式・時給・最低保証・交通費
                </p>

                <div className="overflow-auto rounded-2xl border">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-neutral-100 text-xs text-neutral-600">
                      <tr>
                        <th className="px-3 py-3 text-left">スタッフ</th>
                        <th className="px-3 py-3 text-left">計算方式</th>
                        <th className="px-3 py-3 text-right">時給</th>
                        <th className="px-3 py-3 text-right">最低保証</th>
                        <th className="px-3 py-3 text-right">交通費</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.staff_payroll_settings.map((s: any) => (
                        <tr key={s.id} className="border-t bg-white">
                          <td className="px-3 py-3 font-medium">
                            {s.staff_name}
                          </td>
                          <td className="px-3 py-3">
                            <Pill>{typeLabel(s.payroll_type)}</Pill>
                          </td>
                          <td className="px-3 py-3 text-right">
                            {yen(s.hourly_rate)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {s.minimum_hours
                              ? `${s.minimum_hours}h / ${yen(
                                  s.hourly_rate * s.minimum_hours
                                )}`
                              : "-"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {yen(s.transportation_fee)}
                          </td>
                        </tr>
                      ))}

                      {settings.staff_payroll_settings.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-10 text-center text-neutral-500"
                          >
                            スタッフ給与設定がありません。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-lg font-semibold">物件・部屋単価設定</h2>
                <p className="mb-4 text-sm text-neutral-500">
                  部屋別単価を優先し、なければ物件タイプ単価
                </p>

                <div className="space-y-4">
                  <div className="overflow-auto rounded-2xl border">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-neutral-100 text-xs text-neutral-600">
                        <tr>
                          <th className="px-3 py-3 text-left">物件</th>
                          <th className="px-3 py-3 text-left">部屋</th>
                          <th className="px-3 py-3 text-right">単価</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.room_piece_rates.map((r: any) => (
                          <tr key={r.id} className="border-t bg-white">
                            <td className="px-3 py-3 font-medium">
                              {r.property_name}
                            </td>
                            <td className="px-3 py-3">{r.room_name}</td>
                            <td className="px-3 py-3 text-right font-semibold">
                              {yen(r.rate)}
                            </td>
                          </tr>
                        ))}

                        {settings.room_piece_rates.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-3 py-8 text-center text-neutral-500"
                            >
                              部屋別単価がありません。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="overflow-auto rounded-2xl border">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-neutral-100 text-xs text-neutral-600">
                        <tr>
                          <th className="px-3 py-3 text-left">物件</th>
                          <th className="px-3 py-3 text-left">タイプ</th>
                          <th className="px-3 py-3 text-right">単価</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.property_type_piece_rates.map((r: any) => (
                          <tr key={r.id} className="border-t bg-white">
                            <td className="px-3 py-3 font-medium">
                              {r.property_name}
                            </td>
                            <td className="px-3 py-3">{r.property_type}</td>
                            <td className="px-3 py-3 text-right font-semibold">
                              {yen(r.rate)}
                            </td>
                          </tr>
                        ))}

                        {settings.property_type_piece_rates.length === 0 && (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-3 py-8 text-center text-neutral-500"
                            >
                              物件タイプ単価がありません。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "statement" && (
          <Card className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">給与明細プレビュー</h2>
                <p className="text-sm text-neutral-500">
                  スタッフを選択して1か月分を表形式で表示
                </p>
              </div>
              <Button variant="outline" onClick={() => window.print()}>
                印刷 / PDF
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {staffList.map((s) => (
                <Button
                  key={s.staff_id}
                  variant={
                    selectedStaff?.staff_id === s.staff_id
                      ? "default"
                      : "outline"
                  }
                  onClick={() => setSelectedStaffId(s.staff_id)}
                >
                  {s.staff_name}
                </Button>
              ))}
            </div>

            <div className="print-area rounded-2xl border bg-white p-6">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">給与明細書</h2>
                <div className="mt-2 grid gap-2 text-sm text-neutral-600 md:grid-cols-3">
                  <div>
                    対象月：{year}年{month}月
                  </div>
                  <div>氏名：{selectedStaff?.staff_name || "-"}</div>
                  <div>雇用区分：{typeLabel(selectedStaff?.payroll_type)}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <Metric
                  label="部屋単価報酬"
                  value={yen(total("cleaning_amount", selectedRows))}
                />
                <Metric
                  label="時給作業報酬"
                  value={yen(total("hourly_amount", selectedRows))}
                />
                <Metric
                  label="最低保証調整"
                  value={yen(total("adjustment_amount", selectedRows))}
                />
                <Metric
                  label="支給合計"
                  value={yen(total("final_amount", selectedRows))}
                />
              </div>

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
                    {selectedRows.map((r) => {
                      const showDate = r.target_date !== lastDate;
                      lastDate = r.target_date;

                      return (
                        <tr key={r.id} className="border-t bg-white">
                          <td className="px-3 py-3">
                            {showDate ? formatMd(r.target_date) : ""}
                          </td>
                          <td className="px-3 py-3">{r.facility}</td>
                          <td className="px-3 py-3 text-right">
                            {r.room_count || ""}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.worker_count || ""}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.unit_price ? yen(r.unit_price) : ""}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold">
                            {r.final_amount ? yen(r.final_amount) : ""}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.work_hours ? `${r.work_hours}h` : ""}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.actual_hours ? `${r.actual_hours}h` : ""}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.hourly_rate ? yen(r.hourly_rate) : ""}
                          </td>
                          <td className="px-3 py-3">
                            {r.busy_season_allowance || ""}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.transportation_fee
                              ? yen(r.transportation_fee)
                              : ""}
                          </td>
                        </tr>
                      );
                    })}

                    {selectedRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-3 py-10 text-center text-neutral-500"
                        >
                          明細データがありません。
                        </td>
                      </tr>
                    )}

                    {selectedRows.length > 0 && (
                      <tr className="border-t bg-neutral-100 font-semibold">
                        <td colSpan={5} className="px-3 py-3">
                          月合計
                        </td>
                        <td className="px-3 py-3 text-right">
                          {yen(total("final_amount", selectedRows))}
                        </td>
                        <td colSpan={5}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function PayrollStaffSettingForm({
  staffs,
  onSave,
  disabled,
}: {
  staffs: StaffMaster[];
  onSave: (payload: any) => void;
  disabled?: boolean;
}) {
  const [staffId, setStaffId] = useState("");
  const [payrollType, setPayrollType] = useState("piece");
  const [hourlyRate, setHourlyRate] = useState(1300);
  const [minimumHours, setMinimumHours] = useState(6);
  const [transportationFee, setTransportationFee] = useState(500);

  const staff = staffs.find((s) => s.id === staffId);

  return (
    <div className="mt-4 grid gap-3">
      <select
        className="h-10 rounded-xl border bg-white px-3 text-sm"
        value={staffId}
        onChange={(e) => setStaffId(e.target.value)}
      >
        <option value="">スタッフ選択</option>
        {staffs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.staff_name}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-xl border bg-white px-3 text-sm"
        value={payrollType}
        onChange={(e) => setPayrollType(e.target.value)}
      >
        <option value="piece">単価計算</option>
        <option value="hourly">時給計算</option>
      </select>

      <input
        className="h-10 rounded-xl border px-3 text-sm"
        type="number"
        value={hourlyRate}
        onChange={(e) => setHourlyRate(Number(e.target.value))}
        placeholder="時給"
      />

      <input
        className="h-10 rounded-xl border px-3 text-sm"
        type="number"
        value={minimumHours}
        onChange={(e) => setMinimumHours(Number(e.target.value))}
        placeholder="最低保証時間"
      />

      <input
        className="h-10 rounded-xl border px-3 text-sm"
        type="number"
        value={transportationFee}
        onChange={(e) => setTransportationFee(Number(e.target.value))}
        placeholder="交通費"
      />

      <Button
        disabled={disabled}
        onClick={() => {
          if (!staff) {
            window.alert("スタッフを選択してください");
            return;
          }

          onSave({
            staff_id: staff.id,
            staff_name: staff.staff_name,
            payroll_type: payrollType,
            hourly_rate: hourlyRate,
            minimum_hours: minimumHours,
            transportation_fee: transportationFee,
          });
        }}
      >
        保存
      </Button>
    </div>
  );
}

function RoomRateForm({
  properties,
  rooms,
  onSave,
  disabled,
}: {
  properties: PropertyMaster[];
  rooms: RoomMaster[];
  onSave: (payload: any) => void;
  disabled?: boolean;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rate, setRate] = useState(1500);

  const property = properties.find((p) => p.id === propertyId);
  const filteredRooms = rooms.filter((r) => r.property_id === propertyId);
  const room = rooms.find((r) => r.id === roomId);

  return (
    <div className="mt-4 grid gap-3">
      <select
        className="h-10 rounded-xl border bg-white px-3 text-sm"
        value={propertyId}
        onChange={(e) => {
          setPropertyId(e.target.value);
          setRoomId("");
        }}
      >
        <option value="">物件選択</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.property_name}
          </option>
        ))}
      </select>

      <select
        className="h-10 rounded-xl border bg-white px-3 text-sm"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        disabled={!propertyId}
      >
        <option value="">部屋選択</option>
        {filteredRooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.room_name}
          </option>
        ))}
      </select>

      <input
        className="h-10 rounded-xl border px-3 text-sm"
        type="number"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        placeholder="単価"
      />

      <Button
        disabled={disabled}
        onClick={() => {
          if (!property || !room) {
            window.alert("物件と部屋を選択してください");
            return;
          }

          onSave({
            property_id: property.id,
            property_name: property.property_name,
            room_id: room.id,
            room_name: room.room_name,
            room_key: room.room_key,
            rate,
          });
        }}
      >
        保存
      </Button>
    </div>
  );
}

function PropertyTypeRateForm({
  properties,
  onSave,
  disabled,
}: {
  properties: PropertyMaster[];
  onSave: (payload: any) => void;
  disabled?: boolean;
}) {
  const [propertyId, setPropertyId] = useState("");
  const [propertyType, setPropertyType] = useState("通常");
  const [rate, setRate] = useState(1500);

  const property = properties.find((p) => p.id === propertyId);

  return (
    <div className="mt-4 grid gap-3">
      <select
        className="h-10 rounded-xl border bg-white px-3 text-sm"
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
      >
        <option value="">物件選択</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.property_name}
          </option>
        ))}
      </select>

      <input
        className="h-10 rounded-xl border px-3 text-sm"
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        placeholder="タイプ名"
      />

      <input
        className="h-10 rounded-xl border px-3 text-sm"
        type="number"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        placeholder="単価"
      />

      <Button
        disabled={disabled}
        onClick={() => {
          if (!property) {
            window.alert("物件を選択してください");
            return;
          }

          onSave({
            property_id: property.id,
            property_name: property.property_name,
            property_type: propertyType,
            rate,
          });
        }}
      >
        保存
      </Button>
    </div>
  );
}
