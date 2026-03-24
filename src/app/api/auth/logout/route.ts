import { NextResponse } from "next/server";
import { backendLogout } from "@/lib/api/client";
import { clearSessionCookies } from "@/lib/auth/cookies";

export async function POST() {
  // Best-effort backend invalidation — swallowed inside backendLogout()
  await backendLogout();

  // Always clear cookies regardless of backend response
  clearSessionCookies();

  return NextResponse.json({ ok: true }, { status: 200 });
}
