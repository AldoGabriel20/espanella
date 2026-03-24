import { type NextRequest, NextResponse } from "next/server";
import { backendLogin } from "@/lib/api/client";
import { setSessionCookies } from "@/lib/auth/cookies";
import { ApiError } from "@/lib/api/client";

export async function POST(request: NextRequest) {
  let email: string, password: string;

  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    const tokens = await backendLogin({ email, password });
    setSessionCookies(tokens);

    // Return the redirect destination — client determines where to forward
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      // 401 = wrong credentials, 409 = conflict, etc.
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
