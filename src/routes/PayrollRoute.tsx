import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PayrollRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  console.log("PAYROLL USER:", user);

  if (loading) {
    return <div>確認中...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const role = String((user as any).role || "").toLowerCase();

  const allowed = [
    "admin",
    "sub_admin",
    "payroll_admin",
    "管理者",
    "副管理者",
    "勤怠管理者",
  ];

  if (allowed.includes(role) || role.includes("admin")) {
    return <>{children}</>;
  }

  return <Navigate to="/admin/home" replace />;
}
