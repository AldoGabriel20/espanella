import { NextResponse } from "next/server";
import { getItems, createItem } from "@/lib/api/items";
import { normalizeError } from "@/lib/utils/error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;

    const items = await getItems({ limit, offset });
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
      stock: data.stock,
      unit: data.unit,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
