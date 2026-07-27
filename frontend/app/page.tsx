"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Page, PostSummary } from "@/lib/types";
import { PostRow } from "@/components/post-row";
import {
  EmptyState,
  ErrorState,
  ListSkeleton,
  Pagination,
} from "@/components/ui";

const PAGE_SIZE = 9;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<PostSummary> | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Debounce the search input into the effective search term.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const params = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
  });
  if (search) params.set("search", search);
  const requestKey = `${params.toString()}#${reloadKey}`;

  useEffect(() => {
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

  const loading = loadedKey !== requestKey;

  return (
    <div>
      <section className="pb-10 pt-16 sm:pb-14 sm:pt-24">
        <h1 className="fade-up font-display text-[3.4rem] font-semibold italic leading-[1.02] tracking-tight text-ink sm:text-[5rem]">
          Marginalia<span className="text-accent">.</span>
        </h1>
        <p
          className="fade-up mt-4 max-w-md text-lg leading-relaxed text-muted"
          style={{ animationDelay: "90ms" }}
        >
          Notes written in the margins — essays, sketches, and half-finished
          thoughts, published anyway.
        </p>

        <div
          className="fade-up group relative mt-10 max-w-md"
          style={{ animationDelay: "180ms" }}
        >
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-faint transition-colors group-focus-within:text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3.5 3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the archive…"
            aria-label="Search posts"
            className="w-full border-b border-hairline bg-transparent py-2.5 pl-7 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </div>
      </section>

      <section aria-live="polite">
        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState
            title={error.title}
            detail={error.detail}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            title={search ? "Nothing found" : "No posts yet"}
            detail={
              search
                ? `No posts match “${search}”. Try a different search.`
                : "The margins are still blank. Be the first to write something."
            }
          />
        ) : (
          <>
            {search && (
              <p className="border-b border-hairline pb-3 text-sm text-muted">
                {data.totalElements}{" "}
                {data.totalElements === 1 ? "result" : "results"} for{" "}
                <span className="font-medium text-ink">“{search}”</span>
              </p>
            )}
            {data.content.map((post, i) => (
              <PostRow key={post.id} post={post} index={i} />
            ))}
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              first={data.first}
              last={data.last}
              onPage={(next) => {
                setPage(next);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
