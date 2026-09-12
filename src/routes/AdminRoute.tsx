import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { isJwtExpired } from "../lib/jwt";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem("admin_access_token");
  const userRaw = localStorage.getItem("admin_user");

  if (!token || !userRaw) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isJwtExpired(token)) {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);

    if (!["admin", "leader", "sub_admin", "operation", "payroll_admin", "prep_viewer"].includes(user.role)) {
      return <Navigate to="/admin/login" replace />;
    }

    if (user.role === "prep_viewer" && location.pathname !== "/admin/prep") {
      return <Navigate to="/admin/prep" replace />;
    }

  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
