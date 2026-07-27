"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { authorName, formatDate } from "@/lib/format";
import type { Comment } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { ErrorState } from "./ui";

export function Comments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api<Comment[]>(`/api/posts/${slug}/comments`)
      .then((res) => {
        if (cancelled) return;
        setComments(res);
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
    setComments(null);
    setError(null);
    setReloadKey((k) => k + 1);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await api<Comment>(`/api/posts/${slug}/comments`, {
        method: "POST",
        body: { content },
      });
      setComments((prev) => [...(prev ?? []), created]);
      setDraft("");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? (err.errors?.content ?? err.detail ?? err.title)
          : "Couldn't post your comment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this comment?")) return;
    setDeletingId(id);
    try {
      await api<void>(`/api/comments/${id}`, { method: "DELETE" });
      setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch {
      // keep the comment; a retry is always possible
    } finally {
      setDeletingId(null);
    }
  }

  const count = comments?.length ?? 0;

  return (
    <section className="mt-16 border-t border-hairline pt-10" id="comments">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Comments{comments !== null && ` (${count})`}
      </h2>

      {user ? (
        <form onSubmit={submit} className="mt-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to the conversation…"
            rows={3}
            className="w-full resize-y rounded-lg border border-hairline bg-white/60 px-4 py-3 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
          {submitError && (
            <p className="mt-1.5 text-sm text-danger">{submitError}</p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!draft.trim() || submitting}
              className="inline-flex h-9 items-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-all hover:-translate-y-px hover:bg-accent-deep disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-6 rounded-lg bg-accent-soft px-5 py-4 text-sm text-ink">
          <Link href="/login" className="link-underline font-medium text-accent">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <div className="mt-8">
        {error ? (
          <ErrorState
            title="Couldn't load comments"
            detail={error.detail}
            onRetry={retry}
          />
        ) : comments === null ? (
          <div className="space-y-6" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-40" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-4 font-display italic text-faint">
            No comments yet — the margin is yours.
          </p>
        ) : (
          <ul className="divide-y divide-hairline">
            {comments.map((comment) => {
              const canDelete =
                user &&
                (user.id === comment.author.id || user.role === "ADMIN");
              return (
                <li key={comment.id} className="fade-up py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-sm">
                      <span className="font-medium text-ink">
                        {authorName(comment.author)}
                      </span>
                      <span className="mx-2 text-faint">·</span>
                      <span className="text-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </p>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-xs font-medium text-faint transition-colors hover:text-danger disabled:opacity-40"
                      >
                        {deletingId === comment.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink">
                    {comment.content}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
