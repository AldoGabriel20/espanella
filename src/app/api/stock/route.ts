import { NextResponse } from "next/server";
import { getStockMovements } from "@/lib/api/stock";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/stock — global stock movement audit list */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const movements = await getStockMovements({ limit, offset });
    return NextResponse.json(movements);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
