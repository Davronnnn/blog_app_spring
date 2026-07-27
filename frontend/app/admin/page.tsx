"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { ErrorState } from "@/components/ui";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorState title="Couldn't load dashboard" detail={error} onRetry={load} />;
  }

  const cards = stats
    ? [
        { label: "Users", value: stats.userCount },
        { label: "Posts", value: stats.postCount },
        { label: "Comments", value: stats.commentCount },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold italic tracking-tight text-ink">
        Overview
      </h1>
      <p className="mt-1 text-muted">Site-wide totals at a glance.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {(loading ? [0, 1, 2] : cards).map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-hairline bg-white/50 px-6 py-8"
          >
            {loading ? (
              <>
                <div className="skeleton h-3 w-16" />
                <div className="skeleton mt-4 h-10 w-20" />
              </>
            ) : (
              <>
                <p className="text-sm font-medium uppercase tracking-wide text-faint">
                  {(item as { label: string }).label}
                </p>
                <p className="mt-2 font-display text-4xl font-semibold text-accent">
                  {(item as { value: number }).value}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
