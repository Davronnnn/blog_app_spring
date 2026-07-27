"use client";

import Link from "next/link";
import { authorName, formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";

export function PostRow({
  post,
  index = 0,
}: {
  post: PostSummary;
  index?: number;
}) {
  return (
    <article
      className="fade-up border-b border-hairline"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Link
        href={`/posts/${post.slug}`}
        className="group flex items-start justify-between gap-6 py-8"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] tracking-wide text-muted">
            <span className="font-medium text-ink">
              {authorName(post.author)}
            </span>
            <span className="mx-2 text-faint">·</span>
            {formatDate(post.createdAt)}
            <span className="mx-2 text-faint">·</span>
            {post.commentCount}{" "}
            {post.commentCount === 1 ? "comment" : "comments"}
          </p>
          <h2 className="mt-2 font-display text-[1.45rem] font-semibold leading-snug tracking-tight text-ink transition-colors duration-200 group-hover:text-accent">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 leading-relaxed text-muted">
              {post.excerpt}
            </p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
            Read
            <span
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            >
              →
            </span>
          </span>
        </div>

        {post.coverImageUrl && (
          <div className="mt-1 hidden h-24 w-36 shrink-0 overflow-hidden rounded-lg sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
      </Link>
    </article>
  );
}
