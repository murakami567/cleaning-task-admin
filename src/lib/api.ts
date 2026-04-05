const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
};

async function request(path: string, options: RequestOptions = {}) {
  const token = localStorage.getItem("employee_access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "通信に失敗しました。");
  }

  return data;
}

export const api = {
  get: (path: string) =>
    request(path, {
      method: "GET",
    }),

  post: (path: string, body: unknown) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (path: string, body: unknown) =>
    request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
