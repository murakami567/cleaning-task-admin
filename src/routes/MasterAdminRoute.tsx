import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isMasterAdmin } from "../lib/roles";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type State = "checking" | "allowed" | "login" | "admin";

export default function MasterAdminRoute({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      const userRaw = localStorage.getItem("admin_user");
      const token = localStorage.getItem("admin_access_token");
      if (!userRaw || !token) { if (!cancelled) setState("login"); return; }
      try {
        const user = JSON.parse(userRaw);
        const actualRole = user.actual_role || user.role;
        if (!isMasterAdmin(actualRole)) { if (!cancelled) setState("admin"); return; }
        const res = await fetch(`${API_BASE}/api/master/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { if (!cancelled) setState("allowed"); return; }
        if (res.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_user");
          if (!cancelled) setState("login");
          return;
        }
        if (res.status === 403) {
          try {
            const stored = JSON.parse(userRaw);
            stored.role = "admin";
            stored.actual_role = "admin";
            localStorage.setItem("admin_user", JSON.stringify(stored));
          } catch { /* ignore */ }
          if (!cancelled) setState("admin");
          return;
        }
        if (!cancelled) setState("allowed");
      } catch {
        if (!cancelled) setState("allowed");
      }
    };
    void verify();
    return () => { cancelled = true; };
  }, []);

  if (state === "checking") return <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-slate-500">最高管理者権限を確認しています...</div>;
  if (state === "login") return <Navigate to="/admin/login" replace />;
  if (state === "admin") return <Navigate to="/admin/home" replace />;
  return <>{children}</>;
}
