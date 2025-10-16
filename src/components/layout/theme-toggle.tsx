"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        ---
      </Button>
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

  const displayTheme =
    theme === "system"
      ? "Auto"
      : theme
        ? theme.charAt(0).toUpperCase() + theme.slice(1)
        : "---";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={cycleTheme}
      title={`Theme: ${displayTheme} (click to cycle)`}
    >
      {displayTheme}
    </Button>
  );
}
