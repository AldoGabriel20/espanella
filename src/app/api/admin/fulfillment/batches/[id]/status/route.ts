import { NextResponse } from "next/server";
import { updateBatchStatus } from "@/lib/api/fulfillment";
import { normalizeError } from "@/lib/utils/error";

/** PATCH /api/admin/fulfillment/batches/:id/status */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await request.json();
    const batch = await updateBatchStatus(params.id, payload);
    return NextResponse.json(batch);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
