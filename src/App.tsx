import { Routes, Route, Navigate } from "react-router-dom";

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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/tasks" replace />} />

        <Route path="/admin/tasks" element={<AdminTasksPagePreview />} />
        <Route path="/admin/properties" element={<PropertyManagementPage />} />
        <Route path="/admin/openings" element={<OpeningManagementPage />} />
        <Route path="/admin/facilities" element={<FacilityManagementPage />} />
        <Route path="/admin/shifts" element={<ShiftManagementPage />} />
        <Route path="/admin/shiftboard" element={<ShiftBoardPage />} />

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

        <Route path="*" element={<Navigate to="/admin/tasks" replace />} />
      </Routes>
    </AuthProvider>
  );
}
