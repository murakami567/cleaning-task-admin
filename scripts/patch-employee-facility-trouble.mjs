import fs from "node:fs";

const file = "src/pages/employee/EmployeeTasksPage.tsx";
let src = fs.readFileSync(file, "utf8");

const replaceOnce = (from, to, label) => {
  if (src.includes(to)) return;
  if (!src.includes(from)) throw new Error(`patch target not found: ${label}`);
  src = src.replace(from, to);
};

replaceOnce(
`  const [lostItemOpen, setLostItemOpen] = useState(false);`,
`  const [lostItemOpen, setLostItemOpen] = useState(false);
  const [facilityTroubleOpen, setFacilityTroubleOpen] = useState(false);`,
"facility trouble state"
);

replaceOnce(
`            {canReportLostItem ? (
              <button
                type="button"
                onClick={() => setLostItemOpen(true)}
                className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"
              >
                忘れ物報告
              </button>
            ) : null}`, 
`            {canReportLostItem ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setLostItemOpen(true)}
                  className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100"
                >
                  忘れ物報告
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityTroubleOpen(true)}
                  className="w-full rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
                >
                  設備トラブル報告
                </button>
              </div>
            ) : null}`,
"facility button"
);

replaceOnce(
`      {lostItemOpen ? (
        <LostItemModal
          task={task}
          onClose={() => setLostItemOpen(false)}
        />
      ) : null}
    </div>
  );
}`, 
`      {lostItemOpen ? (
        <LostItemModal
          task={task}
          onClose={() => setLostItemOpen(false)}
        />
      ) : null}

      {facilityTroubleOpen ? (
        <FacilityTroubleModal
          task={task}
          onClose={() => setFacilityTroubleOpen(false)}
        />
      ) : null}
    </div>
  );
}`,
"facility modal render"
);

replaceOnce(
`function LostItemModal({`,
`function FacilityTroubleModal({
  task,
  onClose,
}: {
  task: EmployeeTask;
  onClose: () => void;
}) {
  const [reportContent, setReportContent] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const taskDate = task.date || task.dueDate || "";

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setProcessingPhoto(true);
      const compressed = await compressImage(file);
      setPhotoDataUrl(compressed);
    } catch (error) {
      console.error("設備トラブル写真処理エラー:", error);
      alert("写真の読み込みに失敗しました。");
    } finally {
      setProcessingPhoto(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    if (saving) return;
    if (!reportContent.trim()) {
      alert("報告内容を入力してください。");
      return;
    }
    if (!photoDataUrl) {
      alert("写真を添付してください。");
      return;
    }
    try {
      setSaving(true);
      await api.post("/api/employee/facility-troubles", {
        task_id: task.id,
        property_name: task.propertyName || "",
        room_name: task.roomName || "",
        task_date: taskDate,
        report_content: reportContent.trim(),
        photo_url: photoDataUrl,
      });
      alert("設備トラブルを報告しました。");
      onClose();
    } catch (error) {
      console.error("設備トラブル報告エラー:", error);
      alert(error instanceof Error ? error.message : "報告の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3 py-4 sm:px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="text-xl font-bold text-slate-900">設備トラブル報告</div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-4 py-4 sm:px-5 space-y-3">
          <InfoRow label="部屋" value={String((task.propertyName || "-") + " " + (task.roomName || "")).trim()} />
          <InfoRow label="日付" value={formatDate(taskDate)} />

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">報告内容</div>
            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="例：エアコンが動かない、排水が詰まっている、照明が切れている"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none resize-none"
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">写真（必須）</div>
            {photoDataUrl ? (
              <div className="space-y-2">
                <img src={photoDataUrl} alt="設備トラブルの写真" className="w-full rounded-2xl border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl("")}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  撮り直す
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100">
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                {processingPhoto ? "読み込み中..." : "📷 撮影 / 写真を選択"}
              </label>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
              キャンセル
            </button>
            <button onClick={handleSave} disabled={saving || !reportContent.trim() || !photoDataUrl} className="flex-1 rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white hover:bg-black disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LostItemModal({`,
"FacilityTroubleModal component"
);

fs.writeFileSync(file, src);
console.log("patched employee facility trouble UI");
