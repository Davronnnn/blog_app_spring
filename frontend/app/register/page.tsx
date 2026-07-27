"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

const FIELDS = [
  {
    name: "displayName",
    label: "Display name",
    type: "text",
    autoComplete: "name",
    placeholder: "How your name appears on posts",
  },
  {
    name: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
    placeholder: "Lowercase, no spaces",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    placeholder: "you@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    placeholder: "At least 8 characters",
  },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<Record<FieldName, string>>({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
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
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        displayName: values.displayName.trim(),
      });
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

  return (
    <div className="fade-up mx-auto max-w-sm py-16 sm:py-24">
      <h1 className="font-display text-4xl font-semibold italic tracking-tight text-ink">
        Join Marginalia<span className="text-accent">.</span>
      </h1>
      <p className="mt-2 text-muted">Claim a corner of the margin.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {formError && (
          <div
            role="alert"
            className="border-l-2 border-danger bg-danger/5 py-3 pl-5 pr-4 text-sm text-danger"
          >
            {formError}
          </div>
        )}

        {FIELDS.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-1.5 block text-sm font-medium text-muted"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              type={field.type}
              value={values[field.name]}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [field.name]: e.target.value,
                }))
              }
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              required
              className="w-full rounded-lg border border-hairline bg-white/60 px-4 py-2.5 text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
            />
            {fieldErrors[field.name] && (
              <p className="mt-1.5 text-sm text-danger">
                {fieldErrors[field.name]}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-medium text-paper transition-all hover:-translate-y-px hover:bg-accent-deep disabled:pointer-events-none disabled:opacity-40"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="link-underline font-medium text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
