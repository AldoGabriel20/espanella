import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/auth/cookies";
import { normalizeError } from "@/lib/utils/error";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080/api/v1";

/** POST /api/admin/company-profile/hero-image — admin only, multipart/form-data */
export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken();
    const formData = await request.formData();

    const res = await fetch(`${BACKEND_URL}/admin/company-profile/hero-image`, {
      method: "POST",
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: formData,
    });

    const body = await res.json().catch(() => ({ message: "Upload failed" }));
    if (!res.ok) {
      return NextResponse.json(
        { message: body.error ?? body.message ?? "Upload failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(body);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
