import fs from "fs";

const path = "src/AdminTasksPagePreview.tsx";
let text = fs.readFileSync(path, "utf8");

function rep(from, to) {
  if (text.includes(from)) text = text.replace(from, to);
}

rep(
  `async function deleteNonCleaningTaskApi(taskId: string) {
  const res = await fetch(\`${API_BASE}/non-cleaning-tasks/delete\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId }),
  });

  if (!res.ok) throw new Error(\`delete failed: ${res.status}\`);
  return res.json();
}`,
  `async function deleteNonCleaningTaskApi(taskId: string) {
  const first = await fetch(\`${API_BASE}/non-cleaning-tasks/delete\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, id: taskId }),
  });

  if (first.ok) return first.json();

  const firstText = await first.text();

  const second = await fetch(\`${API_BASE}/non-cleaning-tasks/${encodeURIComponent(taskId)}\`, {
    method: "DELETE",
  });

  if (second.ok) return second.json();

  const secondText = await second.text();
  throw new Error(\`delete failed: POST ${first.status} / ${firstText} ; DELETE ${second.status} / ${secondText}\`);
}`
);

rep(
  `  const removeNonCleaning = async (id: string) => {
    try {
      await deleteNonCleaningTaskApi(id);
      await refresh();
    } catch (error) {
      console.error(error);
      window.alert("清掃外タスクの削除に失敗しました。");
    }
  };`,
  `  const removeNonCleaning = async (id: string) => {
    if (!window.confirm("この清掃外タスクを削除しますか？")) return;

    const before = nonCleaningTasks;
    try {
      setNonCleaningTasks((prev) => prev.filter((t) => t.id !== id));
      await deleteNonCleaningTaskApi(id);
      await refresh();
    } catch (error) {
      console.error(error);
      setNonCleaningTasks(before);
      window.alert("清掃外タスクの削除に失敗しました。APIのデプロイ状態を確認してください。");
    }
  };`
);

fs.writeFileSync(path, text);
console.log("patched non-cleaning delete handling");
