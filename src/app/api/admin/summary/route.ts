import { NextResponse } from "next/server";
import { getAdminSummary } from "@/lib/api/admin";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/admin/summary — aggregate dashboard counts */
export async function GET() {
  try {
    const summary = await getAdminSummary();
    return NextResponse.json(summary);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
