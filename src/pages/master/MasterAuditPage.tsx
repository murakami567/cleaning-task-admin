import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type AuditData = Record<string, unknown>;
type AuditLog = {
  id: string; actor_name?: string | null; actor_role?: string | null; source: string; action: string;
  page?: string | null; target_type?: string | null; target_id?: string | null; target_name?: string | null;
  before_data?: AuditData | null; after_data?: AuditData | null; result: "success" | "failure";
  error_message?: string | null; metadata?: AuditData | null; created_at: string;
};

const sourceLabels: Record<string, string> = { admin: "PC管理", mobile: "スマホ管理", employee: "従業員", master: "最高管理者", system: "システム" };
const actionLabels: Record<string, string> = { login: "ログイン", logout: "ログアウト", staff_create: "アカウント作成", staff_update: "アカウント編集" };
const fieldLabels: Record<string, string> = {
  staff_code: "ログインID", staff_name: "氏名", role: "権限", is_active: "有効状態", sort_order: "表示順",
  note: "備考", area: "エリア", daily_capacity_point: "1日上限ポイント", solo_enabled: "単独対応", shared_enabled: "分業対応",
  lineworks_channel_id: "LINE WORKSチャンネル", available_property_ids: "対応可能物件", unchecked_property_ids: "優先物件",
};
const hiddenFields = new Set(["id", "created_at", "updated_at", "password"]);

function displayValue(value: unknown) {
  if (value === true) return "有効 / ON";
  if (value === false) return "無効 / OFF";
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function changedFields(item: AuditLog) {
  const before = item.before_data || {};
  const after = item.after_data || {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  return keys.filter((key) => !hiddenFields.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]));
}

export default function MasterAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [action, setAction] = useState("");
  const selectedChanges = useMemo(() => selected ? changedFields(selected) : [], [selected]);

  const loadLogs = useCallback(async () => {
    const token = localStorage.getItem("admin_access_token");
    if (!token) { setError("ログイン情報がありません。"); setLoading(false); return; }
    setLoading(true); setError("");
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (source) params.set("source", source);
    if (action.trim()) params.set("action", action.trim());
    try {
      const response = await fetch(`${API_BASE}/api/master/audit-logs?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.detail || "監査ログを取得できませんでした。"); }
      const data = await response.json(); setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) { setError(e instanceof Error ? e.message : "監査ログを取得できませんでした。"); }
    finally { setLoading(false); }
  }, [source, action]);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div><p className="text-sm font-semibold text-slate-500">MASTER ADMIN</p><h1 className="mt-1 text-3xl font-bold text-slate-900">ログ監査</h1><p className="mt-2 text-sm text-slate-500">各画面から記録された操作履歴を確認します。</p></div>
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-3">
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">すべての画面</option><option value="admin">PC管理</option><option value="mobile">スマホ管理</option><option value="employee">従業員</option><option value="master">最高管理者</option><option value="system">システム</option></select>
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="操作名で絞り込み" className="min-w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <button onClick={() => void loadLogs()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">再読込</button>
      </div></section>
      <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-bold text-slate-500"><tr><th className="px-4 py-3">日時</th><th className="px-4 py-3">利用者</th><th className="px-4 py-3">画面</th><th className="px-4 py-3">操作</th><th className="px-4 py-3">対象</th><th className="px-4 py-3">結果</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">読み込み中...</td></tr> : error ? <tr><td colSpan={6} className="px-4 py-12 text-center text-red-600">{error}</td></tr> : items.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">監査ログはまだありません</td></tr> : items.map((item) => (
            <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer text-slate-700 hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3">{new Date(item.created_at).toLocaleString("ja-JP")}</td>
              <td className="whitespace-nowrap px-4 py-3"><div className="font-medium text-slate-900">{item.actor_name || "不明"}</div><div className="text-xs text-slate-400">{item.actor_role || "-"}</div></td>
              <td className="whitespace-nowrap px-4 py-3"><div>{sourceLabels[item.source] || item.source}</div><div className="text-xs text-slate-400">{item.page || "-"}</div></td>
              <td className="whitespace-nowrap px-4 py-3 font-medium">{actionLabels[item.action] || item.action}</td>
              <td className="px-4 py-3"><div>{item.target_name || "-"}</div><div className="text-xs text-slate-400">{item.target_type || ""}</div></td>
              <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.result === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.result === "success" ? "成功" : "失敗"}</span></td>
            </tr>
          ))}
        </tbody>
      </table></div></section>

      {selected ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setSelected(null)}>
        <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-slate-400">監査ログ詳細</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{actionLabels[selected.action] || selected.action}</h2></div><button onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">閉じる</button></div>
          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div><span className="text-slate-400">日時</span><div className="font-semibold">{new Date(selected.created_at).toLocaleString("ja-JP")}</div></div>
            <div><span className="text-slate-400">利用者</span><div className="font-semibold">{selected.actor_name || "不明"} <span className="font-normal text-slate-400">({selected.actor_role || "-"})</span></div></div>
            <div><span className="text-slate-400">画面</span><div className="font-semibold">{sourceLabels[selected.source] || selected.source} / {selected.page || "-"}</div></div>
            <div><span className="text-slate-400">対象</span><div className="font-semibold">{selected.target_name || "-"}</div></div>
          </div>
          {selectedChanges.length > 0 ? <div className="mt-6"><h3 className="text-sm font-bold text-slate-900">変更内容</h3><div className="mt-3 overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-3">項目</th><th className="px-4 py-3">変更前</th><th className="px-4 py-3">変更後</th></tr></thead><tbody className="divide-y divide-slate-100">{selectedChanges.map((key) => <tr key={key}><td className="px-4 py-3 font-semibold">{fieldLabels[key] || key}</td><td className="px-4 py-3 text-slate-500">{displayValue(selected.before_data?.[key])}</td><td className="px-4 py-3 text-slate-900">{displayValue(selected.after_data?.[key])}</td></tr>)}</tbody></table></div></div> : <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">この操作には変更前・変更後の差分はありません。</div>}
          {selected.error_message ? <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><div className="font-bold">エラー内容</div><div className="mt-1">{selected.error_message}</div></div> : null}
        </div>
      </div> : null}
    </main>
  );
}
