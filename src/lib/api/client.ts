/**
 * Backend API client for authenticated server-side requests.
 *
 * This module is used ONLY from Server Components, Route Handlers, and
 * Server Actions. Never import it from client components.
 *
 * Responsibilities:
 * - Attach Authorization: Bearer <access_token> to every outgoing request
 * - On 401: attempt one token refresh, rotate cookies, and retry once
 * - On refresh failure: clear cookies and redirect to /login
 */

import { redirect } from "next/navigation";
import {
  getAccessToken,
  getRefreshToken,
  setSessionCookies,
  clearSessionCookies,
  type TokenPair,
} from "@/lib/auth/cookies";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Raw backend response shapes (snake_case from auth / invoice) ────────────

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds until access token expires
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

// ─── Refresh logic ───────────────────────────────────────────────────────────

/**
 * Attempt to refresh the token pair using the stored refresh token.
 * On success, rotates cookies and returns the new access token.
 * On failure, clears cookies and redirects to /login.
 */
async function refreshTokens(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSessionCookies();
    redirect("/login");
  }

  const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!res.ok) {
    clearSessionCookies();
    redirect("/login");
  }

  const data: RefreshResponse = await res.json();
  const now = Math.floor(Date.now() / 1000);
  const tokens: TokenPair = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpiresAt: now + data.expires_in,
  };
  setSessionCookies(tokens);
  return data.access_token;
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/**
 * Make an authenticated request to the Go backend.
 * Automatically retries once after a transparent token refresh on 401.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
  retried = false
): Promise<T> {
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 401 && !retried) {
    // Attempt one transparent refresh, then retry the original request.
    await refreshTokens();
    return apiFetch<T>(path, options, true);
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let details: string | undefined;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
      details = body.details;
    } catch {
      // Response body may not be JSON
    }
    throw new ApiError(res.status, message, details);
  }

  // 204 No Content — return empty object
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// ─── Unauthenticated fetch (for login/register) ──────────────────────────────

/**
 * Make a request without attaching an auth token.
 * Used for login and register endpoints.
 */
export async function publicFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let details: string | undefined;
    try {
      const body = await res.json();
      message = body.error ?? body.message ?? message;
      details = body.details;
    } catch {
      // swallow
    }
    throw new ApiError(res.status, message, details);
  }

  return res.json() as Promise<T>;
}

// ─── Auth convenience methods ─────────────────────────────────────────────────

type AuthCredentials = { email: string; password: string };
type RegisterBody = AuthCredentials & { name: string };

/**
 * POST /auth/login — returns a token pair.
 */
export async function backendLogin(
  credentials: AuthCredentials
): Promise<TokenPair> {
  const data = await publicFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
  const now = Math.floor(Date.now() / 1000);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpiresAt: now + data.expires_in,
  };
}

/**
 * POST /auth/register — returns a token pair.
 */
export async function backendRegister(
  body: RegisterBody
): Promise<TokenPair> {
  const data = await publicFetch<LoginResponse>("/auth/register", {
    method: "POST",
    body,
  });
  const now = Math.floor(Date.now() / 1000);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpiresAt: now + data.expires_in,
  };
}

/**
 * POST /auth/logout — calls the backend to invalidate the refresh token.
 * Swallows errors so cookie cleanup always proceeds.
 */
export async function backendLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });
  } catch {
    // Backend logout failure should not block local cookie cleanup
  }
}
