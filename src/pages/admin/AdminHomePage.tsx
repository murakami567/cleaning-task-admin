import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type ShiftEntry = {
  id: string;
  start_time?: string;
  end_time?: string;
  assigned_area?: string;
  status?: string;
  staff_members?: {
    staff_name?: string;
  };
};

type ShiftDay = {
  id: string;
  shift_date: string;
  shift_entries?: ShiftEntry[];
};

type PortalMessage = {
  id: string;
  target_date: string;
  message: string;
  updated_at?: string;
};

export default function AdminHomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_access_token") || "";
  const userRaw = localStorage.getItem("admin_user");

  const [todayDate, setTodayDate] = useState("");
  const [todayMessages, setTodayMessages] = useState<PortalMessage[]>([]);
  const [todayShift, setTodayShift] = useState<ShiftDay | null>(null);
  const [calendarDays, setCalendarDays] = useState<ShiftDay[]>([]);
  const [saving, setSaving] = useState(false);

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    if (!token || !userRaw) {
      navigate("/admin/login");
      return;
    }

    void fetchHome();
    void fetchCalendar();
  }, [token, userRaw, navigate]);

  async function fetchHome() {
    const res = await fetch(`${API_BASE}/api/admin-portal/home`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_user");
      navigate("/admin/login");
      return;
    }

    const data = await res.json();
setTodayDate(data?.todayDate || "");
setTodayMessages(data?.todayMessages || []);
setTodayShift(data?.todayShift || null);
  }

  async function fetchCalendar() {
    const res = await fetch(
      `${API_BASE}/api/admin-portal/calendar?year=${year}&month=${month}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    setCalendarDays(data?.days || []);
  }

  function openMessageModal() {
  setDraftDate(todayDate || new Date().toISOString().slice(0, 10));
  setDraftMessage("");
  setMessageModalOpen(true);
}
  async function saveMessage() {
    try {
      setSaving(true);

      const res = await fetch(`${API_BASE}/api/admin-portal/today-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_date: draftDate,
          message: draftMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "保存に失敗しました。");
      }

      setMessageModalOpen(false);
      await fetchHome();
      alert("保存しました。");
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  const user = useMemo(() => {
    try {
      return userRaw ? JSON.parse(userRaw) : null;
    } catch {
      return null;
    }
  }, [userRaw]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">管理ポータル</div>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">ホーム</h1>
              <div className="mt-2 text-sm text-slate-500">
                {user?.name ? `${user.name} さんでログイン中` : "ログイン中"}
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("admin_access_token");
                localStorage.removeItem("admin_user");
                navigate("/admin/login");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ログアウト
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold text-slate-900">今日のひとこと</h2>
      <p className="mt-2 text-sm text-slate-500">
        一般画面ホームに表示されます
      </p>
    </div>

    <button
      onClick={openMessageModal}
      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      追加
    </button>
  </div>

  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
    <div className="text-sm font-semibold text-slate-800">
      {todayDate || "本日"}
    </div>

    {todayMessages.length === 0 ? (
      <div className="mt-3 text-sm text-slate-600">
        本日の連絡事項はありません。
      </div>
    ) : (
      <div className="mt-3 space-y-3">
        {todayMessages.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600 whitespace-pre-wrap"
          >
            {item.message}
          </div>
        ))}
      </div>
    )}
  </div>
</section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">本日の社内スケジュール</h2>

            <div className="mt-4 space-y-3">
              {!todayShift || !todayShift.shift_entries || todayShift.shift_entries.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  本日のシフトはありません
                </div>
              ) : (
                todayShift.shift_entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="font-bold text-slate-900">
                      {entry.staff_members?.staff_name || "-"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {entry.start_time || "-"} 〜 {entry.end_time || "-"} / {entry.assigned_area || "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">社内スケジュールカレンダー</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {calendarDays.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                データはありません
              </div>
            ) : (
              calendarDays.map((day) => (
                <div
                  key={day.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm font-bold text-slate-900">{day.shift_date}</div>
                  <div className="mt-3 space-y-2">
                    {(day.shift_entries || []).length === 0 ? (
                      <div className="text-xs text-slate-500">予定なし</div>
                    ) : (
                      (day.shift_entries || []).map((entry) => (
                        <div key={entry.id} className="rounded-xl bg-white px-3 py-2">
                          <div className="text-sm font-semibold text-slate-800">
                            {entry.staff_members?.staff_name || "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entry.start_time || "-"} 〜 {entry.end_time || "-"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {messageModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMessageModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">今日のひとこと追加</h3>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">日付</div>
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">内容</div>
                <textarea
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none"
                  placeholder="表示する内容を入力"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setMessageModalOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                onClick={saveMessage}
                disabled={saving}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
