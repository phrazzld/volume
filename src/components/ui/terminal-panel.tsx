"use client";

import { ReactNode, useState, useEffect } from "react";
import { CornerBracket } from "./corner-bracket";

interface TerminalPanelProps {
  children: ReactNode;
  title?: string;
  titleColor?: "success" | "danger" | "warning" | "info" | "accent";
  showCornerBrackets?: boolean;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  storageKey?: string; // For localStorage persistence
}

const titleColorClasses = {
  success: "text-terminal-success",
  danger: "text-terminal-danger",
  warning: "text-terminal-warning",
  info: "text-terminal-info",
  accent: "text-terminal-accent",
};

export function TerminalPanel({
  children,
  title,
  titleColor = "info",
  showCornerBrackets = false,
  className = "",
  collapsible = false,
  defaultCollapsed = false,
  storageKey,
}: TerminalPanelProps) {
  // Initialize collapsed state from localStorage or defaultCollapsed
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined" || !collapsible || !storageKey) {
      return defaultCollapsed;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored === "true" : defaultCollapsed;
    } catch (error) {
      // localStorage might be blocked (private mode, etc.)
      console.warn("Failed to read collapsed state from localStorage:", error);
      return defaultCollapsed;
    }
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (collapsible && storageKey) {
      try {
        localStorage.setItem(storageKey, String(isCollapsed));
      } catch (error) {
        // localStorage might be blocked (private mode, quota exceeded, etc.)
        console.warn("Failed to save collapsed state to localStorage:", error);
      }
    }
  }, [isCollapsed, collapsible, storageKey]);

  const toggleCollapsed = () => {
    if (collapsible) {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div
      className={`relative bg-terminal-bg border border-terminal-border ${className}`}
    >
      {showCornerBrackets && (
        <>
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />
        </>
      )}

      {title && (
        <div
          className={`border-b border-terminal-border px-3 py-2 ${
            collapsible ? "cursor-pointer hover:bg-terminal-bgSecondary transition-colors" : ""
          }`}
          onClick={toggleCollapsed}
          onKeyDown={(e) => {
            if (collapsible && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              toggleCollapsed();
            }
          }}
          role={collapsible ? "button" : undefined}
          tabIndex={collapsible ? 0 : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
          aria-controls={collapsible && storageKey ? `panel-content-${storageKey}` : undefined}
        >
          <h2
            className={`text-xs font-bold uppercase tracking-wider flex items-center justify-between ${titleColorClasses[titleColor]}`}
          >
            <span>{title}</span>
            {collapsible && (
              <span className="text-terminal-textSecondary ml-2">
                {isCollapsed ? "▼" : "▲"}
              </span>
            )}
          </h2>
        </div>
      )}

      {!isCollapsed && (
        <div id={collapsible && storageKey ? `panel-content-${storageKey}` : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}
