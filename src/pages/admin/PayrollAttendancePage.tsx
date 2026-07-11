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
        <div>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/admin/home";
            }}
            className="mb-4 inline-flex h-10 items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            ← タスク管理に戻る
          </button>
        </div>

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
                          <Pill tone={r.status === "確定" ? "good" : "warn"}>
                            {r.status || "未確定"}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === "settings" && (
          <PayrollSettings
            settings={settings}
            staffs={staffs}
            properties={properties}
            rooms={rooms}
            saving={saving}
            onSaveStaff={saveStaffPayrollSetting}
            onSaveRoom={saveRoomRate}
            onSavePropertyType={savePropertyTypeRate}
          />
        )}

        {tab === "statement" && (
          <PayrollStatement
            staffList={staffList}
            selectedStaffId={selectedStaff?.staff_id || ""}
            onSelectStaff={setSelectedStaffId}
            selectedStaff={selectedStaff}
            rows={selectedRows}
            total={total}
            yen={yen}
            formatMd={formatMd}
          />
        )}
      </div>
    </div>
  );
}

function PayrollSettings({
  settings,
  staffs,
  properties,
  rooms,
  saving,
  onSaveStaff,
  onSaveRoom,
  onSavePropertyType,
}: any) {
  const [staffForm, setStaffForm] = useState({
    staff_id: "",
    payroll_type: "piece_rate",
    hourly_rate: 0,
    minimum_guarantee: 0,
    transportation_fee: 0,
    is_active: true,
  });

  const [roomForm, setRoomForm] = useState({
    property_id: "",
    room_id: "",
    unit_price: 0,
    busy_season_allowance: "",
    is_active: true,
  });

  const [propertyTypeForm, setPropertyTypeForm] = useState({
    property_id: "",
    work_type: "",
    unit_price: 0,
    is_active: true,
  });

  const activeStaffs = staffs.filter((s: StaffMaster) => s.is_active !== false);
  const activeProperties = properties.filter(
    (p: PropertyMaster) => p.is_active !== false
  );
  const activeRooms = rooms.filter(
    (r: RoomMaster) =>
      r.is_active !== false &&
      (!roomForm.property_id || r.property_id === roomForm.property_id)
  );

  const staffSettingMap = new Map(
    (settings.staff_payroll_settings || []).map((x: any) => [x.staff_id, x])
  );

  const roomRateMap = new Map(
    (settings.room_piece_rates || []).map((x: any) => [x.room_id, x])
  );

  const propertyTypeRateMap = new Map(
    (settings.property_type_piece_rates || []).map((x: any) => [
      `${x.property_id}::${x.work_type}`,
      x,
    ])
  );

  useEffect(() => {
    if (!staffForm.staff_id) return;
    const current = staffSettingMap.get(staffForm.staff_id) as any;
    setStaffForm((prev) => ({
      ...prev,
      payroll_type: current?.payroll_type || "piece_rate",
      hourly_rate: Number(current?.hourly_rate || 0),
      minimum_guarantee: Number(current?.minimum_guarantee || 0),
      transportation_fee: Number(current?.transportation_fee || 0),
      is_active: current?.is_active !== false,
    }));
  }, [staffForm.staff_id]);

  useEffect(() => {
    if (!roomForm.room_id) return;
    const current = roomRateMap.get(roomForm.room_id) as any;
    setRoomForm((prev) => ({
      ...prev,
      unit_price: Number(current?.unit_price || 0),
      busy_season_allowance: current?.busy_season_allowance || "",
      is_active: current?.is_active !== false,
    }));
  }, [roomForm.room_id]);

  useEffect(() => {
    if (!propertyTypeForm.property_id || !propertyTypeForm.work_type) return;
    const current = propertyTypeRateMap.get(
      `${propertyTypeForm.property_id}::${propertyTypeForm.work_type}`
    ) as any;
    setPropertyTypeForm((prev) => ({
      ...prev,
      unit_price: Number(current?.unit_price || 0),
      is_active: current?.is_active !== false,
    }));
  }, [propertyTypeForm.property_id, propertyTypeForm.work_type]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-lg font-semibold">スタッフ給与設定</h2>
          <p className="mt-1 text-sm text-neutral-500">
            給与形態・時給・最低保証・交通費
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">スタッフ</span>
              <select
                className="h-11 w-full rounded-xl border bg-white px-3"
                value={staffForm.staff_id}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    staff_id: e.target.value,
                  }))
                }
              >
                <option value="">選択してください</option>
                {activeStaffs.map((s: StaffMaster) => (
                  <option key={s.id} value={s.id}>
                    {s.staff_name}
                    {s.staff_code ? ` (${s.staff_code})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">給与形態</span>
              <select
                className="h-11 w-full rounded-xl border bg-white px-3"
                value={staffForm.payroll_type}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    payroll_type: e.target.value,
                  }))
                }
              >
                <option value="piece_rate">単価</option>
                <option value="hourly">時給</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">時給</span>
              <input
                type="number"
                className="h-11 w-full rounded-xl border px-3"
                value={staffForm.hourly_rate}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    hourly_rate: Number(e.target.value || 0),
                  }))
                }
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">最低保証</span>
              <input
                type="number"
                className="h-11 w-full rounded-xl border px-3"
                value={staffForm.minimum_guarantee}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    minimum_guarantee: Number(e.target.value || 0),
                  }))
                }
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">交通費</span>
              <input
                type="number"
                className="h-11 w-full rounded-xl border px-3"
                value={staffForm.transportation_fee}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    transportation_fee: Number(e.target.value || 0),
                  }))
                }
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={staffForm.is_active}
                onChange={(e) =>
                  setStaffForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
              />
              有効
            </label>

            <Button
              className="w-full"
              disabled={!staffForm.staff_id || saving}
              onClick={() => onSaveStaff(staffForm)}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">部屋別単価</h2>
          <p className="mt-1 text-sm text-neutral-500">
            物件・部屋ごとの清掃単価
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">物件</span>
              <select
                className="h-11 w-full rounded-xl border bg-white px-3"
                value={roomForm.property_id}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    property_id: e.target.value,
                    room_id: "",
                  }))
                }
              >
                <option value="">選択してください</option>
                {activeProperties.map((p: PropertyMaster) => (
                  <option key={p.id} value={p.id}>
                    {p.property_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">部屋</span>
              <select
                className="h-11 w-full rounded-xl border bg-white px-3"
                value={roomForm.room_id}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    room_id: e.target.value,
                  }))
                }
              >
                <option value="">選択してください</option>
                {activeRooms.map((r: RoomMaster) => (
                  <option key={r.id} value={r.id}>
                    {r.room_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">単価</span>
              <input
                type="number"
                className="h-11 w-full rounded-xl border px-3"
                value={roomForm.unit_price}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    unit_price: Number(e.target.value || 0),
                  }))
                }
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">繁忙期加算</span>
              <input
                type="text"
                className="h-11 w-full rounded-xl border px-3"
                value={roomForm.busy_season_allowance}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    busy_season_allowance: e.target.value,
                  }))
                }
                placeholder="例: 2026-07:300,2026-08:500"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={roomForm.is_active}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
              />
              有効
            </label>

            <Button
              className="w-full"
              disabled={!roomForm.room_id || saving}
              onClick={() => onSaveRoom(roomForm)}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold">物件タイプ別単価</h2>
          <p className="mt-1 text-sm text-neutral-500">
            物件ごとの清掃以外作業単価
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">物件</span>
              <select
                className="h-11 w-full rounded-xl border bg-white px-3"
                value={propertyTypeForm.property_id}
                onChange={(e) =>
                  setPropertyTypeForm((prev) => ({
                    ...prev,
                    property_id: e.target.value,
                  }))
                }
              >
                <option value="">選択してください</option>
                {activeProperties.map((p: PropertyMaster) => (
                  <option key={p.id} value={p.id}>
                    {p.property_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">作業種別</span>
              <input
                type="text"
                className="h-11 w-full rounded-xl border px-3"
                value={propertyTypeForm.work_type}
                onChange={(e) =>
                  setPropertyTypeForm((prev) => ({
                    ...prev,
                    work_type: e.target.value,
                  }))
                }
                placeholder="例: リネン運搬"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-neutral-600">単価</span>
              <input
                type="number"
                className="h-11 w-full rounded-xl border px-3"
                value={propertyTypeForm.unit_price}
                onChange={(e) =>
                  setPropertyTypeForm((prev) => ({
                    ...prev,
                    unit_price: Number(e.target.value || 0),
                  }))
                }
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={propertyTypeForm.is_active}
                onChange={(e) =>
                  setPropertyTypeForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
              />
              有効
            </label>

            <Button
              className="w-full"
              disabled={
                !propertyTypeForm.property_id ||
                !propertyTypeForm.work_type ||
                saving
              }
              onClick={() => onSavePropertyType(propertyTypeForm)}
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function PayrollStatement({
  staffList,
  selectedStaffId,
  onSelectStaff,
  selectedStaff,
  rows,
  total,
  yen,
  formatMd,
}: any) {
  let previousDate = "";
  return (
    <Card className="print-area p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">個別給与明細</h2>
          <p className="mt-1 text-sm text-neutral-500">
            スタッフを選択して印刷できます
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-10 rounded-xl border bg-white px-3 text-sm print:hidden"
            value={selectedStaffId}
            onChange={(e) => onSelectStaff(e.target.value)}
          >
            {staffList.map((staff: PayrollDailyResult) => (
              <option key={staff.staff_id} value={staff.staff_id}>
                {staff.staff_name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            className="print:hidden"
            onClick={() => window.print()}
          >
            印刷
          </Button>
        </div>
      </div>

      {!selectedStaff ? (
        <div className="rounded-2xl border bg-neutral-50 p-6 text-sm text-neutral-500">
          対象スタッフがありません
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 md:grid-cols-4">
            <Metric label="スタッフ" value={selectedStaff.staff_name} />
            <Metric label="計算方式" value={typeLabel(selectedStaff.payroll_type)} />
            <Metric label="対象日数" value={`${new Set(rows.map((r: PayrollDailyResult) => r.target_date)).size}日`} />
            <Metric label="支給合計" value={yen(total("final_amount", rows))} />
          </div>

          <div className="overflow-auto rounded-2xl border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-100 text-xs text-neutral-600">
                <tr>
                  <th className="px-3 py-3 text-left">日付</th>
                  <th className="px-3 py-3 text-left">施設</th>
                  <th className="px-3 py-3 text-right">部屋数</th>
                  <th className="px-3 py-3 text-right">清掃報酬</th>
                  <th className="px-3 py-3 text-right">作業時間</th>
                  <th className="px-3 py-3 text-right">実働</th>
                  <th className="px-3 py-3 text-right">時給報酬</th>
                  <th className="px-3 py-3 text-right">保証調整</th>
                  <th className="px-3 py-3 text-right">交通費</th>
                  <th className="px-3 py-3 text-right">支給額</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: PayrollDailyResult) => {
                  const displayDate = previousDate !== r.target_date;
                  previousDate = r.target_date;
                  return (
                    <tr key={r.id} className="border-t bg-white">
                      <td className="px-3 py-3 font-medium">
                        {displayDate ? formatMd(r.target_date) : ""}
                      </td>
                      <td className="px-3 py-3">{r.facility}</td>
                      <td className="px-3 py-3 text-right">{r.room_count || ""}</td>
                      <td className="px-3 py-3 text-right">{yen(r.cleaning_amount)}</td>
                      <td className="px-3 py-3 text-right">
                        {r.work_hours ? `${r.work_hours}h` : ""}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {r.actual_hours ? `${r.actual_hours}h` : ""}
                      </td>
                      <td className="px-3 py-3 text-right">{yen(r.hourly_amount)}</td>
                      <td className="px-3 py-3 text-right">{yen(r.adjustment_amount)}</td>
                      <td className="px-3 py-3 text-right">{yen(r.transportation_fee)}</td>
                      <td className="px-3 py-3 text-right font-semibold">{yen(r.final_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 bg-neutral-50 font-semibold">
                <tr>
                  <td className="px-3 py-3" colSpan={2}>合計</td>
                  <td className="px-3 py-3 text-right">{total("room_count", rows)}</td>
                  <td className="px-3 py-3 text-right">{yen(total("cleaning_amount", rows))}</td>
                  <td className="px-3 py-3 text-right">{total("work_hours", rows).toFixed(2)}h</td>
                  <td className="px-3 py-3 text-right">{total("actual_hours", rows).toFixed(2)}h</td>
                  <td className="px-3 py-3 text-right">{yen(total("hourly_amount", rows))}</td>
                  <td className="px-3 py-3 text-right">{yen(total("adjustment_amount", rows))}</td>
                  <td className="px-3 py-3 text-right">{yen(total("transportation_fee", rows))}</td>
                  <td className="px-3 py-3 text-right">{yen(total("final_amount", rows))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}