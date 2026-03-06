import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function SidebarThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2 mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Theme</p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
            resolvedTheme === "light"
              ? "bg-sky-500 text-white"
              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          }`}
        >
          <Sun className="h-3 w-3" /> Light
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
            resolvedTheme === "dark"
              ? "bg-sky-500 text-white"
              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          }`}
        >
          <Moon className="h-3 w-3" /> Dark
        </button>

        <button
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
            theme === "system"
              ? "bg-sky-500 text-white"
              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          }`}
        >
          <Monitor className="h-3 w-3" /> System
        </button>
      </div>
    </div>
  );
}
