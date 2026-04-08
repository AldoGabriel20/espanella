import { NextResponse } from "next/server";
import { getInvoice, generateInvoice } from "@/lib/api/invoices";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/orders/[id]/invoice — fetch a fresh (5-min) signed URL for the invoice */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await getInvoice(params.id);
    if (!invoice) {
      return NextResponse.json(
        { message: "no invoice generated for this order yet" },
        { status: 404 }
      );
    }
    return NextResponse.json(invoice);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

/** POST /api/orders/[id]/invoice — generate (or regenerate) invoice (admin only) */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await generateInvoice(params.id);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
