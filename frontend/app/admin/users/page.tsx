"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminUser, Page } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { ErrorState, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [page, setPage] = useState<Page<AdminUser> | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [pageNum, setPageNum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(pageNum), size: "20" });
    if (query) params.set("search", query);
    api<Page<AdminUser>>(`/api/admin/users?${params}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [pageNum, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRole(u: AdminUser) {
    if (u.id === me?.id) return;
    const next = u.role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Set ${u.username} to ${next}?`)) return;
    setBusyId(u.id);
    try {
      await api(`/api/admin/users/${u.id}/role`, {
        method: "PATCH",
        body: { role: next },
      });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(u: AdminUser) {
    if (u.id === me?.id) return;
    if (!confirm(`Delete user "${u.username}" and all their posts?`)) return;
    setBusyId(u.id);
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold italic tracking-tight text-ink">
        Users
      </h1>
      <p className="mt-1 text-muted">Manage accounts and roles.</p>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPageNum(0);
          setQuery(search.trim());
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username or email…"
          className="min-w-0 flex-1 rounded-lg border border-hairline bg-white/60 px-4 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-paper hover:bg-accent-deep"
        >
          Search
        </button>
      </form>

      {error ? (
        <ErrorState title="Couldn't load users" detail={error} onRetry={load} />
      ) : loading ? (
        <div className="mt-8 space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-xl border border-hairline">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-accent-soft/40 text-xs uppercase tracking-wide text-faint">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Posts</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {page?.content.map((u) => {
                  const isSelf = u.id === me?.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-hairline/70 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">
                          {u.displayName || u.username}
                          {isSelf && (
                            <span className="ml-2 text-xs text-faint">(you)</span>
                          )}
                        </p>
                        <p className="text-muted">@{u.username} · {u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-accent text-paper"
                              : "bg-hairline text-muted"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{u.postCount}</td>
                      <td className="px-4 py-3 text-muted">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isSelf || busyId === u.id}
                            onClick={() => toggleRole(u)}
                            className="text-xs font-medium text-accent hover:underline disabled:opacity-40"
                          >
                            {u.role === "ADMIN" ? "Demote" : "Make admin"}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || busyId === u.id}
                            onClick={() => removeUser(u)}
                            className="text-xs font-medium text-danger hover:underline disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {page && (
            <Pagination
              page={page.number}
              totalPages={page.totalPages}
              first={page.first}
              last={page.last}
              onPage={setPageNum}
            />
          )}
        </>
      )}
    </div>
  );
}
