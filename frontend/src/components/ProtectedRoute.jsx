import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const LoadingSkeleton = () => (
  <div style={{
    width: "100%",
    height: "100vh",
    background: "var(--bg-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  }}>
    <div style={{
      width: "36px",
      height: "36px",
      background: "linear-gradient(135deg, #7c5cfc 0%, #6246ea 100%)",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      animation: "pulse 1.5s ease-in-out infinite",
    }}>✦</div>
    <span style={{
      color: "var(--text-secondary)",
      fontSize: "15px",
      fontFamily: "var(--font)",
      fontWeight: 500,
    }}>Loading Mento AI...</span>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.5; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
