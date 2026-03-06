import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;               // user's chosen mode
  resolvedTheme: "light" | "dark"; // actual applied mode
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "pmg_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  /** Apply theme to HTML (<html>) */
  const applyTheme = (t: "light" | "dark") => {
    const root = document.documentElement;

    // Smooth fade animation
    root.classList.add("theme-fade");

    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    setTimeout(() => root.classList.remove("theme-fade"), 300);
  };

  /** Determine final theme: user choice OR system */
  const resolve = (t: Theme) => {
    if (t === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return systemDark ? "dark" : "light";
    }
    return t;
  };

  /** Initialize theme on mount */
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) || "system";
    setThemeState(saved);

    const finalTheme = resolve(saved);
    setResolvedTheme(finalTheme);
    applyTheme(finalTheme);
  }, []);

  /** Listen for system theme changes dynamically */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      if (theme === "system") {
        const newMode = mq.matches ? "dark" : "light";
        setResolvedTheme(newMode);
        applyTheme(newMode);
      }
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  /** Update user-selected theme */
  const setTheme = (t: Theme) => {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);

    const final = resolve(t);
    setResolvedTheme(final);
    applyTheme(final);
  };

  /** Toggle light/dark/system manually */
  const toggleTheme = () => {
    const order: Theme[] = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length]; // cycles through modes
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
