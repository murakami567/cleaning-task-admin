import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("admin_access_token");
  const userRaw = localStorage.getItem("admin_user");

  if (!token || !userRaw) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);

    if (!["admin", "leader","sub_admin"].includes(user.role)) {
      return <Navigate to="/admin/login" replace />;
    }

  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
