import { ReactNode } from "react";
import { CornerBracket } from "./corner-bracket";

interface TerminalPanelProps {
  children: ReactNode;
  title?: string;
  titleColor?: "success" | "danger" | "warning" | "info" | "accent";
  showCornerBrackets?: boolean;
  className?: string;
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
}: TerminalPanelProps) {
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
        <div className="border-b border-terminal-border px-3 py-2">
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${titleColorClasses[titleColor]}`}
          >
            {title}
          </h2>
        </div>
      )}

      {children}
    </div>
  );
}
