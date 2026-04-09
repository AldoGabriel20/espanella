/**
 * GET /api/admin/financial-report?from=YYYY-MM-DD&to=YYYY-MM-DD&format=pdf|excel
 *
 * Proxies the financial report download from the backend.
 * Returns the file directly to the browser as a download.
 */
import { NextResponse } from "next/server";
import { getAccessToken, getRefreshToken, setSessionCookies } from "@/lib/auth/cookies";
import { normalizeError } from "@/lib/utils/error";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080/api/v1";

async function fetchWithAuth(path: string, token: string): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rt }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const now = Math.floor(Date.now() / 1000);
  setSessionCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpiresAt: now + data.expires_in,
  });
  return data.access_token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format") ?? "pdf";

    if (!from || !to) {
      return NextResponse.json(
        { message: "from and to query params are required" },
        { status: 400 }
      );
    }
    if (format !== "pdf" && format !== "excel") {
      return NextResponse.json(
        { message: "format must be 'pdf' or 'excel'" },
        { status: 400 }
      );
    }

    let token = getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const backendPath = `/admin/financial-report?from=${from}&to=${to}&format=${format}`;
    let backendRes = await fetchWithAuth(backendPath, token);

    // Retry once after transparent token refresh on 401.
    if (backendRes.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      backendRes = await fetchWithAuth(backendPath, newToken);
    }

    if (!backendRes.ok) {
      const body = await backendRes.text();
      return NextResponse.json(
        { message: body || `Backend error ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    const bytes = await backendRes.arrayBuffer();

    const contentType =
      format === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    const ext = format === "excel" ? "xlsx" : "pdf";
    const filename = `financial-report-${from}-${to}.${ext}`;

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
