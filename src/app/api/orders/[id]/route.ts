import { NextResponse } from "next/server";
import { getOrderById, deleteOrder, updateOrderStatus, updateOrder } from "@/lib/api/orders";
import { normalizeError } from "@/lib/utils/error";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id);
    return NextResponse.json(order);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

/** PATCH /api/orders/[id] — update order status (admin) */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const order = await updateOrderStatus(params.id, { status: data.status });
    return NextResponse.json(order);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

/** PUT /api/orders/[id] — full order edit: delivery date, fee, items (admin) */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const order = await updateOrder(params.id, {
      delivery_date: data.delivery_date,
      delivery_amount: data.delivery_amount,
      items: data.items,
    });
    return NextResponse.json(order);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteOrder(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
