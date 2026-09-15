import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type AuditLog = {
  id: string;
  actor_name?: string | null;
  actor_role?: string | null;
  source: string;
  action: string;
  page?: string | null;
  target_type?: string | null;
  target_name?: string | null;
  result: "success" | "failure";
  created_at: string;
};

const sourceLabels: Record<string, string> = {
  admin: "PC管理",
  mobile: "スマホ管理",
  employee: "従業員",
  master: "最高管理者",
  system: "システム",
};

export default function MasterAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [action, setAction] = useState("");

  const loadLogs = useCallback(async () => {
    const token = localStorage.getItem("admin_access_token");
    if (!token) {
      setError("ログイン情報がありません。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (source) params.set("source", source);
    if (action.trim()) params.set("action", action.trim());

    try {
      const response = await fetch(`${API_BASE}/api/master/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "監査ログを取得できませんでした。");
      }

      const data = await response.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "監査ログを取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, [source, action]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div>
        <p className="text-sm font-semibold text-slate-500">MASTER ADMIN</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">ログ監査</h1>
        <p className="mt-2 text-sm text-slate-500">各画面から記録された操作履歴を確認します。</p>
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">すべての画面</option>
            <option value="admin">PC管理</option>
            <option value="mobile">スマホ管理</option>
            <option value="employee">従業員</option>
            <option value="master">最高管理者</option>
            <option value="system">システム</option>
          </select>
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="操作名で絞り込み" className="min-w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button onClick={() => void loadLogs()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">再読込</button>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">日時</th><th className="px-4 py-3">利用者</th><th className="px-4 py-3">画面</th><th className="px-4 py-3">操作</th><th className="px-4 py-3">対象</th><th className="px-4 py-3">結果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">読み込み中...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-red-600">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">監査ログはまだありません</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="text-slate-700">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(item.created_at).toLocaleString("ja-JP")}</td>
                  <td className="whitespace-nowrap px-4 py-3"><div className="font-medium text-slate-900">{item.actor_name || "不明"}</div><div className="text-xs text-slate-400">{item.actor_role || "-"}</div></td>
                  <td className="whitespace-nowrap px-4 py-3"><div>{sourceLabels[item.source] || item.source}</div><div className="text-xs text-slate-400">{item.page || "-"}</div></td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{item.action}</td>
                  <td className="px-4 py-3"><div>{item.target_name || "-"}</div><div className="text-xs text-slate-400">{item.target_type || ""}</div></td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.result === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.result === "success" ? "成功" : "失敗"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
