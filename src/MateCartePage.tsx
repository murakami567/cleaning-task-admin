import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Staff = {
  id: string;
  staff_code: string | null;
  staff_name: string;
  role: string | null;
  sort_order: number | null;
};

type Property = {
  id: string;
  property_name: string;
  property_code: string | null;
  sort_order: number | null;
};

type MateCarte = {
  id: string;
  target_staff_id: string;
  target_staff_name: string;
  record_date: string;
  instructor_id: string;
  instructor_name: string;
  property_ids: string[];
  property_names: string[];
  cleaning_start_at: string | null;
  cleaning_end_at: string | null;
  guidance_category: string;
  good_points: string;
  correction_points: string;
  handover_notes: string;
  created_at: string;
};

type CleaningSummary = {
  task_count: number;
  property_names: string[];
  cleaning_start_at: string | null;
  cleaning_end_at: string | null;
};

const GUIDANCE_OPTIONS = ["清掃全般", "倉庫作業", "その他作業"];

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  return String(value).slice(0, 10).replaceAll("-", "/");
}

function fmtTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(11, 16) || "-";
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function getToken() {
  return localStorage.getItem("admin_access_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function MateCartePage() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [records, setRecords] = useState<MateCarte[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    record_date: todayIso(),
    property_ids: [] as string[],
    guidance_category: "清掃全般",
    good_points: "",
    correction_points: "",
    handover_notes: "",
  });
  const [summary, setSummary] = useState<CleaningSummary | null>(null);

  const selectedStaff = useMemo(
    () => staffs.find((s) => s.id === selectedStaffId) || null,
    [staffs, selectedStaffId]
  );

  const filteredStaffs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffs;
    return staffs.filter((s) =>
      `${s.staff_name} ${s.staff_code ?? ""} ${s.role ?? ""}`.toLowerCase().includes(q)
    );
  }, [staffs, query]);

  const selectedPropertyNames = useMemo(() => {
    const map = new Map(properties.map((p) => [p.id, p.property_name]));
    return form.property_ids.map((id) => map.get(id)).filter(Boolean) as string[];
  }, [form.property_ids, properties]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const [staffRes, propRes] = await Promise.all([
        fetch(`${API_BASE}/mate-cartes/targets`, { headers: authHeaders() }),
        fetch(`${API_BASE}/mate-cartes/properties`, { headers: authHeaders() }),
      ]);
      const staffData = await staffRes.json();
      const propData = await propRes.json();
      if (!staffRes.ok) throw new Error(staffData?.detail || "対象スタッフ取得に失敗しました。");
      if (!propRes.ok) throw new Error(propData?.detail || "物件取得に失敗しました。");
      const staffList = Array.isArray(staffData) ? staffData : [];
      setStaffs(staffList);
      setProperties(Array.isArray(propData) ? propData : []);
      if (!selectedStaffId && staffList.length > 0) {
        setSelectedStaffId(staffList[0].id);
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "メイトカルテ初期取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (staffId: string) => {
    if (!staffId) return;
    try {
      setRecordLoading(true);
      const res = await fetch(`${API_BASE}/mate-cartes/${staffId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "カルテ取得に失敗しました。");
      setRecords(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "カルテ取得に失敗しました。");
    } finally {
      setRecordLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!selectedStaffId || !form.record_date) return;
    try {
      const res = await fetch(
        `${API_BASE}/mate-cartes/${selectedStaffId}/cleaning-summary?record_date=${encodeURIComponent(form.record_date)}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "清掃時間取得に失敗しました。");
      setSummary(data);
      if (Array.isArray(data.property_names) && data.property_names.length > 0) {
        const ids = properties
          .filter((p) => data.property_names.includes(p.property_name))
          .map((p) => p.id);
        if (ids.length > 0 && form.property_ids.length === 0) {
          setForm((s) => ({ ...s, property_ids: ids }));
        }
      }
    } catch (e) {
      console.error(e);
      setSummary(null);
    }
  };

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    if (selectedStaffId) void loadRecords(selectedStaffId);
  }, [selectedStaffId]);

  useEffect(() => {
    if (showForm) void loadSummary();
  }, [showForm, selectedStaffId, form.record_date, properties.length]);

  const openAdd = () => {
    setForm({
      record_date: todayIso(),
      property_ids: [],
      guidance_category: "清掃全般",
      good_points: "",
      correction_points: "",
      handover_notes: "",
    });
    setSummary(null);
    setShowForm(true);
  };

  const toggleProperty = (id: string) => {
    setForm((s) => ({
      ...s,
      property_ids: s.property_ids.includes(id)
        ? s.property_ids.filter((x) => x !== id)
        : [...s.property_ids, id],
    }));
  };

  const save = async () => {
    if (!selectedStaffId) {
      alert("対象者を選択してください。");
      return;
    }
    if (!form.record_date) {
      alert("日付を入力してください。");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/mate-cartes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          target_staff_id: selectedStaffId,
          record_date: form.record_date,
          property_ids: form.property_ids,
          property_names: selectedPropertyNames,
          cleaning_start_at: summary?.cleaning_start_at || null,
          cleaning_end_at: summary?.cleaning_end_at || null,
          guidance_category: form.guidance_category,
          good_points: form.good_points,
          correction_points: form.correction_points,
          handover_notes: form.handover_notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "保存に失敗しました。");
      setShowForm(false);
      await loadRecords(selectedStaffId);
      alert("保存しました。");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "保存に失敗しました。");
    }
  };

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 p-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[18px] font-extrabold">メイトカルテ</div>
          <div className="mt-1 text-sm text-slate-500">スタッフ別の指導履歴・引き継ぎ内容を管理</div>
        </div>
        <button
          type="button"
          disabled={!selectedStaffId}
          onClick={openAdd}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-40"
        >
          ＋追加
        </button>
      </div>

      <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[320px_1fr]">
        <div className="border-r border-slate-200 bg-slate-50/50 p-4">
          <input
            className="mb-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            placeholder="名前・コードで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loading ? <div className="text-sm text-slate-500">読み込み中...</div> : null}
            {filteredStaffs.map((staff) => (
              <button
                key={staff.id}
                type="button"
                onClick={() => setSelectedStaffId(staff.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedStaffId === staff.id
                    ? "border-slate-900 bg-white shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="font-bold">{staff.staff_name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {staff.staff_code || "-"} / {staff.role}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {selectedStaff ? (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm text-slate-500">対象者</div>
              <div className="mt-1 text-lg font-extrabold">{selectedStaff.staff_name}</div>
            </div>
          ) : null}

          {showForm ? (
            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="font-extrabold">カルテ追加</div>
                <button className="text-sm text-slate-500" onClick={() => setShowForm(false)}>
                  閉じる
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <div className="text-xs font-bold text-slate-500">日付</div>
                  <input
                    type="date"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
                    value={form.record_date}
                    onChange={(e) => setForm((s) => ({ ...s, record_date: e.target.value, property_ids: [] }))}
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs font-bold text-slate-500">指導内容</div>
                  <select
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                    value={form.guidance_category}
                    onChange={(e) => setForm((s) => ({ ...s, guidance_category: e.target.value }))}
                  >
                    {GUIDANCE_OPTIONS.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-500">清掃時間</div>
                  <div className="mt-1 text-sm font-bold">
                    {fmtTime(summary?.cleaning_start_at)} ～ {fmtTime(summary?.cleaning_end_at)}
                    <span className="ml-3 text-xs font-normal text-slate-500">
                      対象タスク {summary?.task_count ?? 0} 件
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <div className="text-xs font-bold text-slate-500">物件（複数選択）</div>
                  <div className="grid max-h-[180px] grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          form.property_ids.includes(p.id)
                            ? "border-sky-300 bg-sky-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.property_ids.includes(p.id)}
                          onChange={() => toggleProperty(p.id)}
                        />
                        <span>{p.property_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <TextArea label="良かった点" value={form.good_points} onChange={(v) => setForm((s) => ({ ...s, good_points: v }))} />
                <TextArea label="手直し" value={form.correction_points} onChange={(v) => setForm((s) => ({ ...s, correction_points: v }))} />
                <div className="md:col-span-2">
                  <TextArea label="引き継ぎ内容" value={form.handover_notes} onChange={(v) => setForm((s) => ({ ...s, handover_notes: v }))} />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold" onClick={() => setShowForm(false)}>
                  キャンセル
                </button>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white" onClick={save}>
                  保存
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-extrabold">過去カルテ</div>
              {recordLoading ? <div className="text-xs text-slate-500">読み込み中...</div> : null}
            </div>

            {records.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                カルテはまだありません。
              </div>
            ) : (
              records.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold">{fmtDate(r.record_date)} / {r.guidance_category}</div>
                      <div className="mt-1 text-xs text-slate-500">指導者：{r.instructor_name || "-"}</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {fmtTime(r.cleaning_start_at)} ～ {fmtTime(r.cleaning_end_at)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(r.property_names || []).map((name) => (
                      <span key={name} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <RecordBlock title="良かった点" text={r.good_points} />
                    <RecordBlock title="手直し" text={r.correction_points} />
                    <RecordBlock title="引き継ぎ" text={r.handover_notes} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <textarea
        className="min-h-[96px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function RecordBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs font-bold text-slate-500">{title}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm">{text || "-"}</div>
    </div>
  );
}
