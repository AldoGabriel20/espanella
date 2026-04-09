import { NextResponse } from "next/server";
import { getFinancialSummary } from "@/lib/api/expenses";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/admin/financial-summary?from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { message: "from and to query params are required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }
    const summary = await getFinancialSummary(from, to);
    return NextResponse.json(summary);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
