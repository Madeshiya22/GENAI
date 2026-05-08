import { createBrowserRouter } from "react-router-dom";

import Chat from "../features/chats/pages/Chat";

import Login from "../features/auth/pages/Login";

import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
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
