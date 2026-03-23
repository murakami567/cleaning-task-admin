import { useState } from "react";
import AdminTasksPagePreview from "./AdminTasksPagePreview";
import PropertyManagementPage from "./PropertyManagementPage";

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
  const [page, setPage] = useState<"tasks" | "properties">("tasks");

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ナビ */}
      <div className="border-b bg-white px-6 py-3 flex gap-2">
        <Button
          active={page === "tasks"}
          onClick={() => setPage("tasks")}
        >
          タスク管理
        </Button>

        <Button
          active={page === "properties"}
          onClick={() => setPage("properties")}
        >
          物件管理
        </Button>
      </div>

      {/* ページ */}
      {page === "tasks" ? (
        <AdminTasksPagePreview />
      ) : (
        <PropertyManagementPage />
      )}
    </div>
  );
}
