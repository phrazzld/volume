"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
        className="relative bg-card border rounded-md p-4 flex items-center justify-between shadow-lg"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">✓</span>
          <span className="text-sm font-medium">Set logged</span>
        </div>
        <Button onClick={onUndo} variant="outline" size="sm">
          Undo
        </Button>
      </div>
    </div>
  );
}
