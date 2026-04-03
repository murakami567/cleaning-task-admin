import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EmployeeProtectedRoute({ children }) {
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingBox}>読み込み中...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/employee/login" replace />;
  }

  return children;
}

const styles = {
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f7f8fc",
  },
  loadingBox: {
    background: "#fff",
    padding: "16px 24px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    fontSize: "14px",
  },
};
