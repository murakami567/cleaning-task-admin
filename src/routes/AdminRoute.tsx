import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { isJwtExpired } from "../lib/jwt";
import { canAccessAdminPortal } from "../lib/roles";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const loginPath = location.pathname.startsWith("/mobile")
    ? "/mobile/login"
    : "/admin/login";
  const token = localStorage.getItem("admin_access_token");
  const userRaw = localStorage.getItem("admin_user");

  if (!token || !userRaw) {
    return <Navigate to={loginPath} replace />;
  }

  if (isJwtExpired(token)) {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    return <Navigate to={loginPath} replace />;
  }

  try {
    const user = JSON.parse(userRaw);

    if (!canAccessAdminPortal(user.role)) {
      return <Navigate to={loginPath} replace />;
    }

    if (user.role === "prep_viewer" && location.pathname !== "/admin/prep") {
      return <Navigate to="/admin/prep" replace />;
    }
  } catch {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
