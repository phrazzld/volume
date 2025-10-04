"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();

  const links = [{ href: "/", label: "HOME" }];

  return (
    <nav className="bg-terminal-bg border-b border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold uppercase font-mono text-terminal-text tracking-wider"
            >
              VOLUME
            </Link>
            <div className="hidden md:flex gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 py-1 text-sm font-mono transition-colors ${
                    pathname === link.href
                      ? "text-terminal-accent border-b-2 border-terminal-accent"
                      : "text-terminal-textSecondary hover:text-terminal-info"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-3 flex gap-4 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2 py-1 text-sm font-mono whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? "text-terminal-accent border-b-2 border-terminal-accent"
                  : "text-terminal-textSecondary hover:text-terminal-info"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
