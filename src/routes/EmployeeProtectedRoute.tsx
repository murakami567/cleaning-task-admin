import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EmployeeProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white border border-slate-200 px-6 py-4 text-sm text-slate-600 shadow-sm">
          読み込み中...
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/employee/login" replace />;
  }

  return <>{children}</>;
}
