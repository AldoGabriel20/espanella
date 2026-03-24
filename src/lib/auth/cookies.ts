/**
 * Session cookie utilities for Leuzien BFF auth.
 *
 * All token storage is server-side only via HttpOnly, Secure, SameSite=Lax cookies.
 * Client components never receive raw token values.
 */

import { cookies } from "next/headers";

// Cookie names
const ACCESS_TOKEN_COOKIE = "lz_access_token";
const REFRESH_TOKEN_COOKIE = "lz_refresh_token";
const ACCESS_EXPIRY_COOKIE = "lz_access_exp";

const isProd = process.env.NODE_ENV === "production";

// Max cookie ages in seconds
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes (aligned with backend default)
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp (seconds) when the access token expires */
  accessExpiresAt: number;
};

/**
 * Write access + refresh tokens into secure HttpOnly cookies.
 */
export function setSessionCookies(tokens: TokenPair): void {
  const cookieStore = cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  cookieStore.set(ACCESS_EXPIRY_COOKIE, String(tokens.accessExpiresAt), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Read the stored access token. Returns null if absent.
 */
export function getAccessToken(): string | null {
  return cookies().get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Read the stored refresh token. Returns null if absent.
 */
export function getRefreshToken(): string | null {
  return cookies().get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Returns true if a session exists (access token cookie is present).
 */
export function hasSession(): boolean {
  return Boolean(cookies().get(ACCESS_TOKEN_COOKIE)?.value);
}

/**
 * Clear all session cookies. Call this on logout or failed refresh.
 */
export function clearSessionCookies(): void {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(ACCESS_EXPIRY_COOKIE);
}

/**
 * Decode the numeric Unix expiry from the expiry cookie.
 * Returns null if absent or unparseable.
 */
export function getAccessTokenExpiry(): number | null {
  const raw = cookies().get(ACCESS_EXPIRY_COOKIE)?.value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
