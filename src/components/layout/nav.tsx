"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const { userId } = useAuth();
  const pathname = usePathname();

  // Determine if a nav link is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

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
            {/* Desktop navigation links - hidden on mobile */}
            {userId && (
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-mono uppercase transition-colors ${
                      isActive(link.href)
                        ? "text-terminal-success underline decoration-2"
                        : "text-terminal-textSecondary hover:text-terminal-text"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {userId ? (
              <div className="h-10 w-10 flex items-center justify-center">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9",
                    },
                  }}
                />
              </div>
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
