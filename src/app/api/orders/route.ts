import { NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/api/orders";
import { normalizeError } from "@/lib/utils/error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;
    const status = searchParams.get("status") as import("@/types").OrderStatus | null;
    const search = searchParams.get("search") ?? undefined;
    const delivery_date_from = searchParams.get("delivery_date_from") ?? undefined;
    const delivery_date_to = searchParams.get("delivery_date_to") ?? undefined;

    const orders = await getOrders({
      limit,
      offset,
      ...(status ? { status } : {}),
      search,
      delivery_date_from,
      delivery_date_to,
    });
    return NextResponse.json(orders);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

type DraftLine = {
  type: "item" | "bundle";
  sourceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const order = await createOrder({
      customer_name: data.customerName,
      phone: data.phone,
      delivery_date: data.deliveryDate,
      delivery_amount: data.deliveryAmount,
      items: (data.lines as DraftLine[]).map((line) => ({
        item_id: line.type === "item" ? line.sourceId : undefined,
        bundle_id: line.type === "bundle" ? line.sourceId : undefined,
        line_name: line.name,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      })),
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
