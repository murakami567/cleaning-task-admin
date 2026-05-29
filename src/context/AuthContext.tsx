import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { isJwtExpired } from "../lib/jwt";

type User = {
  id?: string | number;
  name?: string;
  login_id?: string;
  role?: string;
  assigned_properties?: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user;

  useEffect(() => {
    const token = localStorage.getItem("employee_access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    if (isJwtExpired(token)) {
      localStorage.removeItem("employee_access_token");
      setLoading(false);
      return;
    }

    fetchMe();
  }, []);

  async function fetchMe() {
    try {
      const data = await api.get("/api/employee/me");
      setUser(data.user ?? null);
    } catch (error) {
      console.error("fetchMe error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(loginId: string, password: string) {
    const data = await api.post("/api/auth/login", {
  login_id: loginId,
  password,
  role: "employee_portal",
});

    localStorage.setItem("employee_access_token", data.access_token);
    setUser(data.user ?? null);
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
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
