"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { authorName, formatDate } from "@/lib/format";
import type { PostDetail } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { Comments } from "@/components/comments";
import { Markdown } from "@/components/markdown";
import { ArticleSkeleton, ErrorState } from "@/components/ui";

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<PostDetail>(`/api/posts/${slug}`)
      .then((res) => {
        if (cancelled) return;
        setPost(res);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err : new ApiError(0, "Error"));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  function retry() {
    setPost(null);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  async function deletePost() {
    if (!post) return;
    if (!window.confirm(`Delete “${post.title}”? This can't be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await api<void>(`/api/posts/${post.slug}`, { method: "DELETE" });
      router.push("/");
    } catch {
      setDeleting(false);
      window.alert("Couldn't delete the post. Please try again.");
    }
  }

  if (error) {
    return (
      <div className="py-10">
        <ErrorState
          title={error.status === 404 ? "Post not found" : error.title}
          detail={
            error.status === 404
              ? "This page may have been moved or deleted."
              : error.detail
          }
          onRetry={error.status === 404 ? undefined : retry}
        />
        <Link href="/" className="link-underline text-sm font-medium text-accent">
          ← Back to all posts
        </Link>
      </div>
    );
  }

  if (!post) return <ArticleSkeleton />;

  const isAuthor = user?.id === post.author.id;

  return (
    <article className="fade-up py-12 sm:py-16">
      <header>
        <p className="text-[0.8125rem] tracking-wide text-muted">
          <span className="font-medium text-ink">
            {authorName(post.author)}
          </span>
          <span className="mx-2 text-faint">·</span>
          {formatDate(post.createdAt)}
          {post.updatedAt !== post.createdAt && (
            <>
              <span className="mx-2 text-faint">·</span>
              <span className="italic">
                updated {formatDate(post.updatedAt)}
              </span>
            </>
          )}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-ink sm:text-[2.9rem]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 font-display text-lg italic leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}

        {isAuthor && (
          <div className="mt-6 flex items-center gap-4 border-y border-hairline py-3 text-sm">
            <span className="text-faint">Your post</span>
            <Link
              href={`/posts/${post.slug}/edit`}
              className="link-underline font-medium text-accent"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={deletePost}
              disabled={deleting}
              className="link-underline font-medium text-danger disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </header>

      {post.coverImageUrl && (
        <div className="mt-10 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt=""
            className="max-h-[480px] w-full object-cover"
          />
        </div>
      )}

      <div className="mt-10">
        <Markdown>{post.content}</Markdown>
      </div>

      <Comments slug={post.slug} />
    </article>
  );
}
