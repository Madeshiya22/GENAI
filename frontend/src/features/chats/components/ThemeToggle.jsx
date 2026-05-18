import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../../app/useTheme";

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      aria-pressed={isDarkMode}
      title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__icon theme-toggle__icon--sun">
          <Sun size={14} />
        </span>
        <span className="theme-toggle__icon theme-toggle__icon--moon">
          <Moon size={14} />
        </span>
        <span className="theme-toggle__thumb" />
      </span>
      <span className="theme-toggle__label">
        {isDarkMode ? "Dark mode" : "Light mode"}
      </span>
    </button>
  );
};

export default ThemeToggle;
