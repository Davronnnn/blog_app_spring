"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { AdminShell } from "./admin-shell";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton mt-8 h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return <AdminShell>{children}</AdminShell>;
}
