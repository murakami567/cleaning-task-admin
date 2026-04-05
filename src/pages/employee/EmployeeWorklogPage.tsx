import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

type WorklogForm = {
  workDate: string;
  propertyName: string;
  roomName: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  workType: string;
  note: string;
};

const initialForm: WorklogForm = {
  workDate: "",
  propertyName: "",
  roomName: "",
  startTime: "",
  endTime: "",
  breakMinutes: "0",
  workType: "",
  note: "",
};

export default function EmployeeWorklogPage() {
  const [form, setForm] = useState<WorklogForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField<K extends keyof WorklogForm>(key: K, value: WorklogForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (
      !form.workDate ||
      !form.propertyName.trim() ||
      !form.startTime ||
      !form.endTime ||
      !form.workType.trim()
    ) {
      setErrorMessage("必須項目を入力してください。");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/employee/worklogs", {
        work_date: form.workDate,
        property_name: form.propertyName,
        room_name: form.roomName,
        start_time: form.startTime,
        end_time: form.endTime,
        break_minutes: Number(form.breakMinutes || 0),
        work_type: form.workType,
        note: form.note,
      });

      setSuccessMessage("実働を登録しました。");
      setForm(initialForm);
    } catch (error) {
      console.error("実働登録エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "実働登録に失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">実働記入</h1>
            <p className="text-sm text-slate-500 mt-1">
              実際の作業時間と内容を登録します
            </p>
          </div>

          <Link
            to="/employee/home"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            ホームへ戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="作業日" required>
              <input
                type="date"
                value={form.workDate}
                onChange={(e) => updateField("workDate", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </Field>

            <Field label="作業種別" required>
              <select
                value={form.workType}
                onChange={(e) => updateField("workType", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              >
                <option value="">選択してください</option>
                <option value="cleaning">清掃</option>
                <option value="inspection">点検</option>
                <option value="linen">リネン対応</option>
                <option value="support">補助作業</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="物件名" required>
              <input
                type="text"
                value={form.propertyName}
                onChange={(e) => updateField("propertyName", e.target.value)}
                placeholder="例: FFFホテル"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </Field>

            <Field label="部屋名">
              <input
                type="text"
                value={form.roomName}
                onChange={(e) => updateField("roomName", e.target.value)}
                placeholder="例: 1001"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="開始時刻" required>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </Field>

            <Field label="終了時刻" required>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField("endTime", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </Field>

            <Field label="休憩(分)">
              <input
                type="number"
                min="0"
                value={form.breakMinutes}
                onChange={(e) => updateField("breakMinutes", e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
              />
            </Field>
          </div>

          <Field label="備考">
            <textarea
              value={form.note}
              onChange={(e) => updateField("note", e.target.value)}
              rows={5}
              placeholder="作業内容や補足を入力"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 resize-none"
            />
          </Field>

          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "登録中..." : "実働を登録"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}
