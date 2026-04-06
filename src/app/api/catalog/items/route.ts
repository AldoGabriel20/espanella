import { NextResponse } from "next/server";
import { getItems, createItem, type ItemsListParams } from "@/lib/api/items";
import { normalizeError } from "@/lib/utils/error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const sortBy = (searchParams.get("sort_by") as ItemsListParams["sortBy"]) ?? undefined;
    const minPrice = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined;
    const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
    const inStock = searchParams.get("in_stock") === "true" ? true : undefined;

    const items = await getItems({ limit, offset, sortBy, minPrice, maxPrice, inStock });
    return NextResponse.json(items);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await createItem({
      name: data.name,
      description: data.description,
      stock: data.stock,
      unit: data.unit,
      price: data.price ?? 0,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
