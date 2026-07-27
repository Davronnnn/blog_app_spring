"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/posts", label: "Posts" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="fade-up mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-10 sm:flex-row sm:px-8 sm:py-14">
      <aside className="shrink-0 sm:w-48">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-faint">
          Admin
        </p>
        <p className="mt-1 text-sm text-muted">
          {user?.displayName?.trim() || user?.username}
        </p>
        <nav className="mt-6 flex gap-1 sm:flex-col" aria-label="Admin">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-accent-soft/60 hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="link-underline mt-8 inline-block text-sm text-muted"
        >
          ← Back to blog
        </Link>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
