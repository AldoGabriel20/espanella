import { NextResponse } from "next/server";
import { createBatch, listBatches } from "@/lib/api/fulfillment";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/admin/fulfillment/batches */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const batches = await listBatches({ limit, offset });
    return NextResponse.json(batches);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

/** POST /api/admin/fulfillment/batches */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const batch = await createBatch(payload);
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
