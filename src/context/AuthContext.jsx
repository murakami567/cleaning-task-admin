import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user;

  useEffect(() => {
    const token = localStorage.getItem("employee_access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe();
  }, []);

  async function fetchMe() {
    try {
      const data = await api.get("/api/employee/me");
      setUser(data.user);
    } catch (error) {
      console.error("fetchMe error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(loginId, password) {
    const data = await api.post("/api/auth/login", {
      login_id: loginId,
      password,
      role: "employee",
    });

    localStorage.setItem("employee_access_token", data.access_token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("employee_access_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn,
      login,
      logout,
      fetchMe,
    }),
    [user, loading, isLoggedIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
