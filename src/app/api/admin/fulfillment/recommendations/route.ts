import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/api/fulfillment";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/admin/fulfillment/recommendations */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recs = await getRecommendations({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      includePending: searchParams.get("include_pending") === "true",
      maxBatchSize: searchParams.get("max_batch_size")
        ? Number(searchParams.get("max_batch_size"))
        : undefined,
      maxUnits: searchParams.get("max_units")
        ? Number(searchParams.get("max_units"))
        : undefined,
    });
    return NextResponse.json(recs);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
