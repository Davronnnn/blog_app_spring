"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Page, PostSummary } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  Pagination,
} from "@/components/ui";

const PAGE_SIZE = 10;

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<PostSummary> | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const username = user?.username ?? null;
  const requestKey = username
    ? `${new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        author: username,
      })}#${reloadKey}`
    : null;

  useEffect(() => {
    if (!requestKey) return;
    const [queryString] = requestKey.split("#");
    let cancelled = false;
    api<Page<PostSummary>>(`/api/posts?${queryString}`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err : new ApiError(0, "Error"));
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const fetching = requestKey === null || loadedKey !== requestKey;

  async function deletePost(post: PostSummary) {
    if (!window.confirm(`Delete “${post.title}”? This can't be undone.`)) {
      return;
    }
    setDeletingSlug(post.slug);
    try {
      await api<void>(`/api/posts/${post.slug}`, { method: "DELETE" });
      setReloadKey((k) => k + 1);
    } catch {
      window.alert("Couldn't delete the post. Please try again.");
    } finally {
      setDeletingSlug(null);
    }
  }

  if (loading || !user) {
    return (
      <div className="py-16">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton mt-3 h-4 w-40" />
        <div className="mt-12">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <header className="fade-up border-b border-hairline pb-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {user.displayName?.trim() || user.username}
        </h1>
        <p className="mt-2 text-muted">
          @{user.username}
          <span className="mx-2 text-faint">·</span>
          {user.email}
          <span className="mx-2 text-faint">·</span>
          joined {formatDate(user.createdAt)}
        </p>
        {user.bio && (
          <p className="mt-4 max-w-prose font-display text-lg italic leading-relaxed text-muted">
            {user.bio}
          </p>
        )}
      </header>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Your posts
            {data && (
              <span className="ml-2 text-base font-normal italic text-faint">
                ({data.totalElements})
              </span>
            )}
          </h2>
          <Link
            href="/write"
            className="link-underline text-sm font-medium text-accent"
          >
            Write a new one →
          </Link>
        </div>

        <div className="mt-4">
          {fetching ? (
            <ListSkeleton rows={3} />
          ) : error ? (
            <ErrorState
              title="Couldn't load your posts"
              detail={error.detail}
              onRetry={() => setReloadKey((k) => k + 1)}
            />
          ) : !data || data.content.length === 0 ? (
            <EmptyState
              title="Nothing published yet"
              detail="Your margin is waiting. Write your first post."
            />
          ) : (
            <>
              <ul className="divide-y divide-hairline">
                {data.content.map((post, i) => (
                  <li
                    key={post.id}
                    className="fade-up flex items-start justify-between gap-6 py-6"
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="font-display text-lg font-semibold leading-snug text-ink transition-colors hover:text-accent"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {formatDate(post.createdAt)}
                        <span className="mx-2 text-faint">·</span>
                        {post.commentCount}{" "}
                        {post.commentCount === 1 ? "comment" : "comments"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 pt-1 text-sm">
                      <Link
                        href={`/posts/${post.slug}/edit`}
                        className="link-underline font-medium text-accent"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => deletePost(post)}
                        disabled={deletingSlug === post.slug}
                        className="link-underline font-medium text-danger disabled:opacity-40"
                      >
                        {deletingSlug === post.slug ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={data.number}
                totalPages={data.totalPages}
                first={data.first}
                last={data.last}
                onPage={setPage}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
