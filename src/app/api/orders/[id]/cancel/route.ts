import { NextResponse } from "next/server";
import { cancelOrder } from "@/lib/api/orders";
import { normalizeError } from "@/lib/utils/error";

/** POST /api/orders/[id]/cancel — cancel a pending/confirmed order */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const order = await cancelOrder(params.id);
    return NextResponse.json(order);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
