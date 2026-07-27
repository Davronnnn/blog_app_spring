"use client";

/* Small shared UI pieces: skeletons, error / empty states, pagination. */

export function PostRowSkeleton() {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-hairline py-8">
      <div className="flex-1 space-y-3">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-6 w-4/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="skeleton hidden h-24 w-36 shrink-0 rounded-lg sm:block" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: rows }).map((_, i) => (
        <PostRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="space-y-4 py-12" aria-busy="true" aria-label="Loading post">
      <div className="skeleton h-3 w-48" />
      <div className="skeleton h-10 w-11/12" />
      <div className="skeleton h-10 w-3/5" />
      <div className="skeleton mt-8 h-56 w-full rounded-xl" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-3/4" />
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="fade-up my-16 border-l-2 border-danger py-2 pl-6">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {detail && <p className="mt-1.5 max-w-prose text-muted">{detail}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="link-underline mt-4 text-sm font-medium text-accent"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="fade-up my-20 text-center">
      <p className="font-display text-3xl italic text-faint">···</p>
      <h2 className="mt-3 font-display text-xl font-semibold text-ink">
        {title}
      </h2>
      {detail && <p className="mx-auto mt-1.5 max-w-md text-muted">{detail}</p>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  first,
  last,
  onPage,
}: {
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="mt-4 flex items-center justify-between py-6"
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={first}
        onClick={() => onPage(page - 1)}
        className="link-underline text-sm font-medium text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        ← Newer
      </button>
      <span className="font-display text-sm italic text-muted">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        disabled={last}
        onClick={() => onPage(page + 1)}
        className="link-underline text-sm font-medium text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        Older →
      </button>
    </nav>
  );
}
