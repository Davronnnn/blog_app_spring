"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      await login(username.trim(), password);
      router.push("/");
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
    <div className="fade-up mx-auto max-w-sm py-16 sm:py-24">
      <h1 className="font-display text-4xl font-semibold italic tracking-tight text-ink">
        Welcome back<span className="text-accent">.</span>
      </h1>
      <p className="mt-2 text-muted">Sign in to keep writing.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {formError && (
          <div
            role="alert"
            className="border-l-2 border-danger bg-danger/5 py-3 pl-5 pr-4 text-sm text-danger"
          >
            {formError}
          </div>
        )}

        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-muted"
          >
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className={inputClass}
          />
          {fieldErrors.username && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.username}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-muted"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={inputClass}
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-sm text-danger">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-paper transition-all hover:-translate-y-px hover:bg-accent-deep disabled:pointer-events-none disabled:opacity-40"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        New here?{" "}
        <Link
          href="/register"
          className="link-underline font-medium text-accent"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
