import { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Worklog = {
  id: string;
  user_id?: string;
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
  work_minutes: number;
  created_at?: string;
};

type WorklogReport = {
  key: string;
  rows: Worklog[];
  representative: Worklog;
  places: { property_name: string; room_name: string }[];
  lastCreatedAtMs: number;
};

type Props = {
  selectedDate: string;
  refreshKey?: number;
  onChanged?: () => void;
};

const emptyForm: Worklog = {
  id: "",
  staff_name: "",
  staff_code: "",
  work_date: "",
  property_name: "",
  room_name: "",
  work_start_time: "",
  start_time: "",
  end_time: "",
  break_minutes: 0,
  work_type: "cleaning",
  note: "",
  work_minutes: 0,
};

function reportSignature(row: Worklog) {
  return [
    row.user_id || row.staff_code || row.staff_name,
    row.work_date,
    row.work_start_time,
    row.start_time,
    row.end_time,
    Number(row.break_minutes || 0),
    row.work_type || "",
    row.note || "",
  ].join("||");
}

function createdAtMs(row: Worklog) {
  const ms = row.created_at ? new Date(row.created_at).getTime() : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function uniquePlaces(rows: Worklog[]) {
  const map = new Map<string, { property_name: string; room_name: string }>();
  rows.forEach((row) => {
    const key = `${row.property_name || ""}||${row.room_name || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        property_name: row.property_name || "",
        room_name: row.room_name || "",
      });
    }
  });
  return Array.from(map.values());
}

export default function AdminWorklogEditor({ selectedDate, refreshKey = 0, onChanged }: Props) {
  const [rows, setRows] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingReport, setEditingReport] = useState<WorklogReport | null>(null);
  const [form, setForm] = useState<Worklog>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");
  const [expandedKey, setExpandedKey] = useState("");

  async function loadRows() {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_access_token") || "";
      const url = new URL(`${API_BASE}/api/admin-portal/worklogs/today`);
      url.searchParams.set("date", selectedDate);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows(Array.isArray(data?.worklogs) ? data.worklogs : []);
    } catch (error) {
      console.error("実働報告個別一覧取得エラー:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [selectedDate, refreshKey]);

  const reports = useMemo<WorklogReport[]>(() => {
    const sorted = [...rows].sort((a, b) => createdAtMs(a) - createdAtMs(b));
    const groups: WorklogReport[] = [];

    for (const row of sorted) {
      const signature = reportSignature(row);
      const currentMs = createdAtMs(row);

      const existing = [...groups]
        .reverse()
        .find((group) => {
          if (reportSignature(group.representative) !== signature) return false;
          if (!currentMs || !group.lastCreatedAtMs) return true;
          return currentMs - group.lastCreatedAtMs <= 120_000;
        });

      if (existing) {
        existing.rows.push(row);
        existing.places = uniquePlaces(existing.rows);
        existing.lastCreatedAtMs = Math.max(existing.lastCreatedAtMs, currentMs);
        continue;
      }

      groups.push({
        key: `${signature}||${row.id}`,
        rows: [row],
        representative: row,
        places: uniquePlaces([row]),
        lastCreatedAtMs: currentMs,
      });
    }

    return groups.sort((a, b) => {
      const timeDiff = createdAtMs(b.representative) - createdAtMs(a.representative);
      if (timeDiff !== 0) return timeDiff;
      return String(a.representative.staff_name || "").localeCompare(
        String(b.representative.staff_name || ""),
        "ja"
      );
    });
  }, [rows]);

  function openEdit(report: WorklogReport) {
    const row = report.representative;
    setEditingReport(report);
    setForm({ ...row, break_minutes: Number(row.break_minutes || 0) });
  }

  async function updateOne(row: Worklog, token: string) {
    const res = await fetch(`${API_BASE}/api/admin-portal/worklogs/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        worklog_id: row.id,
        work_date: form.work_date,
        property_name: row.property_name,
        room_name: row.room_name,
        work_start_time: form.work_start_time,
        start_time: form.start_time,
        end_time: form.end_time,
        break_minutes: Number(form.break_minutes || 0),
        work_type: form.work_type,
        note: form.note,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function save() {
    if (!editingReport) return;
    if (!form.work_date || !form.start_time || !form.end_time) {
      alert("日付・出勤・退勤は必須です。");
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_access_token") || "";
      for (const row of editingReport.rows) {
        await updateOne(row, token);
      }
      setEditingReport(null);
      await loadRows();
      onChanged?.();
    } catch (error) {
      console.error("実働報告更新エラー:", error);
      alert("実働報告の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function remove(report: WorklogReport) {
    const row = report.representative;
    const label = `${row.staff_name || "スタッフ"} / ${report.places.length}部屋`;
    if (!window.confirm(`${label} の実働報告を削除しますか？\nこの報告に含まれる全ての部屋が削除されます。\nこの操作は取り消せません。`)) return;

    try {
      setDeletingKey(report.key);
      const token = localStorage.getItem("admin_access_token") || "";
      for (const target of report.rows) {
        const res = await fetch(`${API_BASE}/api/admin-portal/worklogs/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ worklog_id: target.id }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      if (expandedKey === report.key) setExpandedKey("");
      await loadRows();
      onChanged?.();
    } catch (error) {
      console.error("実働報告削除エラー:", error);
      alert("実働報告の削除に失敗しました。");
    } finally {
      setDeletingKey("");
    }
  }

  return (
    <>
      <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <div className="text-base font-extrabold text-slate-900">実働報告の編集・削除</div>
            <div className="mt-1 text-xs text-slate-500">
              1回の送信を1行にまとめています。行をタップすると担当した物件・部屋を確認できます。
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadRows()}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50"
          >
            更新
          </button>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-slate-500">読み込み中...</div>
        ) : reports.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">対象日の実働報告はありません。</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-left">スタッフ</th>
                  <th className="px-3 py-3 text-left">作業開始</th>
                  <th className="px-3 py-3 text-left">出勤</th>
                  <th className="px-3 py-3 text-left">退勤</th>
                  <th className="px-3 py-3 text-left">休憩</th>
                  <th className="px-3 py-3 text-left">作業種別</th>
                  <th className="px-3 py-3 text-left">備考</th>
                  <th className="px-3 py-3 text-left">担当</th>
                  <th className="px-3 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const row = report.representative;
                  const expanded = expandedKey === report.key;
                  return (
                    <>
                      <tr
                        key={report.key}
                        onClick={() => setExpandedKey(expanded ? "" : report.key)}
                        className="cursor-pointer border-t border-slate-100 bg-white hover:bg-slate-50"
                      >
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900">{row.staff_name || "-"}</div>
                          <div className="text-xs text-slate-500">{row.staff_code || ""}</div>
                        </td>
                        <td className="px-3 py-3">{row.work_start_time || "-"}</td>
                        <td className="px-3 py-3">{row.start_time || "-"}</td>
                        <td className="px-3 py-3">{row.end_time || "-"}</td>
                        <td className="px-3 py-3">{Number(row.break_minutes || 0)}分</td>
                        <td className="px-3 py-3">{workTypeLabel(row.work_type)}</td>
                        <td className="max-w-[280px] whitespace-pre-wrap px-3 py-3">{row.note || "-"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 font-semibold text-slate-800">
                            <span>{report.places.length}部屋</span>
                            <span className="text-xs text-slate-400">{expanded ? "▲" : "▼"}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {new Set(report.places.map((p) => p.property_name).filter(Boolean)).size}物件
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openEdit(report)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50"
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(report)}
                              disabled={deletingKey === report.key}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              {deletingKey === report.key ? "削除中" : "削除"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr key={`${report.key}-detail`} className="border-t border-slate-100 bg-slate-50/80">
                          <td colSpan={9} className="px-5 py-4">
                            <div className="text-xs font-bold text-slate-500">担当した物件・部屋</div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {report.places.map((place, index) => (
                                <div
                                  key={`${place.property_name}-${place.room_name}-${index}`}
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                                >
                                  <div className="text-sm font-bold text-slate-900">{place.property_name || "-"}</div>
                                  <div className="mt-1 text-sm text-slate-500">{place.room_name || "-"}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingReport ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setEditingReport(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xl font-extrabold text-slate-900">実働報告を編集</div>
                <div className="mt-1 text-xs text-slate-500">
                  {form.staff_name || "-"} {form.staff_code ? `（${form.staff_code}）` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                disabled={saving}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
              <Field label="日付">
                <input type="date" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} className={inputClass} />
              </Field>
              <Field label="作業種別">
                <select value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })} className={inputClass}>
                  <option value="cleaning">清掃</option>
                  <option value="inspection">インスペクション</option>
                  <option value="linen">リネン</option>
                  <option value="support">補助作業</option>
                </select>
              </Field>
              <Field label="作業開始">
                <input type="time" value={form.work_start_time} onChange={(e) => setForm({ ...form, work_start_time: e.target.value })} className={inputClass} />
              </Field>
              <Field label="出勤">
                <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputClass} />
              </Field>
              <Field label="退勤">
                <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputClass} />
              </Field>
              <Field label="休憩（分）">
                <input type="number" min={0} value={form.break_minutes} onChange={(e) => setForm({ ...form, break_minutes: Number(e.target.value || 0) })} className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="担当した物件・部屋">
                  <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                    {editingReport.places.map((place, index) => (
                      <div key={`${place.property_name}-${place.room_name}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm">
                        <span className="font-bold text-slate-900">{place.property_name || "-"}</span>
                        <span className="ml-2 text-slate-500">{place.room_name || "-"}</span>
                      </div>
                    ))}
                  </div>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="備考">
                  <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} className={`${inputClass} h-auto resize-none py-3`} />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-5">
              <button type="button" onClick={() => setEditingReport(null)} disabled={saving} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50">キャンセル</button>
              <button type="button" onClick={() => void save()} disabled={saving} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-bold text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function workTypeLabel(value: string) {
  const map: Record<string, string> = {
    cleaning: "清掃",
    inspection: "インスペクション",
    linen: "リネン",
    support: "補助作業",
  };
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => map[item] || item)
    .join(" / ") || "-";
}
