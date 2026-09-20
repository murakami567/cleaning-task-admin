const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

let installed = false;
let staffCache: any[] | null = null;
let staffCacheAt = 0;
const STAFF_CACHE_MS = 60_000;

async function loadStaffs(originalFetch: typeof window.fetch): Promise<any[]> {
  const now = Date.now();
  if (staffCache && now - staffCacheAt < STAFF_CACHE_MS) return staffCache;

  try {
    const res = await originalFetch(`${API_BASE}/staffs`);
    if (!res.ok) return staffCache ?? [];
    const data = await res.json();
    staffCache = Array.isArray(data) ? data : [];
    staffCacheAt = now;
    return staffCache;
  } catch (error) {
    console.error("staff candidate load failed", error);
    return staffCache ?? [];
  }
}

function isUuid(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function buildStaffNameMap(staffs: any[]) {
  return new Map(
    staffs
      .map((staff: any) => [String(staff?.id || ""), String(staff?.staff_name || "").trim()] as const)
      .filter(([id, name]) => id && name)
  );
}

function decorateContractorCandidates() {
  const names = new Set(
    (staffCache ?? [])
      .filter((staff: any) => staff?.role === "contractor" && staff?.is_active !== false)
      .map((staff: any) => String(staff?.staff_name || "").trim())
      .filter(Boolean)
  );
  if (names.size === 0) return;

  document.querySelectorAll<HTMLDivElement>("div.max-h-36.overflow-auto").forEach((container) => {
    const rows = Array.from(container.querySelectorAll<HTMLLabelElement>(":scope > label"));
    if (!rows.length) return;

    const contractors: HTMLLabelElement[] = [];
    const others: HTMLLabelElement[] = [];

    for (const row of rows) {
      const nameNode = row.querySelector<HTMLSpanElement>("span.truncate");
      const name = String(nameNode?.textContent || "").trim();
      const isContractor = names.has(name);

      if (isContractor) {
        row.style.setProperty("background-color", "rgb(250 245 255)", "important");
        row.style.setProperty("border-color", "rgb(192 132 252)", "important");
        row.style.setProperty("color", "rgb(88 28 135)", "important");

        const badge = row.querySelector<HTMLSpanElement>("span.shrink-0");
        if (badge) {
          badge.textContent = "委託業者";
          badge.style.setProperty("background-color", "rgb(243 232 255)", "important");
          badge.style.setProperty("color", "rgb(107 33 168)", "important");
        }
        contractors.push(row);
      } else {
        others.push(row);
      }
    }

    const desired = [...contractors, ...others];
    const current = Array.from(container.children).filter(
      (node): node is HTMLLabelElement => node instanceof HTMLLabelElement
    );
    const alreadyOrdered =
      current.length === desired.length && current.every((row, index) => row === desired[index]);

    if (!alreadyOrdered) {
      for (const row of desired) container.appendChild(row);
    }
  });
}

function scheduleDecorate() {
  window.requestAnimationFrame(decorateContractorCandidates);
}

function repairTaskAssigneeNames(task: any, nameById: Map<string, string>) {
  if (!task || typeof task !== "object") return task;

  const ids = Array.isArray(task.assigned_staff_ids)
    ? task.assigned_staff_ids.map((id: any) => String(id || ""))
    : task.assigned_staff_id
    ? [String(task.assigned_staff_id)]
    : [];

  if (ids.length === 0) return task;

  const currentNames = Array.isArray(task.assigned_staff_names)
    ? task.assigned_staff_names.map((name: any) => String(name || ""))
    : task.assigned_staff_name
    ? [String(task.assigned_staff_name)]
    : [];

  const repairedNames = ids.map((id: string, index: number) => {
    const current = String(currentNames[index] || "").trim();
    if (current && !isUuid(current)) return current;
    return nameById.get(id) || "未登録スタッフ";
  });

  return {
    ...task,
    assigned_staff_names: repairedNames,
    assigned_staff_name: repairedNames[0] ?? null,
  };
}

export function installContractorTaskAssigneePatch() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    if (window.location.pathname !== "/admin/tasks" || !response.ok) return response;

    try {
      // 出勤者データの staff_members が欠けていてもスタッフマスタから氏名を補完する。
      if (url.includes("/shifts?shift_date=") || url.includes("/shifts/batch?shift_dates=")) {
        const data = await response.clone().json();
        const staffs = await loadStaffs(originalFetch);
        const nameById = buildStaffNameMap(staffs);
        const contractors = staffs.filter(
          (staff: any) => staff?.role === "contractor" && staff?.is_active !== false
        );

        const days = Array.isArray(data) ? data : [data];
        const nextDays = days.map((day: any) => {
          if (!day) return day;

          const currentEntries = Array.isArray(day.shift_entries)
            ? day.shift_entries.map((entry: any) => {
                const staffId = String(entry?.staff_id || "");
                const resolvedName = nameById.get(staffId);
                if (!resolvedName) return entry;
                return {
                  ...entry,
                  staff_members: {
                    ...(entry.staff_members || {}),
                    id: entry.staff_members?.id || staffId,
                    staff_name: resolvedName,
                  },
                };
              })
            : [];

          const existingIds = new Set(currentEntries.map((entry: any) => String(entry?.staff_id || "")));
          const contractorEntries: any[] = [];

          for (const staff of contractors) {
            const staffId = String(staff?.id || "");
            if (!staffId || existingIds.has(staffId)) continue;

            contractorEntries.push({
              id: `contractor-${staffId}`,
              staff_id: staffId,
              status: "出勤",
              staff_members: {
                ...staff,
                available_property_ids: Array.isArray(staff.available_property_ids)
                  ? staff.available_property_ids
                  : [],
                unchecked_property_ids: Array.isArray(staff.unchecked_property_ids)
                  ? staff.unchecked_property_ids
                  : [],
              },
            });
          }

          return { ...day, shift_entries: [...contractorEntries, ...currentEntries] };
        });

        window.setTimeout(scheduleDecorate, 0);
        window.setTimeout(scheduleDecorate, 100);

        return new Response(JSON.stringify(Array.isArray(data) ? nextDays : nextDays[0]), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }

      // 既存データに UUID が assigned_staff_names として残っていても表示時に氏名へ補正する。
      if (
        url.includes("/tasks/today") ||
        url.includes("/tasks/future") ||
        url.includes("/tasks/by-date")
      ) {
        const data = await response.clone().json();
        const staffs = await loadStaffs(originalFetch);
        const nameById = buildStaffNameMap(staffs);
        const repaired = Array.isArray(data)
          ? data.map((task: any) => repairTaskAssigneeNames(task, nameById))
          : repairTaskAssigneeNames(data, nameById);

        return new Response(JSON.stringify(repaired), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    } catch (error) {
      console.error("task assignee patch failed", error);
    }

    return response;
  }) as typeof window.fetch;
}