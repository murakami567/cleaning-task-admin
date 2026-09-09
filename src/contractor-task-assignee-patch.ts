const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

let installed = false;
let contractorCache: any[] | null = null;
let contractorCacheAt = 0;
const CONTRACTOR_CACHE_MS = 60_000;

async function loadContractors(originalFetch: typeof window.fetch): Promise<any[]> {
  const now = Date.now();
  if (contractorCache && now - contractorCacheAt < CONTRACTOR_CACHE_MS) {
    return contractorCache;
  }

  try {
    const res = await originalFetch(`${API_BASE}/staffs`);
    if (!res.ok) return contractorCache ?? [];
    const data = await res.json();
    contractorCache = (Array.isArray(data) ? data : []).filter(
      (staff: any) => staff?.role === "contractor" && staff?.is_active !== false
    );
    contractorCacheAt = now;
    return contractorCache;
  } catch (error) {
    console.error("contractor candidate load failed", error);
    return contractorCache ?? [];
  }
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

    if (
      window.location.pathname !== "/admin/tasks" ||
      !url.includes("/shifts?shift_date=") ||
      !response.ok
    ) {
      return response;
    }

    try {
      const data = await response.clone().json();
      const contractors = await loadContractors(originalFetch);
      if (contractors.length === 0) return response;

      const days = Array.isArray(data) ? data : [data];
      if (days.length === 0) return response;

      const nextDays = days.map((day: any) => {
        if (!day) return day;

        const currentEntries = Array.isArray(day.shift_entries)
          ? [...day.shift_entries]
          : [];
        const existingIds = new Set(
          currentEntries.map((entry: any) => String(entry?.staff_id || ""))
        );

        for (const staff of contractors) {
          const staffId = String(staff?.id || "");
          if (!staffId || existingIds.has(staffId)) continue;

          currentEntries.push({
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

        return { ...day, shift_entries: currentEntries };
      });

      const body = JSON.stringify(Array.isArray(data) ? nextDays : nextDays[0]);
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      console.error("contractor assignee patch failed", error);
      return response;
    }
  }) as typeof window.fetch;
}
