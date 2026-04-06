import { NextResponse } from "next/server";
import { getBundles, createBundle } from "@/lib/api/bundles";
import { normalizeError } from "@/lib/utils/error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const sortBy = searchParams.get("sort_by") ?? undefined;
    const minPrice = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined;
    const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
    const inStockRaw = searchParams.get("in_stock");
    const inStock = inStockRaw !== null ? inStockRaw === "true" : undefined;

    const bundles = await getBundles({ limit, offset, sortBy, minPrice, maxPrice, inStock });
    return NextResponse.json(bundles);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

type BundleLineInput = { itemId: string; quantity: number };

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const bundle = await createBundle({
      name: data.name,
      description: data.description,
      price: typeof data.price === "number" ? data.price : undefined,
      stock: typeof data.stock === "number" ? data.stock : undefined,
      items: (data.items as BundleLineInput[]).map((line) => ({
        item_id: line.itemId,
        quantity: line.quantity,
      })),
    });
    return NextResponse.json(bundle, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
