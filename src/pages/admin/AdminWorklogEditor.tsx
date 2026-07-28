import { useEffect, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Worklog = {
  id: string;
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

export default function AdminWorklogEditor({ selectedDate, refreshKey = 0, onChanged }: Props) {
  const [rows, setRows] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Worklog | null>(null);
  const [form, setForm] = useState<Worklog>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

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

  function openEdit(row: Worklog) {
    setEditing(row);
    setForm({ ...row, break_minutes: Number(row.break_minutes || 0) });
  }

  async function save() {
    if (!form.work_date || !form.start_time || !form.end_time) {
      alert("日付・出勤・退勤は必須です。");
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem("admin_access_token") || "";
      const res = await fetch(`${API_BASE}/api/admin-portal/worklogs/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          worklog_id: form.id,
          work_date: form.work_date,
          property_name: form.property_name,
          room_name: form.room_name,
          work_start_time: form.work_start_time,
          start_time: form.start_time,
          end_time: form.end_time,
          break_minutes: Number(form.break_minutes || 0),
          work_type: form.work_type,
          note: form.note,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditing(null);
      await loadRows();
      onChanged?.();
    } catch (error) {
      console.error("実働報告更新エラー:", error);
      alert("実働報告の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Worklog) {
    const label = `${row.staff_name || "スタッフ"} / ${row.property_name || "-"} ${row.room_name || ""}`;
    if (!window.confirm(`${label} の実働報告を削除しますか？\nこの操作は取り消せません。`)) return;
    try {
      setDeletingId(row.id);
      const token = localStorage.getItem("admin_access_token") || "";
      const res = await fetch(`${API_BASE}/api/admin-portal/worklogs/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ worklog_id: row.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadRows();
      onChanged?.();
    } catch (error) {
      console.error("実働報告削除エラー:", error);
      alert("実働報告の削除に失敗しました。");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <>
      <div className="rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <div className="text-base font-extrabold text-slate-900">個別報告の編集・削除</div>
            <div className="mt-1 text-xs text-slate-500">送信された1件ごとの内容を修正できます。</div>
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
        ) : rows.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">対象日の個別報告はありません。</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[1260px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-left">スタッフ</th>
                  <th className="px-3 py-3 text-left">物件/部屋</th>
                  <th className="px-3 py-3 text-left">作業開始</th>
                  <th className="px-3 py-3 text-left">出勤</th>
                  <th className="px-3 py-3 text-left">退勤</th>
                  <th className="px-3 py-3 text-left">休憩</th>
                  <th className="px-3 py-3 text-left">作業種別</th>
                  <th className="px-3 py-3 text-left">備考</th>
                  <th className="px-3 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-900">{row.staff_name || "-"}</div>
                      <div className="text-xs text-slate-500">{row.staff_code || ""}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{row.property_name || "-"}</div>
                      <div className="text-xs text-slate-500">{row.room_name || "-"}</div>
                    </td>
                    <td className="px-3 py-3">{row.work_start_time || "-"}</td>
                    <td className="px-3 py-3">{row.start_time || "-"}</td>
                    <td className="px-3 py-3">{row.end_time || "-"}</td>
                    <td className="px-3 py-3">{Number(row.break_minutes || 0)}分</td>
                    <td className="px-3 py-3">{workTypeLabel(row.work_type)}</td>
                    <td className="max-w-[300px] whitespace-pre-wrap px-3 py-3">{row.note || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-50"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          disabled={deletingId === row.id}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          {deletingId === row.id ? "削除中" : "削除"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setEditing(null);
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
                onClick={() => setEditing(null)}
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
              <Field label="物件名">
                <input value={form.property_name} onChange={(e) => setForm({ ...form, property_name: e.target.value })} className={inputClass} />
              </Field>
              <Field label="部屋名">
                <input value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} className={inputClass} />
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
                <Field label="備考">
                  <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={4} className={`${inputClass} h-auto resize-none py-3`} />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 p-5">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50">キャンセル</button>
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
  return map[value] || value || "-";
}
