import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/api/notifications";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/admin/notifications — paginated notification log */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const logs = await getNotifications({ limit, offset });
    return NextResponse.json(logs);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
