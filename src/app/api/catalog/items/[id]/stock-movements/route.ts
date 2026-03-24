import { NextResponse } from "next/server";
import { getItemStockMovements } from "@/lib/api/stock";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/catalog/items/[id]/stock-movements — item drill-down */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const movements = await getItemStockMovements(params.id, { limit, offset });
    return NextResponse.json(movements);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
