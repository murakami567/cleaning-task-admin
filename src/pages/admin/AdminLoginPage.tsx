import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login_id: loginId,
          password,
          role: "admin_portal",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "ログインに失敗しました。");
      }

      localStorage.setItem("admin_access_token", data.access_token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      navigate("/admin/home");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-slate-900">管理画面ログイン</h1>
        <p className="mt-2 text-sm text-slate-500">
          leader または admin のみログインできます
        </p>

        <div className="mt-5 space-y-4">
          <input
            className="h-12 w-full rounded-2xl border border-slate-200 px-4"
            placeholder="ログインID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
          <input
            type="password"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <button className="mt-5 h-12 w-full rounded-2xl bg-slate-900 text-white font-bold">
          ログイン
        </button>
      </form>
    </div>
  );
}
