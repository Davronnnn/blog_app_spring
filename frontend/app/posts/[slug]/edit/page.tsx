"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PostDetail, PostInput } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { PostForm } from "@/components/post-form";
import { ArticleSkeleton, ErrorState } from "@/components/ui";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

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

  if (error) {
    return (
      <div className="py-10">
        <ErrorState title={error.title} detail={error.detail} onRetry={retry} />
      </div>
    );
  }

  if (loading || !user || !post) return <ArticleSkeleton />;

  if (post.author.id !== user.id) {
    return (
      <div className="py-10">
        <ErrorState
          title="Not your post"
          detail="Only the author can edit this post."
        />
        <Link
          href={`/posts/${post.slug}`}
          className="link-underline text-sm font-medium text-accent"
        >
          ← Back to the post
        </Link>
      </div>
    );
  }

  async function save(input: PostInput) {
    const updated = await api<PostDetail>(`/api/posts/${slug}`, {
      method: "PUT",
      body: input,
    });
    router.push(`/posts/${updated.slug}`);
  }

  return (
    <div className="py-12 sm:py-16">
      <p className="mb-8 font-display text-sm italic text-muted">
        Editing “{post.title}”
      </p>
      <PostForm initial={post} submitLabel="Save changes" onSubmit={save} />
    </div>
  );
}
