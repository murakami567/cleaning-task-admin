import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------
// タスク管理（管理者）Reactプレビュー
//
// 要件（今回反映）
// - 初期表示は「当日」タスク管理
// - 「翌日以降」への切替ボタンで表示を切り替える
// - 画面は二面：左=清掃タスク（7） / 右=清掃外タスク（3）
// - 清掃タスク：編集モード（表内編集）と通常モード（行クリックで右ドロワー編集）
// - 清掃外タスク：右上の追加ボタン（薄い青）→右ドロワーで追加 → 右カラムの一覧に表示
//
// 重要ルール（プレビュー）
// - 担当/チェッカー候補は「対象日付の出勤者のみ」
// ------------------------------------------------------------

/** ------------------------
 * Options
 * ------------------------ */

const STATUS_OPTIONS = [
  { value: "未着手", label: "未着手" },
  { value: "進行中", label: "進行中" },
  { value: "完了", label: "完了" },
  { value: "保留", label: "保留" },
];

const DUE_OPTIONS = [
  { value: "DUE_TODAY", label: "当日" },
  { value: "DUE_TOMORROW", label: "翌日" },
  { value: "DUE_LATER", label: "翌々日以降" },
];


const CATEGORY_OPTIONS = [
  { value: "WAREHOUSE", label: "倉庫" },
  { value: "TRANSPORT", label: "運搬" },
  { value: "LINEN", label: "リネン" },
  { value: "INSPECTION", label: "点検" },
  { value: "PURCHASE", label: "買い出し" },
  { value: "OTHER", label: "その他" },
];

const PROPERTY_OPTIONS = [
  { value: "FFFホテル", label: "FFFホテル" },
  { value: "住吉", label: "住吉" },
  { value: "やなぎ橋", label: "やなぎ橋" },
  { value: "エスコート", label: "エスコート" },
];

/** ------------------------
 * Utilities
 * ------------------------ */

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return `${y}-${m}-${d}`;
};

