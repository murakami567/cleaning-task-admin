import { Routes, Route, Navigate } from "react-router-dom";

import AdminTasksPagePreview from "./AdminTasksPagePreview";
import PropertyManagementPage from "./PropertyManagementPage";
import OpeningManagementPage from "./OpeningManagementPage";
import FacilityManagementPage from "./FacilityManagementPage";
import ShiftManagementPage from "./ShiftManagementPage";
import ShiftBoardPage from "./ShiftBoardPage";

import EmployeeLoginPage from "./pages/employee/EmployeeLoginPage";
import EmployeeHomePage from "./pages/employee/EmployeeHomePage";

export default function App() {
  return (
    <Routes>

      {/* 管理画面 */}
      <Route path="/admin/tasks" element={<AdminTasksPagePreview />} />
      <Route path="/admin/properties" element={<PropertyManagementPage />} />
      <Route path="/admin/openings" element={<OpeningManagementPage />} />
      <Route path="/admin/facilities" element={<FacilityManagementPage />} />
      <Route path="/admin/shifts" element={<ShiftManagementPage />} />
      <Route path="/admin/shiftboard" element={<ShiftBoardPage />} />

      {/* 一般画面 */}
      <Route path="/employee/login" element={<EmployeeLoginPage />} />
      <Route path="/employee/home" element={<EmployeeHomePage />} />

      {/* デフォルト */}
      <Route path="/" element={<Navigate to="/admin/tasks" replace />} />

    </Routes>
  );
}
