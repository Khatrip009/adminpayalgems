import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const icon =
    theme === "system" ? (
      <Monitor className="h-4 w-4" />
    ) : resolvedTheme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Current: ${theme} — Click to switch`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm
                 hover:border-sky-300 hover:text-sky-600
                 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500 dark:hover:text-sky-300"
    >
      {icon}
    </button>
  );
}
