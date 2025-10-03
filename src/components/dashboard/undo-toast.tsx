"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

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
      <div className="bg-green-600 dark:bg-green-700 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Set logged successfully!</span>
        </div>
        <button
          onClick={onUndo}
          className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded font-medium transition-colors"
        >
          Undo
        </button>
      </div>
    </div>
  );
}
