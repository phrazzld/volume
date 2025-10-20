"use client";

import { useAuth } from "@clerk/nextjs";
import { ExternalLink } from "lucide-react";

export function Footer() {
  const { userId } = useAuth();
  const currentYear = new Date().getFullYear();

  // Hide footer for unauthenticated users (footer is integrated into landing)
  if (!userId) {
    return null;
  }

  return (
    <footer className="border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between text-sm text-muted-foreground">
          <p>© {currentYear} Volume</p>
          <a
            href="https://github.com/phrazzld/volume"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
