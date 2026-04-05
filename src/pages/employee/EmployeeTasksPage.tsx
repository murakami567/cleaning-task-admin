import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Task = {
  id: string;
  propertyName: string;
  roomName: string;
  title: string;
  status: string;
  startTime?: string;
  endTime?: string;
  note?: string;
};

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await api.get("/api/employee/tasks");
      setTasks(res.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    if (!selectedTask) return;

    try {
      await api.put(`/api/tasks/${selectedTask.id}/status`, {
        status,
      });

      fetchTasks();
      setSelectedTask(null);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="p-4 space-y-3">

      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => setSelectedTask(task)}
          className="bg-white border rounded-2xl p-4 shadow cursor-pointer hover:bg-gray-50"
        >
          <div className="text-sm text-gray-500">
            {task.propertyName}
          </div>

          <div className="font-bold text-lg">
            {task.roomName}
          </div>

          <div className="text-sm">
            {task.title}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {task.startTime} - {task.endTime}
          </div>

          <div className="mt-2 text-xs">
            ステータス：{task.status}
          </div>
        </div>
      ))}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}

function TaskModal({
  task,
  onClose,
  onUpdateStatus,
}: {
  task: Task;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">

      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4">

        <div className="text-lg font-bold">
          {task.propertyName} {task.roomName}
        </div>

        <div className="text-sm text-gray-600">
          {task.title}
        </div>

        <div className="text-sm">
          {task.startTime} - {task.endTime}
        </div>

        {task.note && (
          <div className="bg-gray-100 p-3 rounded-xl text-sm">
            {task.note}
          </div>
        )}

        <div className="flex gap-2">

          <button
            onClick={() => onUpdateStatus("in_progress")}
            className="flex-1 bg-yellow-400 py-3 rounded-xl text-sm font-bold"
          >
            作業中
          </button>

          <button
            onClick={() => onUpdateStatus("completed")}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-bold"
          >
            完了
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full border py-3 rounded-xl text-sm"
        >
          閉じる
        </button>

      </div>
    </div>
  );
}
