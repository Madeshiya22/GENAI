import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./useTheme";

const STORAGE_KEY = "mento-theme";
const THEMES = {
  light: "light",
  dark: "dark",
};

function getInitialTheme() {
  if (typeof window === "undefined") {
    return THEMES.dark;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (savedTheme === THEMES.light || savedTheme === THEMES.dark) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? THEMES.light
    : THEMES.dark;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDarkMode = theme === THEMES.dark;

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode,
      setTheme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === THEMES.dark ? THEMES.light : THEMES.dark,
        ),
    }),
    [isDarkMode, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
