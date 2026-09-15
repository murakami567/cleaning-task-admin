import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

export default function AdminMobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = titles[location.pathname] || "管理画面";

  let userName = "管理者";
  try { userName = JSON.parse(localStorage.getItem("admin_user") || "{}")?.name || userName; } catch { /* noop */ }

  function logout() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login", { replace: true });
  }

  return <div className="min-h-[100dvh] bg-[#f4f6f8] pb-20 text-slate-900">
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(0.8rem,env(safe-area-inset-top))] backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div><div className="text-[10px] font-extrabold tracking-[0.18em] text-orange-600">GUSK TASK</div><h1 className="text-xl font-extrabold tracking-tight">{title}</h1></div>
        <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-label="メニュー"><MenuIcon className="h-5 w-5" /></button>
      </div>
    </header>

    <Outlet />

    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        <BottomLink to="/admin/mobile/home" label="ホーム" icon={HomeIcon} />
        <BottomLink to="/admin/mobile/tasks" label="タスク" icon={TasksIcon} />
        <BottomLink to="/admin/mobile/shifts" label="予定" icon={CalendarIcon} />
        <button type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold text-slate-400"><MenuIcon className="h-5 w-5" />その他</button>
      </div>
    </nav>

    {menuOpen ? <div className="fixed inset-0 z-50 bg-slate-950/40" onClick={() => setMenuOpen(false)}>
      <aside className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[30px] bg-white px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-5 flex items-center justify-between"><div><div className="text-xs font-bold text-slate-400">ログイン中</div><div className="mt-0.5 font-extrabold">{userName}</div></div><button type="button" onClick={() => setMenuOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100"><CloseIcon className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-3 gap-3">{menuItems.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border text-center text-xs font-extrabold ${isActive ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-100 bg-slate-50 text-slate-600"}`}><Icon className="h-6 w-6" />{label}</NavLink>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => navigate("/admin/home")} className="rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600">PC版を開く</button><button type="button" onClick={logout} className="rounded-xl bg-red-50 py-3 text-sm font-bold text-red-600">ログアウト</button></div>
      </aside>
    </div> : null}
  </div>;
}

function BottomLink({ to, label, icon: Icon }: { to: string; label: string; icon: IconType }) { return <NavLink to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold ${isActive ? "text-orange-600" : "text-slate-400"}`}><Icon className="h-5 w-5" />{label}</NavLink>; }
type IconProps = { className?: string }; type IconType = (props: IconProps) => JSX.Element;
const icon = (children: React.ReactNode): IconType => ({ className = "h-6 w-6" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>;
const HomeIcon = icon(<><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>); const TasksIcon = icon(<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>); const BuildingIcon = icon(<><path d="M4 21V3h11v18M15 9h5v12M8 7h3M8 11h3M8 15h3M8 19h3"/></>); const SlidersIcon = icon(<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/></>); const ToolIcon = icon(<><path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5l7.4 7.4a2 2 0 0 1-2.8 2.8l-7.4-7.4"/></>); const CalendarIcon = icon(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>); const BoardIcon = icon(<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></>); const ClockIcon = icon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>); const BoxIcon = icon(<><path d="m21 8-9 5-9-5M3 8l9-5 9 5v8l-9 5-9-5z"/></>); const MenuIcon = icon(<><path d="M4 7h16M4 12h16M4 17h16"/></>); const CloseIcon = icon(<><path d="m6 6 12 12M18 6 6 18"/></>);

const menuItems = [
  ["ホーム", "/admin/mobile/home", HomeIcon],
  ["タスク管理", "/admin/mobile/tasks", TasksIcon],
  ["物件管理", "/admin/mobile/properties", BuildingIcon],
  ["割当設定", "/admin/mobile/auto-assign-settings", SlidersIcon],
  ["設備管理", "/admin/mobile/facilities", ToolIcon],
  ["スケジュール", "/admin/mobile/shifts", CalendarIcon],
  ["シフト表", "/admin/mobile/shiftboard", BoardIcon],
  ["実働報告", "/admin/mobile/worklogs", ClockIcon],
  ["忘れ物", "/admin/mobile/lost-items", BoxIcon],
] as const;

const titles = Object.fromEntries(menuItems.map(([label, path]) => [path, label]));
