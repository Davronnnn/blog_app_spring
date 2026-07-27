"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Page, PostSummary } from "@/lib/types";
import { ErrorState, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function AdminPostsPage() {
  const [page, setPage] = useState<Page<PostSummary> | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [pageNum, setPageNum] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(pageNum), size: "20" });
    if (query) params.set("search", query);
    api<Page<PostSummary>>(`/api/posts?${params}`)
      .then(setPage)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [pageNum, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function removePost(slug: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeleting(slug);
    try {
      await api(`/api/posts/${slug}`, { method: "DELETE" });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold italic tracking-tight text-ink">
        Posts
      </h1>
      <p className="mt-1 text-muted">Moderate and remove published articles.</p>

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
          placeholder="Search title or excerpt…"
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
        <ErrorState title="Couldn't load posts" detail={error} onRetry={load} />
      ) : loading ? (
        <div className="mt-8 space-y-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto rounded-xl border border-hairline">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-accent-soft/40 text-xs uppercase tracking-wide text-faint">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Comments</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {page?.content.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-hairline/70 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <p className="mt-0.5 line-clamp-1 text-muted">
                          {post.excerpt}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {post.author.displayName || post.author.username}
                    </td>
                    <td className="px-4 py-3 text-muted">{post.commentCount}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/posts/${post.slug}/edit`}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deleting === post.slug}
                          onClick={() => removePost(post.slug, post.title)}
                          className="text-xs font-medium text-danger hover:underline disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
