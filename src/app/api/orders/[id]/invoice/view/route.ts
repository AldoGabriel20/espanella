/**
 * GET /api/orders/[id]/invoice/view
 *
 * Proxies the invoice PDF through Next.js so the Supabase storage URL
 * (including the project ID and signed token) is never exposed to the browser.
 * The browser sees only /api/orders/<id>/invoice/view, not the Supabase URL.
 */
import { NextResponse } from "next/server";
import { getInvoice } from "@/lib/api/invoices";
import { normalizeError } from "@/lib/utils/error";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await getInvoice(params.id);
    if (!invoice) {
      return NextResponse.json(
        { message: "No invoice has been generated for this order yet." },
        { status: 404 }
      );
    }

    // Fetch the PDF from Supabase using the short-lived signed URL.
    // This happens server-side — the Supabase URL is never sent to the client.
    const pdfResponse = await fetch(invoice.invoiceUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { message: "Failed to retrieve invoice PDF." },
        { status: 502 }
      );
    }

    const pdfBytes = await pdfResponse.arrayBuffer();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${params.id}.pdf"`,
        // Do not cache — signed URLs expire, and we re-sign on every call.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
