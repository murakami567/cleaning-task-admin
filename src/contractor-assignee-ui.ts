const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://cleaning-task-api.onrender.com";

let contractorNames = new Set<string>();
let loading = false;

async function loadContractors() {
  if (loading) return;
  loading = true;
  try {
    const res = await fetch(`${API_BASE}/staffs`);
    if (!res.ok) return;
    const rows = await res.json();
    contractorNames = new Set(
      (Array.isArray(rows) ? rows : [])
        .filter((row: any) => row?.role === "contractor" && row?.is_active !== false)
        .map((row: any) => String(row?.staff_name || "").trim())
        .filter(Boolean)
    );
  } catch (error) {
    console.error("contractor assignee UI load failed", error);
  } finally {
    loading = false;
  }
}

function decorateContractorCandidates() {
  if (contractorNames.size === 0) return;

  document.querySelectorAll<HTMLDivElement>("div.max-h-36.overflow-auto").forEach((container) => {
    const labels = Array.from(container.querySelectorAll<HTMLLabelElement>("label"));
    if (!labels.length) return;

    const contractors: HTMLLabelElement[] = [];
    const others: HTMLLabelElement[] = [];

    labels.forEach((label) => {
      const nameNode = label.querySelector<HTMLSpanElement>("span.truncate");
      const name = String(nameNode?.textContent || "").trim();
      const isContractor = contractorNames.has(name);

      if (isContractor) {
        label.style.setProperty("background-color", "rgb(250 245 255)", "important");
        label.style.setProperty("border-color", "rgb(216 180 254)", "important");
        label.style.setProperty("color", "rgb(88 28 135)", "important");

        const badge = label.querySelector<HTMLSpanElement>("span.shrink-0");
        if (badge) {
          badge.textContent = "委託業者";
          badge.style.setProperty("color", "rgb(107 33 168)", "important");
          badge.style.setProperty("background-color", "rgb(243 232 255)", "important");
        }
        contractors.push(label);
      } else {
        others.push(label);
      }
    });

    [...contractors, ...others].forEach((label) => container.appendChild(label));
  });
}

function scheduleDecorate() {
  window.requestAnimationFrame(decorateContractorCandidates);
}

export function installContractorAssigneeUi() {
  void loadContractors().then(scheduleDecorate);

  const observer = new MutationObserver(scheduleDecorate);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("focus", () => {
    void loadContractors().then(scheduleDecorate);
  });
}
