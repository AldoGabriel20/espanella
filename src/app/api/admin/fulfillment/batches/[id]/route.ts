import { NextResponse } from "next/server";
import { getBatch } from "@/lib/api/fulfillment";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/admin/fulfillment/batches/:id */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await getBatch(params.id);
    return NextResponse.json(batch);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
