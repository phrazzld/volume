"use client";

import { useEffect } from "react";
import { CornerBracket } from "@/components/ui/corner-bracket";

interface UndoToastProps {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ visible, onUndo, onDismiss }: UndoToastProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div
        className="relative bg-terminal-bgSecondary border border-terminal-success p-4 flex items-center justify-between"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Corner brackets */}
        <CornerBracket position="top-left" color="#00ff00" />
        <CornerBracket position="top-right" color="#00ff00" />
        <CornerBracket position="bottom-left" color="#00ff00" />
        <CornerBracket position="bottom-right" color="#00ff00" />

        <div className="flex items-center gap-2">
          <span className="text-terminal-success font-mono font-bold">[✓]</span>
          <span className="text-terminal-text font-mono uppercase text-sm font-medium">
            SET LOGGED
          </span>
        </div>
        <button
          onClick={onUndo}
          className="ml-4 px-3 py-2 border border-terminal-success text-terminal-success hover:bg-terminal-success hover:text-terminal-bg font-mono uppercase text-xs font-bold transition-all duration-100"
        >
          UNDO
        </button>
      </div>
    </div>
  );
}
