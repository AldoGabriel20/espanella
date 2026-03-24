import { NextResponse } from "next/server";
import { getBundleById, updateBundle, deleteBundle } from "@/lib/api/bundles";
import { normalizeError } from "@/lib/utils/error";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const bundle = await getBundleById(params.id);
    return NextResponse.json(bundle);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

type BundleLineInput = { itemId: string; quantity: number };

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const bundle = await updateBundle(params.id, {
      name: data.name,
      items: (data.items as BundleLineInput[]).map((line) => ({
        item_id: line.itemId,
        quantity: line.quantity,
      })),
    });
    return NextResponse.json(bundle);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteBundle(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