const addDaysIso = (baseIso: string, delta: number) => {
  const [y, m, d] = baseIso.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const formatMd = (iso: string) => {
  const [, m, d] = iso.split("-").map((v) => parseInt(v, 10));
  return `${m}/${d}`;
};

function statusLabel(v: string) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function dueLabel(v: string) {
  return DUE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function categoryLabel(v: string) {
  return CATEGORY_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

/** ------------------------
 * Lightweight UI parts
 * ------------------------ */

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{children}</span>;
}

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
  className?: string;
  [key: string]: any;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-black text-white hover:bg-black/90 focus:ring-black disabled:bg-black/40",
    ghost: "bg-transparent hover:bg-black/5 text-black focus:ring-black disabled:text-black/40",
    outline: "border bg-white hover:bg-black/5 text-black focus:ring-black disabled:text-black/40",
    danger: "bg-red-600 text-white hover:bg-red-600/90 focus:ring-red-600 disabled:bg-red-600/40",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <select
      className="h-9 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-black/20 disabled:bg-black/5"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {(options ?? []).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${active ? "bg-black text-white" : "bg-white hover:bg-black/5"}`}
      type="button"
    >
      {children}
    </button>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex items-center rounded-2xl border bg-white p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl px-3 py-1.5 text-sm transition ${
              active ? "bg-black text-white" : "bg-transparent text-black/70 hover:bg-black/5"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-base font-semibold">{title}</div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

function Drawer({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/30 transition ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-semibold">{title}</div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </div>
        <div className="h-[calc(100%-120px)] overflow-auto p-4">{children}</div>
        <div className="border-t p-4">{footer}</div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white shadow-sm">{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
      <table className="min-w-[1120px] w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 z-10 bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`border-b px-3 py-2 align-top ${className}`}>
      {children}
    </td>
  );
}

/** ------------------------
 * Domain types + helpers
 * ------------------------ */

type Attendee = { userId: string; name: string };

type CleaningTask = {
  id: string;
  status: string;
  property: string;
  room: string;
  assigneeId: string;
  date: string; // yyyy-mm-dd
  due: string; // 当日/翌日/翌々日以降
  baggageTime: string; // HH:mm 荷物預かり
  checkerId: string;
  note: string;
  loadScore?: number;
  guestCount?: number;
  nextCheckinDate?: string;
};

type ApiCleaningTask = {
  id: string;
  property_name: string;
  room_name: string;
  room_key: string;
  task_date: string;
  checkout_date: string;
  next_checkin_date: string | null;
  gap_nights: number;
  guest_count: number;
  load_score: number;
  status: string;
  note: string | null;
  assigned_staff_id: string | null;
  assigned_staff_code: string | null;
  assigned_staff_name: string | null;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

function computeDueLabel(taskDate: string) {
  if (taskDate === baseDate) return "DUE_TODAY";
  if (taskDate === addDaysIso(baseDate, 1)) return "DUE_TOMORROW";
  return "DUE_LATER";
}

function mapApiTaskToUi(task: ApiCleaningTask): CleaningTask {
  return {
    id: task.id,
    status: task.status || "未着手",
    property: task.property_name,
    room: task.room_name,
    assigneeId: task.assigned_staff_id ?? "UNASSIGNED",
    date: task.task_date,
    due: computeDueLabel(task.task_date),
    baggageTime: "",
    checkerId: "",
    note: task.note ?? "",
    loadScore: task.load_score ?? 0,
    guestCount: task.guest_count ?? 0,
    nextCheckinDate: task.next_checkin_date ?? "",
  };
}

async function fetchCleaningTasks(mode: ViewMode): Promise<CleaningTask[]> {
  const endpoint = mode === "TODAY" ? "/tasks/today" : "/tasks/future";
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const data: ApiCleaningTask[] = await res.json();
  return data.map(mapApiTaskToUi);
}

async function persistCleaningTaskPatch(taskId: string, patch: Partial<CleaningTask>) {
  const body: Record<string, any> = { task_id: taskId };
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.note !== undefined) body.note = patch.note;
  if (patch.assigneeId !== undefined) {
    body.assigned_staff_id = patch.assigneeId === "UNASSIGNED" ? null : patch.assigneeId;
    body.assigned_staff_name = patch.assigneeId === "UNASSIGNED" ? null : patch.assigneeId;
  }
  const res = await fetch(`${API_BASE}/tasks/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`update failed: ${res.status}`);
  return res.json();
}

type NonCleaningTask = {
  id: string;
  status: string;
  category: string;
  title: string;
  date: string;
  deadline: string;
  assigneeId: string;
  checkerId: string;
};

function buildAssigneeOptions(attendees: Attendee[]) {
  const base = [{ value: "UNASSIGNED", label: "未割当" }];
  if (!attendees || attendees.length === 0) return base;
  return base.concat(attendees.map((u) => ({ value: u.userId, label: u.name })));
}

function assigneeLabel(userId: string, attendees: Attendee[]) {
  if (!userId || userId === "UNASSIGNED") return "未割当";
  const found = attendees?.find((u) => u.userId === userId);
  return found?.name ?? userId;
}

/** ------------------------
 * Mock Data (Replace with API)
 * ------------------------ */

const baseDate = todayIso();

const MOCK_ATTENDEES_BY_DATE: Record<string, Attendee[]> = {
  [baseDate]: [
    { userId: "u_tanaka", name: "田中" },
    { userId: "u_ueno", name: "上野" },
    { userId: "u_matsumoto", name: "松元" },
    { userId: "u_tsune", name: "恒松" },
  ],
  [addDaysIso(baseDate, 1)]: [
    { userId: "u_tanaka", name: "田中" },
    { userId: "u_matsumoto", name: "松元" },
  ],
  [addDaysIso(baseDate, 2)]: [],
};

const MOCK_CLEANING_TASKS: CleaningTask[] = [
  {
    id: "ct_001",
    status: "未着手",
    property: "FFFホテル",
    room: "1203",
    assigneeId: "UNASSIGNED",
    date: baseDate,
    due: "DUE_TODAY",
    baggageTime: "09:30",
    checkerId: "",
    note: "ベッド多め。アメニティ補充。",
  },
  {
    id: "ct_002",
    status: "進行中",
    property: "住吉",
    room: "305",
    assigneeId: "u_tanaka",
    date: baseDate,
    due: "DUE_TODAY",
    baggageTime: "10:15",
    checkerId: "u_ueno",
    note: "リネン追加あり。",
  },
  {
    id: "ct_003",
    status: "完了",
    property: "やなぎ橋",
    room: "802",
    assigneeId: "u_matsumoto",
    date: baseDate,
    due: "DUE_TODAY",
    baggageTime: "",
    checkerId: "u_tsune",
    note: "写真OK",
  },
  {
    id: "ct_004",
    status: "未着手",
    property: "エスコート",
    room: "204",
    assigneeId: "UNASSIGNED",
    date: addDaysIso(baseDate, 2),
    due: "DUE_LATER",
    baggageTime: "",
    checkerId: "",
    note: "（翌日以降の例）",
  },
];

/** ------------------------
 * Main Component
 * ------------------------ */

type ViewMode = "TODAY" | "FUTURE";

function isFutureDate(isoDate: string) {
  // yyyy-mm-dd なので文字列比較でOK
  return isoDate > baseDate;
}

const UI_VERSION = "v5-2026-01-07";

export default function AdminTasksPagePreview() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [viewMode, setViewMode] = useState<ViewMode>("TODAY");

  // 清掃
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>(() => []);
  const [selectedCleaningId, setSelectedCleaningId] = useState<string>("");
  const [cleaningDrawerOpen, setCleaningDrawerOpen] = useState(false);
  const [tableEditMode, setTableEditMode] = useState(false);
  const [loadingCleaning, setLoadingCleaning] = useState(false);
  const [cleaningError, setCleaningError] = useState("");

  // 清掃外
  const [nonCleaningTasks, setNonCleaningTasks] = useState<NonCleaningTask[]>(() => []);
  const [nonCleaningDrawerOpen, setNonCleaningDrawerOpen] = useState(false);
  const [draftNonCleaning, setDraftNonCleaning] = useState<NonCleaningTask | null>(null);

  const refresh = async () => {
    try {
      setLoadingCleaning(true);
      setCleaningError("");
      const tasks = await fetchCleaningTasks(viewMode);
      setCleaningTasks(tasks);
      setSelectedCleaningId((prev) => (tasks.some((t) => t.id === prev) ? prev : tasks[0]?.id ?? ""));
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
      setCleaningError("清掃タスクの取得に失敗しました");
    } finally {
      setLoadingCleaning(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [viewMode]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(t);
  }, [autoRefresh, viewMode]);

  // 表示対象（当日 / 翌日以降）
  const visibleCleaningTasks = useMemo(() => {
    if (viewMode === "TODAY") return cleaningTasks.filter((t) => t.date === baseDate);
    return cleaningTasks.filter((t) => isFutureDate(t.date));
  }, [cleaningTasks, viewMode]);

  const visibleNonCleaningTasks = useMemo(() => {
    if (viewMode === "TODAY") return nonCleaningTasks.filter((t) => t.date === baseDate);
    return nonCleaningTasks.filter((t) => isFutureDate(t.date));
  }, [nonCleaningTasks, viewMode]);

  // 選択タスクが表示対象から外れたら先頭に寄せる
  useEffect(() => {
    if (visibleCleaningTasks.some((t) => t.id === selectedCleaningId)) return;
    setSelectedCleaningId(visibleCleaningTasks[0]?.id ?? "");
    setCleaningDrawerOpen(false);
  }, [viewMode, visibleCleaningTasks, selectedCleaningId]);

  const selectedCleaningTask = useMemo(
    () => cleaningTasks.find((t) => t.id === selectedCleaningId) ?? null,
    [cleaningTasks, selectedCleaningId]
  );

  const selectedCleaningAttendees = useMemo(() => {
    if (!selectedCleaningTask) return [] as Attendee[];
    return MOCK_ATTENDEES_BY_DATE[selectedCleaningTask.date] ?? [];
  }, [selectedCleaningTask]);

  const selectedAssigneeOptions = useMemo(() => buildAssigneeOptions(selectedCleaningAttendees), [selectedCleaningAttendees]);
  const selectedCheckerOptions = useMemo(
    () => [{ value: "", label: "未設定" }].concat(selectedCleaningAttendees.map((u) => ({ value: u.userId, label: u.name }))),
    [selectedCleaningAttendees]
  );

  const addCleaningTask = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tasks/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        property_name: "FFFホテル",
        room_name: "1003",
        room_key: "FFFホテル1003",
        task_date: new Date().toISOString().slice(0, 10),
        status: "未着手",
        note: "UI追加テスト",
      }),
    });

    if (!res.ok) {
      throw new Error(`create failed: ${res.status}`);
    }

    const data = await res.json();
    console.log("作成結果:", data);

    await refresh();
  } catch (error) {
    console.error(error);
    window.alert("清掃タスクの追加に失敗しました。");
  }
};

  const updateCleaningTask = async (id: string, patch: Partial<CleaningTask>) => {
    setCleaningTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setLastUpdated(new Date());
    const persistableKeys = ["status", "note", "assigneeId"];
    const shouldPersist = Object.keys(patch).some((k) => persistableKeys.includes(k));
    if (!shouldPersist) return;
    try {
      await persistCleaningTaskPatch(id, patch);
    } catch (error) {
      console.error(error);
      setCleaningError("更新に失敗しました。再読み込みしてください。");
      void refresh();
    }
  };

  const removeCleaningTask = (id: string) => {
    setCleaningTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (id === selectedCleaningId) setSelectedCleaningId(next[0]?.id ?? "");
      return next;
    });
    setLastUpdated(new Date());
    setCleaningDrawerOpen(false);
  };

  // 清掃外タスク：追加→右ドロワーで入力→「追加」で確定
  const openAddNonCleaning = () => {
    const id = `nct_${Math.random().toString(16).slice(2, 8)}`;
    setDraftNonCleaning({
      id,
      status: "未着手",
      category: "TRANSPORT",
      title: "",
      date: viewMode === "TODAY" ? baseDate : addDaysIso(baseDate, 1),
      deadline: "",
      assigneeId: "UNASSIGNED",
      checkerId: "",
    });
    setNonCleaningDrawerOpen(true);
  };

  const commitNonCleaning = () => {
    if (!draftNonCleaning) return;
    if (draftNonCleaning.title.trim().length === 0) return;
    setNonCleaningTasks((prev) => [{ ...draftNonCleaning, title: draftNonCleaning.title.trim() }, ...prev]);
    setNonCleaningDrawerOpen(false);
    setDraftNonCleaning(null);
    refresh();
  };

  const removeNonCleaning = (id: string) => {
    setNonCleaningTasks((prev) => prev.filter((t) => t.id !== id));
    refresh();
  };

  // 清掃外も「日付ごとの出勤者だけ」を候補に
  const draftAttendees = useMemo(() => {
    if (!draftNonCleaning) return [] as Attendee[];
    return MOCK_ATTENDEES_BY_DATE[draftNonCleaning.date] ?? [];
  }, [draftNonCleaning]);

  const draftAssigneeOptions = useMemo(() => buildAssigneeOptions(draftAttendees), [draftAttendees]);
  const draftCheckerOptions = useMemo(
    () => [{ value: "", label: "未設定" }].concat(draftAttendees.map((u) => ({ value: u.userId, label: u.name }))),
    [draftAttendees]
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-2xl font-semibold">タスク管理（管理者）</div>
          <div className="mt-1 inline-flex items-center gap-2 text-xs text-black/60">
            <span className="rounded-full border px-2 py-0.5 bg-yellow-50 border-yellow-200 text-yellow-800">UI \'+UI_VERSION+\'</span>
            <span>※これが見えれば新ZIPが読み込まれています</span>
          </div>
          <div className="text-xs text-black/60">
            表示：{viewMode === "TODAY" ? "当日" : "翌日以降"} / 最終更新 {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={[
              { value: "TODAY", label: "当日" },
              { value: "FUTURE", label: "翌日以降" },
            ]}
          />
          <ToggleChip active={autoRefresh} onClick={() => setAutoRefresh((v) => !v)}>
            自動
          </ToggleChip>
          <Button variant="outline" onClick={() => void refresh()}>
            更新
          </Button>
        </div>
      </div>

      {/* Two-pane layout 7:3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-10">
        {/* Left 7/10: 清掃タスク */}
        <div className="lg:col-span-7">
          <Card>
            <CardBody>
              <SectionHeader
                title="清掃タスク一覧"
                actions={
                  <>
                    <ToggleChip active={tableEditMode} onClick={() => setTableEditMode((v) => !v)}>
                      {tableEditMode ? "編集モード" : "編集"}
                    </ToggleChip>

                    <Button
                      variant="outline"
                      className="border-orange-200 bg-orange-50 hover:bg-orange-100"
                      onClick={addCleaningTask}
                    >
                      ＋清掃タスク追加
                    </Button>

                    <Button variant="outline">CSV出力</Button>
                  </>
                }
              />

              <div className="mt-3">
                {cleaningError ? <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cleaningError}</div> : null}
                {loadingCleaning ? <div className="mb-3 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black/60">読み込み中...</div> : null}
                <Table>
                  <thead>
                    <tr>
                      <Th className="w-[160px]">ステータス</Th>
                      <Th className="w-[170px]">物件</Th>
                      <Th className="w-[110px]">部屋</Th>
                      <Th className="w-[200px]">担当</Th>
                      <Th className="w-[170px]">日付</Th>
                      <Th className="w-[140px]">期限</Th>
                      <Th className="w-[140px]">荷物預かり</Th>
                      <Th className="w-[200px]">チェッカー</Th>
                      <Th>備考</Th>
                      <Th className="w-[120px]">操作</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCleaningTasks.map((t) => {
                      const attendees = MOCK_ATTENDEES_BY_DATE[t.date] ?? [];
                      const isSelected = t.id === selectedCleaningId;

                      const assigneeOptions = buildAssigneeOptions(attendees);
                      const checkerOptions = [{ value: "", label: "未設定" }].concat(
                        attendees.map((u) => ({ value: u.userId, label: u.name }))
                      );

                      const openDetails = (e?: React.MouseEvent) => {
                        if (e) e.stopPropagation();
                        setSelectedCleaningId(t.id);
                        setCleaningDrawerOpen(true);
                      };

                      return (
                        <tr
                          key={t.id}
                          className={`${tableEditMode ? "bg-white" : isSelected ? "bg-black/5" : "bg-white hover:bg-black/5"} ${
                            tableEditMode ? "" : "cursor-pointer"
                          }`}
                          onClick={() => {
                            if (tableEditMode) return;
                            setSelectedCleaningId(t.id);
                            setCleaningDrawerOpen(true);
                          }}
                        >
                          {/* ステータス */}
                          <Td>
                            {tableEditMode ? (
                              <Select
                                value={t.status}
                                onChange={(v) => updateCleaningTask(t.id, { status: v })}
                                options={STATUS_OPTIONS}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-black" : "bg-black/20"}`} />
                                <span>{statusLabel(t.status)}</span>
                              </div>
                            )}
                          </Td>

                          {/* 物件 */}
                          <Td>
                            {tableEditMode ? (
                              <Select
                                value={t.property}
                                onChange={(v) => updateCleaningTask(t.id, { property: v })}
                                options={PROPERTY_OPTIONS}
                              />
                            ) : (
                              t.property
                            )}
                          </Td>

                          {/* 部屋 */}
                          <Td>
                            {tableEditMode ? (
                              <TextInput
                                value={t.room}
                                onChange={(v) => updateCleaningTask(t.id, { room: v })}
                                placeholder="例）1203"
                              />
                            ) : (
                              t.room || "-"
                            )}
                          </Td>

                          {/* 担当 */}
                          <Td>
                            {tableEditMode ? (
                              <Select
                                value={t.assigneeId}
                                onChange={(v) => updateCleaningTask(t.id, { assigneeId: v })}
                                options={assigneeOptions}
                                disabled={attendees.length === 0}
                              />
                            ) : (
                              assigneeLabel(t.assigneeId, attendees)
                            )}
                          </Td>

                          {/* 日付 */}
                          <Td>
                            {tableEditMode ? (
                              <input
                                type="date"
                                className="h-9 w-full rounded-lg border px-2 text-sm"
                                value={t.date}
                                onChange={(e) => {
                                  const nextDate = e.target.value;
                                  // 日付を変えたら「その日の出勤者」制約が変わるので、担当/チェッカーはリセット
                                  updateCleaningTask(t.id, { date: nextDate, assigneeId: "UNASSIGNED", checkerId: "" });
                                }}
                              />
                            ) : (
                              formatMd(t.date)
                            )}
                          </Td>

                          {/* 期限（当日/翌日/翌々日以降） */}
                          <Td>
                            {tableEditMode ? (
                              <Select value={t.due} onChange={(v) => updateCleaningTask(t.id, { due: v })} options={DUE_OPTIONS} />
                            ) : (
                              dueLabel(t.due)
                            )}
                          </Td>

                          {/* 荷物預かり（時間） */}
                          <Td>
                            {tableEditMode ? (
                              <input
                                type="time"
                                className="h-9 w-full rounded-lg border px-2 text-sm"
                                value={t.baggageTime || ""}
                                onChange={(e) => updateCleaningTask(t.id, { baggageTime: e.target.value })}
                              />
                            ) : (
                              t.baggageTime || "-"
                            )}
                          </Td>

                          {/* チェッカー */}
                          <Td>
                            {tableEditMode ? (
                              <Select
                                value={t.checkerId}
                                onChange={(v) => updateCleaningTask(t.id, { checkerId: v })}
                                options={checkerOptions}
                                disabled={attendees.length === 0}
                              />
                            ) : (
                              assigneeLabel(t.checkerId, attendees)
                            )}
                          </Td>

                          {/* 備考 */}
                          <Td>
                            {tableEditMode ? (
                              <TextInput value={t.note || ""} onChange={(v) => updateCleaningTask(t.id, { note: v })} placeholder="備考…" />
                            ) : (
                              <div className="max-w-[320px] truncate">{t.note || ""}</div>
                            )}
                          </Td>

                          {/* 操作 */}
                          <Td>
                            <Button variant="outline" size="sm" onClick={openDetails}>
                              詳細
                            </Button>
                          </Td>
                        </tr>
                      );
                    })}

                    {visibleCleaningTasks.length === 0 ? (
                      <tr>
                        <Td colSpan={10} className="py-10">
                          <div className="text-center text-sm text-black/60">
                            {viewMode === "TODAY" ? "当日の清掃タスクがありません。" : "翌日以降の清掃タスクがありません。"}
                          </div>
                        </Td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>

                <div className="mt-3 text-xs text-black/50">
                  {tableEditMode
                    ? "※編集モード：テーブル内で直接編集できます（担当/チェッカーはその日付の出勤者のみ）。"
                    : "※通常モード：行クリックで右側モーダル（ドロワー）を開いて編集します。"}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right 3/10: 清掃外タスク */}
        <div className="lg:col-span-3">
          <Card>
            <CardBody>
              <SectionHeader
                title="清掃外タスク"
                actions={
                  <Button
                    variant="outline"
                    className="border-sky-200 bg-sky-50 hover:bg-sky-100"
                    onClick={openAddNonCleaning}
                  >
                    ＋清掃外タスク追加
                  </Button>
                }
              />

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-black/60">{viewMode === "TODAY" ? "当日分" : "翌日以降"}のみ表示</div>
                <Badge>{visibleNonCleaningTasks.length} 件</Badge>
              </div>

              <div className="mt-3 overflow-auto rounded-2xl border">
                <table className="min-w-[520px] w-full text-sm">
                  <thead>
                    <tr>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">日付</th>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[110px]">種別</th>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 min-w-[220px]">内容</th>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">時刻</th>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">担当</th>
                      <th className="bg-white/90 backdrop-blur border-b px-3 py-2 text-left text-xs font-semibold text-black/70 w-[90px]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleNonCleaningTasks.map((t) => {
                      const attendees = MOCK_ATTENDEES_BY_DATE[t.date] ?? [];
                      return (
                        <tr key={t.id} className="bg-white">
                          <td className="border-b px-3 py-2">{formatMd(t.date)}</td>
                          <td className="border-b px-3 py-2">{categoryLabel(t.category)}</td>
                          <td className="border-b px-3 py-2">
                            <div className="max-w-[320px] truncate">{t.title}</div>
                          </td>
                          <td className="border-b px-3 py-2">{t.deadline || "-"}</td>
                          <td className="border-b px-3 py-2">{assigneeLabel(t.assigneeId, attendees)}</td>
                          <td className="border-b px-3 py-2">
                            <Button variant="danger" size="sm" onClick={() => removeNonCleaning(t.id)}>
                              削除
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {visibleNonCleaningTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border-b px-3 py-8 text-center text-sm text-black/60">
                          {viewMode === "TODAY" ? "当日の清掃外タスクがありません。" : "翌日以降の清掃外タスクがありません。"}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 text-xs text-black/50">※担当/チェッカーは「その日付の出勤者のみ」想定</div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 右側ドロワー：清掃タスク編集 */}
      <Drawer
        open={cleaningDrawerOpen}
        title={selectedCleaningTask ? `清掃タスク編集：${selectedCleaningTask.property} ${selectedCleaningTask.room || ""}` : "清掃タスク編集"}
        onClose={() => setCleaningDrawerOpen(false)}
        footer={
          <div className="flex items-center justify-between">
            <div className="text-xs text-black/50">※プレビュー：編集内容は state のみ（保存は後工程）</div>
            {selectedCleaningTask ? (
              <Button variant="danger" size="sm" onClick={() => removeCleaningTask(selectedCleaningTask.id)}>
                削除
              </Button>
            ) : (
              <span />
            )}
          </div>
        }
      >
        {selectedCleaningTask ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Badge>{selectedCleaningTask.id}</Badge>
              <Badge>{statusLabel(selectedCleaningTask.status)}</Badge>
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">ステータス</div>
              <Select value={selectedCleaningTask.status} onChange={(v) => updateCleaningTask(selectedCleaningTask.id, { status: v })} options={STATUS_OPTIONS} />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">物件</div>
              <Select value={selectedCleaningTask.property} onChange={(v) => updateCleaningTask(selectedCleaningTask.id, { property: v })} options={PROPERTY_OPTIONS} />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">部屋</div>
              <TextInput value={selectedCleaningTask.room} onChange={(v) => updateCleaningTask(selectedCleaningTask.id, { room: v })} placeholder="例）1203" />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">日付</div>
              <input
                type="date"
                className="h-9 w-full rounded-lg border px-2 text-sm"
                value={selectedCleaningTask.date}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  updateCleaningTask(selectedCleaningTask.id, { date: nextDate, assigneeId: "UNASSIGNED", checkerId: "" });
                }}
              />
              <div className="mt-1 text-xs text-black/50">
                {formatMd(selectedCleaningTask.date)} / 出勤者: {selectedCleaningAttendees.map((u) => u.name).join(" / ") || "なし"}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">期限</div>
              <Select value={selectedCleaningTask.due} onChange={(v) => updateCleaningTask(selectedCleaningTask.id, { due: v })} options={DUE_OPTIONS} />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">荷物預かり（時間）</div>
              <input
                type="time"
                className="h-9 w-full rounded-lg border px-2 text-sm"
                value={selectedCleaningTask.baggageTime || ""}
                onChange={(e) => updateCleaningTask(selectedCleaningTask.id, { baggageTime: e.target.value })}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">担当（その日付の出勤者のみ）</div>
              <Select
                value={selectedCleaningTask.assigneeId}
                onChange={(v) => updateCleaningTask(selectedCleaningTask.id, { assigneeId: v })}
                options={selectedAssigneeOptions}
                disabled={selectedCleaningAttendees.length === 0}
              />
              {selectedCleaningAttendees.length === 0 ? <div className="mt-1 text-xs text-black/50">出勤者なし</div> : null}
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">チェッカー（その日付の出勤者のみ）</div>
              <Select
                value={selectedCleaningTask.checkerId}
                onChange={(v) => updateCleaningTask(selectedCleaningTask.id, { checkerId: v })}
                options={selectedCheckerOptions}
                disabled={selectedCleaningAttendees.length === 0}
              />
              {selectedCleaningAttendees.length === 0 ? <div className="mt-1 text-xs text-black/50">出勤者なし</div> : null}
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">備考</div>
              <textarea
                className="h-28 w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                value={selectedCleaningTask.note || ""}
                onChange={(e) => updateCleaningTask(selectedCleaningTask.id, { note: e.target.value })}
                placeholder="備考…"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-black/60">行を選択してください。</div>
        )}
      </Drawer>

      {/* 右側ドロワー：清掃外タスク追加 */}
      <Drawer
        open={nonCleaningDrawerOpen}
        title="清掃外タスク追加"
        onClose={() => {
          setNonCleaningDrawerOpen(false);
          setDraftNonCleaning(null);
        }}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-black/50">※「追加」で確定（プレビュー：stateのみ）</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNonCleaningDrawerOpen(false);
                  setDraftNonCleaning(null);
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="outline"
                className="border-sky-200 bg-sky-50 hover:bg-sky-100"
                disabled={!draftNonCleaning || draftNonCleaning.title.trim().length === 0}
                onClick={commitNonCleaning}
              >
                追加
              </Button>
            </div>
          </div>
        }
      >
        {draftNonCleaning ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Badge>{draftNonCleaning.id}</Badge>
              <Badge>{statusLabel(draftNonCleaning.status)}</Badge>
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">ステータス</div>
              <Select
                value={draftNonCleaning.status}
                onChange={(v) => setDraftNonCleaning((p) => (p ? { ...p, status: v } : p))}
                options={STATUS_OPTIONS}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">日付</div>
              <input
                type="date"
                className="h-9 w-full rounded-lg border px-2 text-sm"
                value={draftNonCleaning.date}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setDraftNonCleaning((p) => (p ? { ...p, date: nextDate, assigneeId: "UNASSIGNED", checkerId: "" } : p));
                }}
              />
              <div className="mt-1 text-xs text-black/50">
                {formatMd(draftNonCleaning.date)} / 出勤者: {draftAttendees.map((u) => u.name).join(" / ") || "なし"}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">業務種別</div>
              <Select
                value={draftNonCleaning.category}
                onChange={(v) => setDraftNonCleaning((p) => (p ? { ...p, category: v } : p))}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">内容（必須）</div>
              <TextInput
                value={draftNonCleaning.title}
                onChange={(v) => setDraftNonCleaning((p) => (p ? { ...p, title: v } : p))}
                placeholder="例）倉庫整理 / FFF→住吉 運搬 / 買い出し…"
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">期限（任意）</div>
              <input
                type="time"
                className="h-9 w-full rounded-lg border px-2 text-sm"
                value={draftNonCleaning.deadline || ""}
                onChange={(e) => setDraftNonCleaning((p) => (p ? { ...p, deadline: e.target.value } : p))}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">担当（その日付の出勤者のみ）</div>
              <Select
                value={draftNonCleaning.assigneeId}
                onChange={(v) => setDraftNonCleaning((p) => (p ? { ...p, assigneeId: v } : p))}
                options={draftAssigneeOptions}
                disabled={draftAttendees.length === 0}
              />
              {draftAttendees.length === 0 ? <div className="mt-1 text-xs text-black/50">出勤者なし</div> : null}
            </div>

            <div>
              <div className="mb-1 text-xs text-black/60">チェッカー（その日付の出勤者のみ）</div>
              <Select
                value={draftNonCleaning.checkerId}
                onChange={(v) => setDraftNonCleaning((p) => (p ? { ...p, checkerId: v } : p))}
                options={draftCheckerOptions}
                disabled={draftAttendees.length === 0}
              />
              {draftAttendees.length === 0 ? <div className="mt-1 text-xs text-black/50">出勤者なし</div> : null}
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-black/60">フォームを初期化できませんでした。</div>
        )}
      </Drawer>
    </div>
  );
}

