import { NextResponse } from "next/server";
import { getBundles, createBundle } from "@/lib/api/bundles";
import { normalizeError } from "@/lib/utils/error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;

    const bundles = await getBundles({ limit, offset });
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
