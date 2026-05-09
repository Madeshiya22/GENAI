import { createBrowserRouter } from "react-router";

import Chat from "../features/chats/pages/Chat";

import Login from "../features/auth/pages/Login";

import AuthCallback from "../features/auth/pages/AuthCallback";

import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/api/auth/google/callback",
    element: <AuthCallback />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    ),
  },
]);
