import React from "react";

import { useSelector } from "react-redux";

import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated,

    loading,
  } = useSelector((state) => state.auth);

  // AUTH LOADING
  if (loading) {
    return <h1>Loading...</h1>;
  }

  // NOT LOGGED IN
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // AUTHORIZED
  return children;
};

export default ProtectedRoute;
