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

type Staff = {
  id: string;
  staff_name: string;
  staff_code?: string;
  role?: string;
};

type PortalSchedule = {
  id: string;
  start_date: string;
  end_date: string;
  assignee_ids: string[];
  assignee_names: string[];
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

type ScheduleDraft = {
  id?: string;
  start_date: string;
  end_date: string;
  assignee_ids: string[];
  assignee_names: string[];
  title: string;
  description: string;
};

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateString(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatMd(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay();
  const lastDate = new Date(year, month, 0).getDate();

  const cells: Array<{ date: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month - 1, 1 - (startWeekday - i));
    cells.push({
      date: toDateString(d),
      day: d.getDate(),
      inMonth: false,
    });
  }

  for (let day = 1; day <= lastDate; day++) {
    const d = new Date(year, month - 1, day);
    cells.push({
      date: toDateString(d),
      day,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const offset = cells.length - (startWeekday + lastDate) + 1;
    const d = new Date(year, month, offset);
    cells.push({
      date: toDateString(d),
      day: d.getDate(),
      inMonth: false,
    });
  }

  return cells;
}

function isDateInRange(target: string, start: string, end: string) {
  return target >= start && target <= end;
}

function normalizeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export default function AdminHomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_access_token") || "";
  const userRaw = localStorage.getItem("admin_user");

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const [todayDate, setTodayDate] = useState("");
  const [todayMessages, setTodayMessages] = useState<PortalMessage[]>([]);
  const [todayShift, setTodayShift] = useState<ShiftDay | null>(null);

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<PortalSchedule[]>([]);

  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [savingMessage, setSavingMessage] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState(false);

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleEditMode, setScheduleEditMode] = useState<"create" | "edit">("create");
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>({
    start_date: "",
    end_date: "",
    assignee_ids: [],
    assignee_names: [],
    title: "",
    description: "",
  });

  const user = useMemo(() => {
    try {
      return userRaw ? JSON.parse(userRaw) : null;
    } catch {
      return null;
    }
  }, [userRaw]);

  const calendarCells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  useEffect(() => {
    if (!token || !userRaw) {
      navigate("/admin/login");
      return;
    }

    void fetchHome();
    void fetchStaffs();
  }, [token, userRaw, navigate]);

  useEffect(() => {
    if (!token) return;
    void fetchSchedules();
  }, [token, viewYear, viewMonth]);

  async function authorizedFetch(input: string, init?: RequestInit) {
    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_user");
      navigate("/admin/login");
      throw new Error("認証期限が切れました。");
    }

    return res;
  }

  async function fetchHome() {
    try {
      setLoadingHome(true);

      const res = await authorizedFetch(`${API_BASE}/api/admin-portal/home`);
      const data = await res.json();

      setTodayDate(data?.todayDate || "");
      setTodayMessages(data?.todayMessages || []);
      setTodayShift(data?.todayShift || null);
    } finally {
      setLoadingHome(false);
    }
  }

  async function fetchStaffs() {
    const res = await authorizedFetch(`${API_BASE}/staffs`);
    const data = await res.json();
    setStaffs(Array.isArray(data) ? data : []);
  }

  async function fetchSchedules() {
    try {
      setLoadingCalendar(true);

      const res = await authorizedFetch(
        `${API_BASE}/api/admin-portal/calendar-schedules?year=${viewYear}&month=${viewMonth}`
      );
      const data = await res.json();

      const normalized = Array.isArray(data?.schedules)
        ? data.schedules.map((item: any) => ({
            id: String(item.id),
            start_date: item.start_date,
            end_date: item.end_date,
            assignee_ids: normalizeArray(item.assignee_ids),
            assignee_names: normalizeArray(item.assignee_names),
            title: item.title || "",
            description: item.description || "",
            created_at: item.created_at,
            updated_at: item.updated_at,
          }))
        : [];

      setSchedules(normalized);
    } finally {
      setLoadingCalendar(false);
    }
  }

  function openMessageModal() {
    setDraftDate(todayDate || toDateString(new Date()));
    setDraftMessage("");
    setMessageModalOpen(true);
  }

  async function saveMessage() {
    try {
      setSavingMessage(true);

      const res = await authorizedFetch(`${API_BASE}/api/admin-portal/today-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      setSavingMessage(false);
    }
  }

  function openCreateScheduleModal(dateStr?: string) {
    const base = dateStr || toDateString(new Date());

    setScheduleEditMode("create");
    setScheduleDraft({
      start_date: base,
      end_date: base,
      assignee_ids: [],
      assignee_names: [],
      title: "",
      description: "",
    });
    setScheduleModalOpen(true);
  }

  function openEditScheduleModal(item: PortalSchedule) {
    setScheduleEditMode("edit");
    setScheduleDraft({
      id: item.id,
      start_date: item.start_date,
      end_date: item.end_date,
      assignee_ids: [...item.assignee_ids],
      assignee_names: [...item.assignee_names],
      title: item.title,
      description: item.description,
    });
    setScheduleModalOpen(true);
  }

  function toggleDraftAssignee(staff: Staff) {
    setScheduleDraft((prev) => {
      const exists = prev.assignee_ids.includes(staff.id);

      if (exists) {
        const nextIds = prev.assignee_ids.filter((id) => id !== staff.id);
        const nextNames = prev.assignee_names.filter((name) => name !== staff.staff_name);
        return {
          ...prev,
          assignee_ids: nextIds,
          assignee_names: nextNames,
        };
      }

      return {
        ...prev,
        assignee_ids: [...prev.assignee_ids, staff.id],
        assignee_names: [...prev.assignee_names, staff.staff_name],
      };
    });
  }

  async function saveSchedule() {
    try {
      setSavingSchedule(true);

      if (!scheduleDraft.start_date) {
        throw new Error("開始日は必須です。");
      }
      if (!scheduleDraft.end_date) {
        throw new Error("終了日は必須です。");
      }
      if (scheduleDraft.end_date < scheduleDraft.start_date) {
        throw new Error("終了日は開始日以降にしてください。");
      }
      if (!scheduleDraft.title.trim()) {
        throw new Error("タイトルは必須です。");
      }

      const body = JSON.stringify({
        start_date: scheduleDraft.start_date,
        end_date: scheduleDraft.end_date,
        assignee_ids: scheduleDraft.assignee_ids,
        assignee_names: scheduleDraft.assignee_names,
        title: scheduleDraft.title,
        description: scheduleDraft.description,
      });

      let res: Response;
      if (scheduleEditMode === "edit" && scheduleDraft.id) {
        res = await authorizedFetch(
          `${API_BASE}/api/admin-portal/calendar-schedules/${scheduleDraft.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          }
        );
      } else {
        res = await authorizedFetch(`${API_BASE}/api/admin-portal/calendar-schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "保存に失敗しました。");
      }

      setScheduleModalOpen(false);
      await fetchSchedules();
      alert(scheduleEditMode === "edit" ? "更新しました。" : "追加しました。");
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存に失敗しました。");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function deleteSchedule() {
    if (!scheduleDraft.id) return;
    if (!window.confirm("このスケジュールを削除しますか？")) return;

    try {
      setDeletingSchedule(true);

      const res = await authorizedFetch(
        `${API_BASE}/api/admin-portal/calendar-schedules/${scheduleDraft.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "削除に失敗しました。");
      }

      setScheduleModalOpen(false);
      await fetchSchedules();
      alert("削除しました。");
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました。");
    } finally {
      setDeletingSchedule(false);
    }
  }

  function prevMonth() {
    setViewMonth((prev) => {
      if (prev === 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }

  function nextMonth() {
    setViewMonth((prev) => {
      if (prev === 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }

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

        {/* ポータルリンク */}
<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 育成課 */}
  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
    <div className="text-lg font-bold">育成課ポータル</div>
    <div className="mt-2 text-sm">スタッフ育成・チェック管理</div>
    <div className="mt-4 text-sm font-semibold">準備中</div>
  </div>

  {/* 施設課 */}
  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
    <div className="text-lg font-bold">施設課ポータル</div>
    <div className="mt-2 text-sm">設備・修繕管理</div>
    <div className="mt-4 text-sm font-semibold">準備中</div>
  </div>

  {/* OP */}
  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
    <div className="text-lg font-bold">OPポータル</div>
    <div className="mt-2 text-sm">運営管理・確認業務</div>
    <div className="mt-4 text-sm font-semibold">準備中</div>
  </div>

  {/* 給与・勤怠 */}
  <div
  onClick={() => {
    window.location.href = "https://cleaning-task-admin.onrender.com/payroll";
  }}
  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition"
>
  <div className="text-lg font-bold text-slate-900">給与・勤怠</div>
  <div className="mt-2 text-sm text-slate-500">勤怠確認・給与計算</div>
  <div className="mt-4 text-sm font-semibold text-blue-600">ページを開く →</div>
</div>
</section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">連絡事項</h2>
                <p className="mt-2 text-sm text-slate-500">一般画面ホームに表示されます</p>
              </div>

              <button
                onClick={openMessageModal}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                追加
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
              <div className="text-sm font-semibold text-slate-800">{todayDate || "本日"}</div>

              {loadingHome ? (
                <div className="mt-3 text-sm text-slate-500">読み込み中...</div>
              ) : todayMessages.length === 0 ? (
                <div className="mt-3 text-sm text-slate-600">本日の連絡事項はありません。</div>
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">社内スケジュールカレンダー</h2>

            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                前月
              </button>
              <div className="min-w-[140px] text-center text-sm font-bold text-slate-800">
                {viewYear}年 {viewMonth}月
              </div>
              <button
                onClick={nextMonth}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                次月
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {WEEK_LABELS.map((label) => (
              <div
                key={label}
                className="rounded-xl bg-slate-100 px-2 py-2 text-center text-sm font-bold text-slate-600"
              >
                {label}
              </div>
            ))}

            {calendarCells.map((cell) => {
              const daySchedules = schedules.filter((item) =>
                isDateInRange(cell.date, item.start_date, item.end_date)
              );

              return (
                <div
                  key={cell.date}
                  className={`min-h-[140px] rounded-2xl border p-2 ${
                    cell.inMonth ? "bg-white" : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold">{cell.day}</div>
                    <button
                      onClick={() => openCreateScheduleModal(cell.date)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      ＋
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    {daySchedules.map((item) => (
                      <button
                        key={`${cell.date}_${item.id}`}
                        onClick={() => openEditScheduleModal(item)}
                        className="block w-full rounded-lg bg-sky-50 px-2 py-1 text-left text-xs text-sky-800 hover:bg-sky-100"
                      >
                        <div className="truncate font-semibold">{item.title}</div>
                        <div className="truncate text-[11px] opacity-80">
                          {item.assignee_names.join(" / ") || "担当なし"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {loadingCalendar ? (
            <div className="mt-4 text-sm text-slate-500">カレンダーを読み込み中...</div>
          ) : null}
        </section>
      </div>

      {messageModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMessageModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">連絡事項追加</h3>

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
                disabled={savingMessage}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {savingMessage ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {scheduleModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setScheduleModalOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-900">
                {scheduleEditMode === "edit" ? "スケジュール編集" : "スケジュール追加"}
              </h3>

              {scheduleEditMode === "edit" && scheduleDraft.id ? (
                <button
                  onClick={deleteSchedule}
                  disabled={deletingSchedule}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingSchedule ? "削除中..." : "削除"}
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">開始日</div>
                <input
                  type="date"
                  value={scheduleDraft.start_date}
                  onChange={(e) =>
                    setScheduleDraft((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">終了日</div>
                <input
                  type="date"
                  value={scheduleDraft.end_date}
                  onChange={(e) =>
                    setScheduleDraft((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 px-4"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">タイトル</div>
              <input
                type="text"
                value={scheduleDraft.title}
                onChange={(e) =>
                  setScheduleDraft((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 px-4"
                placeholder="タイトルを入力"
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">担当者（複数選択可）</div>
              <div className="max-h-56 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {staffs.length === 0 ? (
                  <div className="text-sm text-slate-500">スタッフがいません</div>
                ) : (
                  staffs.map((staff) => {
                    const checked = scheduleDraft.assignee_ids.includes(staff.id);
                    return (
                      <label
                        key={staff.id}
                        className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDraftAssignee(staff)}
                        />
                        <span>{staff.staff_name}</span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="mt-2 text-sm text-slate-500">
                {scheduleDraft.assignee_names.length > 0
                  ? `選択中: ${scheduleDraft.assignee_names.join(" / ")}`
                  : "担当者未設定"}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-semibold text-slate-700">内容</div>
              <textarea
                value={scheduleDraft.description}
                onChange={(e) =>
                  setScheduleDraft((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={6}
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none"
                placeholder="内容を入力"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                onClick={saveSchedule}
                disabled={savingSchedule}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {savingSchedule ? "保存中..." : scheduleEditMode === "edit" ? "更新" : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
