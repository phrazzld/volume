"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="h-10 px-4 border border-terminal-border bg-terminal-bgSecondary text-terminal-textSecondary font-mono text-sm uppercase flex items-center justify-center">
        ———
      </button>
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

  const displayTheme = theme === "system" ? "AUTO" : theme?.toUpperCase();

  return (
    <button
      onClick={cycleTheme}
      className="h-10 px-4 border border-terminal-border bg-terminal-bgSecondary text-terminal-text hover:border-terminal-info hover:text-terminal-info transition-colors font-mono text-sm uppercase flex items-center justify-center"
      title={`Theme: ${displayTheme} (click to cycle)`}
    >
      {displayTheme}
    </button>
  );
}
