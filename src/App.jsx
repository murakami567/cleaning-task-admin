import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import EmployeeLoginPage from "./pages/employee/EmployeeLoginPage";
import EmployeeHomePage from "./pages/employee/EmployeeHomePage";
import EmployeeTasksPage from "./pages/employee/EmployeeTasksPage";
import EmployeeSchedulePage from "./pages/employee/EmployeeSchedulePage";
import EmployeeWorklogPage from "./pages/employee/EmployeeWorklogPage";
import EmployeeSettingsPage from "./pages/employee/EmployeeSettingsPage";
import EmployeeProtectedRoute from "./routes/EmployeeProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/employee/login" replace />} />
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

        <Route path="*" element={<Navigate to="/employee/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
