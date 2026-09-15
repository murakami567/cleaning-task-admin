import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isMasterAdmin } from "../lib/roles";

export default function MasterAdminRoute({ children }: { children: ReactNode }) {
  const userRaw = localStorage.getItem("admin_user");

  if (!userRaw) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);
    const actualRole = user.actual_role || user.role;
    if (!isMasterAdmin(actualRole)) {
      return <Navigate to="/admin/home" replace />;
    }
  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
