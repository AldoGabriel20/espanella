import { NextRequest, NextResponse } from "next/server";
import { publicFetch, ApiError } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await publicFetch("/auth/forgot-password", {
      method: "POST",
      body,
    });
    return NextResponse.json({
      message: "if the email is registered, a reset link has been sent",
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
