import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app.route";
import { Provider } from "react-redux";
import { store } from "./app.store";
import { useAuth } from "./features/auth/hooks/useAuth";

function AppContent() {
  useAuth();

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
