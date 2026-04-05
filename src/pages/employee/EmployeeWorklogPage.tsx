import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">一般画面</div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">実働記入</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800">基本情報</div>

            <div className="mt-4 space-y-4">
              <Field label="作業日" required>
                <TextInput
                  type="date"
                  value={form.workDate}
                  onChange={(v: string) => updateField("workDate", v)}
                />
              </Field>

              <Field label="作業種別" required>
                <Select
                  value={form.workType}
                  onChange={(v: string) => updateField("workType", v)}
                  options={[
                    { value: "", label: "選択してください" },
                    { value: "cleaning", label: "清掃" },
                    { value: "inspection", label: "点検" },
                    { value: "linen", label: "リネン対応" },
                    { value: "support", label: "補助作業" },
                  ]}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800">作業場所</div>

            <div className="mt-4 space-y-4">
              <Field label="物件名" required>
                <TextInput
                  value={form.propertyName}
                  onChange={(v: string) => updateField("propertyName", v)}
                  placeholder="例: FFFホテル"
                />
              </Field>

              <Field label="部屋名">
                <TextInput
                  value={form.roomName}
                  onChange={(v: string) => updateField("roomName", v)}
                  placeholder="例: 1001"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800">作業時間</div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="開始" required>
                <TextInput
                  type="time"
                  value={form.startTime}
                  onChange={(v: string) => updateField("startTime", v)}
                />
              </Field>

              <Field label="終了" required>
                <TextInput
                  type="time"
                  value={form.endTime}
                  onChange={(v: string) => updateField("endTime", v)}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="休憩(分)">
                <TextInput
                  type="number"
                  value={form.breakMinutes}
                  onChange={(v: string) => updateField("breakMinutes", v)}
                  placeholder="0"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800">備考</div>

            <div className="mt-4">
              <textarea
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                rows={5}
                placeholder="作業内容や補足を入力"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none resize-none"
              />
            </div>
          </section>

          {successMessage && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
          >
            {loading ? "登録中..." : "実働を登録"}
          </button>
        </form>
      </main>

      <BottomNav />
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
      <div className="mb-2 text-xs font-semibold text-slate-500">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function BottomNav() {
  const location = useLocation();

  const items = [
    { to: "/employee/home", label: "ホーム" },
    { to: "/employee/tasks", label: "タスク" },
    { to: "/employee/schedule", label: "予定" },
    { to: "/employee/worklog", label: "実働" },
    { to: "/employee/settings", label: "設定" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-2 py-2">
        {items.map((item) => {
          const active = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
