import type { AuthorRef } from "./types";

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function authorName(author: AuthorRef): string {
  return author.displayName?.trim() || author.username;
}
