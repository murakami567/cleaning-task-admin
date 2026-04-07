import { Routes, Route, Navigate, NavLink, Outlet } from "react-router-dom";

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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />

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
        </Route>

        <Route path="/employee/login" element={<EmployeeLoginPage />} />

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

        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
