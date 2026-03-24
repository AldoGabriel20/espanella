/**
 * Session resolver — server-side only.
 *
 * getSession() fetches the current user from GET /auth/me using the stored
 * access token. Returns null when unauthenticated, never throws to callers.
 *
 * Use this in Server Components and Server Actions to read the active user.
 * Never call it from client components.
 */

import { hasSession } from "@/lib/auth/cookies";
import { apiFetch } from "@/lib/api/client";
import type { User } from "@/types";

// Raw backend response from GET /auth/me (snake_case from auth DTO)
type MeResponse = {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

function adaptUser(raw: MeResponse): User {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    role: raw.role,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Returns the current authenticated User, or null if no session exists.
 * Transparently refreshes on 401 (handled inside apiFetch).
 */
export async function getSession(): Promise<User | null> {
  if (!hasSession()) return null;
  try {
    const data = await apiFetch<MeResponse>("/auth/me");
    return adaptUser(data);
  } catch {
    return null;
  }
}

/**
 * Returns the current user. If unauthenticated, redirects to /login.
 * Use in protected Server Components and layouts.
 */
export async function requireSession(): Promise<User> {
  const { redirect } = await import("next/navigation");
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return user as User;
}

/**
 * Returns the current user. If not admin, redirects to /dashboard.
 * Use in admin-only Server Components and layouts.
 */
export async function requireAdmin(): Promise<User> {
  const { redirect } = await import("next/navigation");
  const user = await requireSession();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
