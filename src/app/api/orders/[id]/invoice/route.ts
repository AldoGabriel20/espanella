import { NextResponse } from "next/server";
import { getInvoice, generateInvoice } from "@/lib/api/invoices";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/orders/[id]/invoice — fetch existing invoice URL (null if not yet generated) */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await getInvoice(params.id);
    return NextResponse.json(invoice); // null → JSON null → client handles empty state
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

/** POST /api/orders/[id]/invoice — generate (or regenerate) invoice */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await generateInvoice(params.id);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
