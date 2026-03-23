import { useState } from "react";
import AdminTasksPagePreview from "./AdminTasksPagePreview";
import PropertyManagementPage from "./PropertyManagementPage";
import OpeningManagementPage from "./OpeningManagementPage";
import FacilityManagementPage from "./FacilityManagementPage";
import ShiftManagementPage from "./ShiftManagementPage";

function Button({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm border ${
        active ? "bg-black text-white" : "bg-white hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [page, setPage] = useState<
    "tasks" | "properties" | "openings" | "facilities" | "shifts"
  >("tasks");

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b bg-white px-6 py-3 flex gap-2 flex-wrap">
        <Button active={page === "tasks"} onClick={() => setPage("tasks")}>
          タスク管理
        </Button>
        <Button active={page === "properties"} onClick={() => setPage("properties")}>
          物件管理
        </Button>
        <Button active={page === "openings"} onClick={() => setPage("openings")}>
          新規オープン進捗
        </Button>
        <Button active={page === "facilities"} onClick={() => setPage("facilities")}>
          設備管理
        </Button>
        <Button active={page === "shifts"} onClick={() => setPage("shifts")}>
          シフト管理
        </Button>
      </div>

      {page === "tasks" && <AdminTasksPagePreview />}
      {page === "properties" && <PropertyManagementPage />}
      {page === "openings" && <OpeningManagementPage />}
      {page === "facilities" && <FacilityManagementPage />}
      {page === "shifts" && <ShiftManagementPage />}
    </div>
  );
}
