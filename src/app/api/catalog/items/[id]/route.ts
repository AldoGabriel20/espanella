import { NextResponse } from "next/server";
import { getItemById, updateItem, deleteItem } from "@/lib/api/items";
import { normalizeError } from "@/lib/utils/error";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const item = await getItemById(params.id);
    return NextResponse.json(item);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const item = await updateItem(params.id, {
      name: data.name,
      stock: data.stock,
      unit: data.unit,
    });
    return NextResponse.json(item);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteItem(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