/** ------------------------
 * Lightweight self-tests (dev only)
 * ------------------------ */

function __assert(name: string, cond: boolean) {
  if (!cond) {
    // eslint-disable-next-line no-console
    console.error(`❌ ${name}`);
    throw new Error(`Test failed: ${name}`);
  }
  // eslint-disable-next-line no-console
  console.log(`✅ ${name}`);
}

function __runTests() {
  const d0 = "2025-01-01";
  __assert("addDaysIso +1", addDaysIso(d0, 1) === "2025-01-02");
  __assert("addDaysIso +31", addDaysIso(d0, 31) === "2025-02-01");

  const empty = buildAssigneeOptions([] as Attendee[]);
  __assert("assignee options include UNASSIGNED", empty.some((o) => o.value === "UNASSIGNED"));

  const one = buildAssigneeOptions([{ userId: "u1", name: "A" }]);
  __assert("assignee options include attendee", one.some((o) => o.value === "u1" && o.label === "A"));

  __assert("assigneeLabel UNASSIGNED", assigneeLabel("UNASSIGNED", [{ userId: "u1", name: "A" }]) === "未割当");
  __assert("assigneeLabel resolve", assigneeLabel("u1", [{ userId: "u1", name: "A" }]) === "A");
  __assert("statusLabel existing", statusLabel("未着手") === "未着手");
  __assert("dueLabel TODAY", dueLabel("DUE_TODAY") === "当日");

  __assert("formatMd 2025-12-09", formatMd("2025-12-09") === "12/9");
  __assert("categoryLabel TRANSPORT", categoryLabel("TRANSPORT") === "運搬");

  // string compare check
  __assert("date string compare", "2025-01-02" > "2025-01-01");
}

try {
  const env = (import.meta as any).env?.MODE || "development";
  if (env !== "production") __runTests();
} catch (error) {
  void error;
}
