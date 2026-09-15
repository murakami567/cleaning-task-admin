import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type Account = { id: string; staff_code?: string | null; staff_name?: string | null; role?: string | null; is_active?: boolean | null; sort_order?: number | null; created_at?: string | null; updated_at?: string | null };
type Summary = { total: number; active: number; inactive: number; roles: Record<string, number> };

const roleLabels: Record<string, string> = {
  master_admin: "最高管理者", admin: "管理者", sub_admin: "副管理者", leader: "リーダー", operation: "運営", staff: "スタッフ",
  contractor: "業務委託", payroll_admin: "給与管理者", prep_viewer: "準備閲覧",
};

export default function MasterAccountsAuditPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Account[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, inactive: 0, roles: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("admin_access_token");
    if (!token) { setError("ログイン情報がありません。"); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/master/accounts`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.detail || "取得できませんでした。"); }
      const data = await res.json(); setItems(data.items || []); setSummary(data.summary || { total: 0, active: 0, inactive: 0, roles: {} });
    } catch (e) { setError(e instanceof Error ? e.message : "取得できませんでした。"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const roles = useMemo(() => Array.from(new Set(items.map((x) => x.role || "unknown"))).sort(), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (q && !`${item.staff_code || ""} ${item.staff_name || ""}`.toLowerCase().includes(q)) return false;
    if (role && item.role !== role) return false;
    if (status === "active" && item.is_active !== true) return false;
    if (status === "inactive" && item.is_active === true) return false;
    return true;
  }), [items, query, role, status]);

  const privileged = (summary.roles.master_admin || 0) + (summary.roles.admin || 0) + (summary.roles.sub_admin || 0);

  return <main className="mx-auto max-w-7xl px-6 py-8">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500">MASTER ADMIN</p><h1 className="mt-1 text-3xl font-bold text-slate-900">アカウント・権限監査</h1><p className="mt-2 text-sm text-slate-500">全アカウントの利用状態と現在の権限を確認します。</p></div><button onClick={() => navigate("/master")} className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">← 最高管理者画面へ戻る</button></div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[['総アカウント', summary.total], ['有効', summary.active], ['無効', summary.inactive], ['管理権限', privileged]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-bold text-slate-400">{label}</div><div className="mt-2 text-3xl font-bold text-slate-900">{value}</div></div>)}
    </div>

    <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-3">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="氏名・ログインIDで検索" className="min-w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">すべての権限</option>{roles.map((r) => <option key={r} value={r}>{roleLabels[r] || r}</option>)}</select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">すべての状態</option><option value="active">有効</option><option value="inactive">無効</option></select>
      <button onClick={() => void load()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">再読込</button>
    </div></section>

    <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold text-slate-500"><tr><th className="px-4 py-3">ログインID</th><th className="px-4 py-3">氏名</th><th className="px-4 py-3">権限</th><th className="px-4 py-3">状態</th><th className="px-4 py-3">最終更新</th></tr></thead><tbody className="divide-y divide-slate-100">
      {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">読み込み中...</td></tr> : error ? <tr><td colSpan={5} className="px-4 py-12 text-center text-red-600">{error}</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">該当するアカウントはありません</td></tr> : filtered.map((item) => <tr key={item.id} className="text-slate-700 hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs">{item.staff_code || "-"}</td><td className="px-4 py-3 font-semibold text-slate-900">{item.staff_name || "-"}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.role === "master_admin" ? "bg-slate-900 text-white" : item.role === "admin" || item.role === "sub_admin" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{roleLabels[item.role || ""] || item.role || "-"}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.is_active ? "有効" : "無効"}</span></td><td className="whitespace-nowrap px-4 py-3 text-slate-500">{item.updated_at ? new Date(item.updated_at).toLocaleString("ja-JP") : "-"}</td></tr>)}
    </tbody></table></div></section>
  </main>;
}
