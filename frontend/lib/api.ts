import type { AuthResponse } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const TOKEN_KEY = "marginalia.tokens";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: Tokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

/** RFC-7807 ProblemDetail carried as a typed error. */
export class ApiError extends Error {
  status: number;
  title: string;
  detail?: string;
  /** Field → message map for validation failures (HTTP 400). */
  errors?: Record<string, string>;

  constructor(
    status: number,
    title: string,
    detail?: string,
    errors?: Record<string, string>,
  ) {
    super(detail || title);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let title = res.statusText || "Request failed";
  let detail: string | undefined;
  let errors: Record<string, string> | undefined;
  try {
    const body = await res.json();
    if (typeof body?.title === "string") title = body.title;
    if (typeof body?.detail === "string") detail = body.detail;
    if (body?.errors && typeof body.errors === "object") errors = body.errors;
  } catch {
    // non-JSON error body — keep the status text
  }
  return new ApiError(res.status, title, detail, errors);
}

/** Deduplicates concurrent refresh attempts into a single request. */
let refreshInFlight: Promise<Tokens | null> | null = null;

function refreshTokens(): Promise<Tokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const tokens = getTokens();
      if (!tokens?.refreshToken) return null;
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as AuthResponse;
        const next = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
        setTokens(next);
        return next;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const doFetch = async (accessToken?: string): Promise<Response> => {
    try {
      return await fetch(`${API_URL}${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      throw new ApiError(
        0,
        "Network error",
        "Couldn't reach the server. Check that the API is running and try again.",
      );
    }
  };

  const tokens = getTokens();
  let res = await doFetch(tokens?.accessToken);

  if (res.status === 401 && tokens) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      clearTokens();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.assign("/login");
      }
      throw new ApiError(401, "Session expired", "Please sign in again.");
    }
    res = await doFetch(refreshed.accessToken);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
