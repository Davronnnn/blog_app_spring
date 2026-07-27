"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";
import type { PostDetail, PostInput } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { PostForm } from "@/components/post-form";
import { ArticleSkeleton } from "@/components/ui";

export default function WritePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <ArticleSkeleton />;

  async function create(input: PostInput) {
    const created = await api<PostDetail>("/api/posts", {
      method: "POST",
      body: input,
    });
    router.push(`/posts/${created.slug}`);
  }

  return (
    <div className="py-12 sm:py-16">
      <p className="mb-8 font-display text-sm italic text-muted">
        A new note in the margins
      </p>
      <PostForm submitLabel="Publish" onSubmit={create} />
    </div>
  );
}
