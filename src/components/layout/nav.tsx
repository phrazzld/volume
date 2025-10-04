"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Nav() {
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
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
