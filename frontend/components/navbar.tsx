"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./auth-provider";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-paper/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-display text-[1.4rem] font-semibold italic tracking-tight text-ink transition-colors hover:text-accent"
        >
          Marginalia<span className="text-accent">.</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/write"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-paper transition-all hover:-translate-y-px hover:bg-accent-deep"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M11.5 2.5l2 2L6 12l-2.75.75L4 10l7.5-7.5z" />
            </svg>
            Write
          </Link>

          {loading ? (
            <div className="skeleton h-9 w-20 rounded-full" />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-9 items-center gap-2 rounded-full border border-hairline bg-paper pl-1.5 pr-3 text-sm font-medium text-ink transition-colors hover:border-faint"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft font-display text-xs font-semibold text-accent">
                  {(user.displayName?.trim() || user.username)
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <span className="max-w-28 truncate">{user.username}</span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-hairline bg-paper shadow-lg shadow-ink/5 fade-up">
                    <Link
                      href="/me"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-accent-soft"
                    >
                      My profile
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-accent-soft"
                      >
                        Admin panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-accent-soft"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/login"
                className="link-underline px-2 py-1 text-sm font-medium text-ink"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden h-9 items-center rounded-full border border-ink px-4 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
