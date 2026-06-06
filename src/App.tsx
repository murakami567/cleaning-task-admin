import { Routes, Route, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

import AdminTasksPagePreview from "./AdminTasksPagePreview";
import PropertyManagementPage from "./PropertyManagementPage";
import OpeningManagementPage from "./OpeningManagementPage";
import FacilityManagementPage from "./FacilityManagementPage";
import ShiftManagementPage from "./ShiftManagementPage";
import ShiftBoardPage from "./ShiftBoardPage";

import { AuthProvider } from "./context/AuthContext";
import EmployeeProtectedRoute from "./routes/EmployeeProtectedRoute";

import EmployeeLoginPage from "./pages/employee/EmployeeLoginPage";
import EmployeeHomePage from "./pages/employee/EmployeeHomePage";
import EmployeeTasksPage from "./pages/employee/EmployeeTasksPage";
import EmployeeSchedulePage from "./pages/employee/EmployeeSchedulePage";
import EmployeeWorklogPage from "./pages/employee/EmployeeWorklogPage";
import EmployeeSettingsPage from "./pages/employee/EmployeeSettingsPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminRoute from "./routes/AdminRoute";
import AdminWorklogReportPage from "./pages/admin/AdminWorklogReportPage";
import AdminLostItemsPage from "./pages/admin/AdminLostItemsPage";

import PayrollAttendancePage from "./pages/admin/PayrollAttendancePage";
import PayrollRoute from "./routes/PayrollRoute";


// ==========================
// タイトル管理（追加部分）
// ==========================
function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/admin")) {
      document.title = "タスク管理-グスク";
    } else if (path.startsWith("/employee")) {
      document.title = "【スタッフ】ステータス管理";
    } else if (path.startsWith("/payroll")) {
      document.title = "給与・勤怠管理";
    } else {
      document.title = "清掃管理";
    }
  }, [location]);

  return null;
}


// ==========================
// 管理レイアウト
// ==========================
function AdminLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b bg-white px-6 py-3 flex gap-2 flex-wrap">
        <AdminNavButton to="/admin/home">ホーム</AdminNavButton>
        <AdminNavButton to="/admin/tasks">タスク管理</AdminNavButton>
        <AdminNavButton to="/admin/properties">物件管理</AdminNavButton>
        <AdminNavButton to="/admin/openings">新規オープン進捗</AdminNavButton>
        <AdminNavButton to="/admin/facilities">設備管理</AdminNavButton>
        <AdminNavButton to="/admin/shifts">シフト管理</AdminNavButton>
        <AdminNavButton to="/admin/shiftboard">シフト表</AdminNavButton>
        <AdminNavButton to="/admin/worklogs">実働報告</AdminNavButton>
        <AdminNavButton to="/admin/lost-items">忘れ物</AdminNavButton>
      </div>

      <Outlet />
    </div>
  );
}

function AdminNavButton({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-xl px-4 py-2 text-sm border ${
          isActive ? "bg-black text-white" : "bg-white hover:bg-black/5"
        }`
      }
    >
      {children}
    </NavLink>
  );
}


// ==========================
// メインApp
// ==========================
export default function App() {
  return (
    <AuthProvider>

      {/* ★ タイトル制御 */}
      <TitleManager />

      <Routes>
        {/* 初期リダイレクト */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* 管理ログイン */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* 管理画面 */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/home" replace />} />
          <Route path="home" element={<AdminHomePage />} />
          <Route path="tasks" element={<AdminTasksPagePreview />} />
          <Route path="properties" element={<PropertyManagementPage />} />
          <Route path="openings" element={<OpeningManagementPage />} />
          <Route path="facilities" element={<FacilityManagementPage />} />
          <Route path="shifts" element={<ShiftManagementPage />} />
          <Route path="shiftboard" element={<ShiftBoardPage />} />
          <Route path="worklogs" element={<AdminWorklogReportPage />} />
          <Route path="lost-items" element={<AdminLostItemsPage />} />
        </Route>

        {/* 給与ページ */}
        <Route
          path="/payroll"
          element={
            <PayrollRoute>
              <PayrollAttendancePage />
            </PayrollRoute>
          }
        />

        {/* 従業員ログイン */}
        <Route path="/employee/login" element={<EmployeeLoginPage />} />

        {/* 従業員ページ */}
        <Route
          path="/employee/home"
          element={
            <EmployeeProtectedRoute>
              <EmployeeHomePage />
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/tasks"
          element={
            <EmployeeProtectedRoute>
              <EmployeeTasksPage />
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/schedule"
          element={
            <EmployeeProtectedRoute>
              <EmployeeSchedulePage />
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/worklog"
          element={
            <EmployeeProtectedRoute>
              <EmployeeWorklogPage />
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/employee/settings"
          element={
            <EmployeeProtectedRoute>
              <EmployeeSettingsPage />
            </EmployeeProtectedRoute>
          }
        />

        {/* 不正URL */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
