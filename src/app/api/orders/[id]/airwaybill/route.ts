import { NextResponse } from "next/server";
import { updateAirwaybill } from "@/lib/api/orders";
import { normalizeError } from "@/lib/utils/error";

/** PATCH /api/orders/[id]/airwaybill — set airwaybill number and courier (admin) */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const order = await updateAirwaybill(params.id, {
      airwaybill_number: data.airwaybill_number ?? null,
      courier: data.courier ?? null,
    });
    return NextResponse.json(order);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
