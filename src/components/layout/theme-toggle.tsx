"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5 text-amber-500" />;
      case "dark":
        return <Moon className="h-5 w-5 text-blue-400" />;
      default:
        return <Monitor className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      default:
        return "System theme";
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={cycleTheme}
        className="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        aria-label={`Current theme: ${getLabel()}. Click to cycle themes.`}
        type="button"
      >
        <div className="transition-all duration-300 ease-out animate-theme-rotate">
          {getIcon()}
        </div>
      </button>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 delay-200 whitespace-nowrap z-50">
        {getLabel()}
      </div>
    </div>
  );
}
