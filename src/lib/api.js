const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("employee_access_token");

  const headers = {
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

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "通信に失敗しました");
  }

  return data;
}

export const api = {
  post: (path, body) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  get: (path) =>
    request(path, {
      method: "GET",
    }),

  put: (path, body) =>
    request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
