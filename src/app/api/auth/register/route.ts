import { type NextRequest, NextResponse } from "next/server";
import { backendRegister, ApiError } from "@/lib/api/client";
import { setSessionCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  let name: string, email: string, password: string;

  try {
    const body = await request.json();
    name = body.name;
    email = body.email;
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const tokens = await backendRegister({ name, email, password });
    setSessionCookies(tokens);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
