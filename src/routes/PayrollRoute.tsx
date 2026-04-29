import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

export default function PayrollRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("admin_access_token");
  const userRaw = localStorage.getItem("admin_user");

  if (!token || !userRaw) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);

    const allowedRoles = [
      "admin",
      "leader",
      "sub_admin",
      "payroll_admin",
    ];

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/admin/login" replace />;
    }
  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
