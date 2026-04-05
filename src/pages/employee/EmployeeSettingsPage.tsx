import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeSettingsPage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("すべての項目を入力してください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("新しいパスワード確認が一致しません。");
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage("新しいパスワードは4文字以上で入力してください。");
      return;
    }

    try {
      setLoading(true);

      await api.put("/api/employee/settings/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccessMessage("パスワードを変更しました。");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("パスワード変更エラー:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "パスワード変更に失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 pt-5 pb-4">
          <div>
            <div className="text-xs font-medium text-slate-500">一般画面</div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">設定</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pt-4 space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800">アカウント情報</div>

          <div className="mt-4 space-y-3">
            <InfoRow label="名前" value={user?.name || "-"} />
            <InfoRow label="ログインID" value={user?.login_id || "-"} />
            <InfoRow label="権限" value={user?.role || "-"} />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-800">パスワード変更</div>

            <div className="mt-4 space-y-4">
              <Field label="現在のパスワード" required>
                <TextInput
                  type="password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="現在のパスワード"
                />
              </Field>

              <Field label="新しいパスワード" required>
                <TextInput
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="新しいパスワード"
                />
              </Field>

              <Field label="新しいパスワード確認" required>
                <TextInput
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="もう一度入力"
                />
              </Field>
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
            {loading ? "変更中..." : "パスワードを変更"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
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
