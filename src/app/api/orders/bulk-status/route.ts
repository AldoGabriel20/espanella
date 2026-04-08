import { NextResponse } from "next/server";
import { bulkUpdateOrderStatus } from "@/lib/api/orders";
import { normalizeError } from "@/lib/utils/error";

/** POST /api/orders/bulk-status — update status of multiple orders at once (admin) */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await bulkUpdateOrderStatus({
      ids: data.ids as string[],
      status: data.status,
    });
    return NextResponse.json(result);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
