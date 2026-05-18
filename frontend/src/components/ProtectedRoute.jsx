import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const LoadingSkeleton = () => (
  <div className="app-loader">
    <div className="app-loader__mark">M</div>
    <span className="app-loader__text">Loading Mento AI...</span>
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
