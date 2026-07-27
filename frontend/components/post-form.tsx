"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import type { PostDetail, PostInput } from "@/lib/types";
import { Markdown } from "./markdown";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-danger">{message}</p>;
}

export function PostForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: PostDetail;
  submitLabel: string;
  onSubmit: (input: PostInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial?.coverImageUrl ?? "",
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await onSubmit({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        coverImageUrl: coverImageUrl.trim() || null,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setFormError(err.detail ?? err.title);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-hairline bg-white/60 px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="fade-up space-y-7">
      {formError && (
        <div
          role="alert"
          className="border-l-2 border-danger bg-danger/5 py-3 pl-5 pr-4 text-sm text-danger"
        >
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="title" className="sr-only">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border-b border-hairline bg-transparent pb-3 font-display text-3xl font-semibold tracking-tight text-ink outline-none transition-colors placeholder:text-faint focus:border-accent sm:text-4xl"
        />
        <FieldError message={fieldErrors.title} />
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="mb-1.5 block text-sm font-medium text-muted"
        >
          Excerpt
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="One or two sentences shown in the post list."
          rows={2}
          className={`${inputClass} resize-y`}
        />
        <FieldError message={fieldErrors.excerpt} />
      </div>

      <div>
        <label
          htmlFor="coverImageUrl"
          className="mb-1.5 block text-sm font-medium text-muted"
        >
          Cover image URL{" "}
          <span className="font-normal text-faint">(optional)</span>
        </label>
        <input
          id="coverImageUrl"
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
        <FieldError message={fieldErrors.coverImageUrl} />
        {coverImageUrl.trim() && (
          <div className="mt-3 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl.trim()}
              alt="Cover preview"
              className="max-h-56 w-full object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Content</span>
          <div
            className="flex rounded-full border border-hairline p-0.5"
            role="tablist"
            aria-label="Editor mode"
          >
            {(["write", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={tab === mode}
                onClick={() => setTab(mode)}
                className={`rounded-full px-4 py-1 text-sm font-medium capitalize transition-colors ${
                  tab === mode
                    ? "bg-ink text-paper"
                    : "text-muted hover:text-ink"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {tab === "write" ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write in Markdown — headings, **bold**, lists, code blocks, tables…"
            rows={18}
            className={`${inputClass} min-h-96 resize-y font-mono text-[0.9375rem] leading-relaxed`}
          />
        ) : (
          <div className="min-h-96 rounded-lg border border-hairline bg-white/60 px-5 py-4">
            {content.trim() ? (
              <Markdown>{content}</Markdown>
            ) : (
              <p className="font-display italic text-faint">
                Nothing to preview yet.
              </p>
            )}
          </div>
        )}
        <FieldError message={fieldErrors.content} />
      </div>

      <div className="flex justify-end border-t border-hairline pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center rounded-full bg-accent px-7 text-sm font-medium text-paper transition-all hover:-translate-y-px hover:bg-accent-deep disabled:pointer-events-none disabled:opacity-40"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
