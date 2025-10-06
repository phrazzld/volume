"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Nav() {
  const { userId } = useAuth();

  return (
    <nav className="bg-terminal-bg border-b border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold uppercase font-mono text-terminal-text tracking-wider"
          >
            VOLUME
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {userId ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 border border-terminal-border text-terminal-text hover:border-terminal-info hover:text-terminal-info transition-colors uppercase text-sm font-mono"
                >
                  LOG IN
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-terminal-success text-terminal-bg font-bold hover:opacity-90 active:scale-97 transition-all uppercase text-sm font-mono"
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
