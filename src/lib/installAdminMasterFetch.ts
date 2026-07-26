const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

let installed = false;

function normalizeUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function replaceMasterReadUrl(url: string): string {
  if (url === `${API_BASE}/properties`) {
    return `${API_BASE}/admin/master/properties`;
  }
  if (url === `${API_BASE}/rooms`) {
    return `${API_BASE}/admin/master/rooms`;
  }
  return url;
}

export function installAdminMasterFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const originalUrl = normalizeUrl(input);
    const rewrittenUrl = replaceMasterReadUrl(originalUrl);
    const isProtectedMasterRead = rewrittenUrl !== originalUrl;

    if (!isProtectedMasterRead) {
      return originalFetch(input, init);
    }

    const token = localStorage.getItem("admin_access_token") || "";
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await originalFetch(rewrittenUrl, {
      ...init,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_user");
      window.location.assign("/admin/login");
    }

    return response;
  };
}
