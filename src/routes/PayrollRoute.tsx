import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PayrollRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-neutral-500">確認中...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const allowedRoles = ["admin", "sub_admin", "payroll_admin"];

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
