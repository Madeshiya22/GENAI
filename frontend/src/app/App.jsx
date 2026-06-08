import { RouterProvider } from "react-router";
import { router } from "./app.route";
import { Provider } from "react-redux";
import { store } from "./app.store";
import { useAuth } from "../features/auth/hooks/useAuth";
import { ThemeProvider } from "./ThemeProvider";
import PWABadge from "../components/PWABadge";

function AppContent() {
  useAuth();

  return (
    <>
      <RouterProvider router={router} />
      <PWABadge />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ThemeProvider>
  );
}

export default App;
