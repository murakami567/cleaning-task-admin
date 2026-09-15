import { useNavigate } from "react-router-dom";

const items = [
  ["タスク管理", "清掃・清掃外タスク", "/mobile/tasks", "bg-orange-50 text-orange-700"],
  ["物件管理", "物件・客室マスタ", "/mobile/properties", "bg-blue-50 text-blue-700"],
  ["割当設定", "自動割当の条件", "/mobile/auto-assign-settings", "bg-violet-50 text-violet-700"],
  ["設備管理", "設備・修繕情報", "/mobile/facilities", "bg-cyan-50 text-cyan-700"],
  ["スケジュール", "勤務予定の管理", "/mobile/shifts", "bg-emerald-50 text-emerald-700"],
  ["シフト表", "日別の配置確認", "/mobile/shiftboard", "bg-lime-50 text-lime-700"],
  ["実働報告", "勤怠・実績確認", "/mobile/worklogs", "bg-amber-50 text-amber-700"],
  ["忘れ物", "拾得物の管理", "/mobile/lost-items", "bg-rose-50 text-rose-700"],
] as const;

export default function AdminMobileHomePage() {
  const navigate = useNavigate();
  let name = "管理者";
  try { name = JSON.parse(localStorage.getItem("admin_user") || "{}")?.name || name; } catch { /* noop */ }
  const today = new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return <main className="mx-auto max-w-lg px-4 py-5">
    <section className="rounded-[24px] bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/10"><div className="text-xs font-bold text-white/55">{today}</div><h2 className="mt-2 text-xl font-extrabold">お疲れさまです、{name}さん</h2><p className="mt-1 text-xs text-white/60">管理する項目を選択してください</p></section>
    <section className="mt-5 grid grid-cols-2 gap-3">{items.map(([label, detail, path, tone]) => <button key={path} type="button" onClick={() => navigate(path)} className="rounded-[22px] border border-slate-100 bg-white p-4 text-left shadow-[0_5px_18px_rgba(15,23,42,0.05)] active:scale-[0.98]"><span className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-extrabold ${tone}`}>MENU</span><span className="mt-4 block text-base font-extrabold">{label}</span><span className="mt-1 block text-[11px] text-slate-400">{detail}</span></button>)}</section>
  </main>;
}
