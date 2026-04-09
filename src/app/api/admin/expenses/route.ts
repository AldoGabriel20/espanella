import { NextResponse } from "next/server";
import { getExpenses, createExpense } from "@/lib/api/expenses";
import { normalizeError } from "@/lib/utils/error";
import type { ExpenseListParams } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params: ExpenseListParams = {
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
      date_from: searchParams.get("date_from") ?? undefined,
      date_to: searchParams.get("date_to") ?? undefined,
      marketplace: searchParams.get("marketplace") ?? undefined,
      payment_type: searchParams.get("payment_type") ?? undefined,
    };
    const result = await getExpenses(params);
    return NextResponse.json(result);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const expense = await createExpense({
      expense_date: data.expenseDate,
      marketplace: data.marketplace,
      store_name: data.storeName ?? null,
      item_name: data.itemName,
      quantity: data.quantity,
      final_price: data.finalPrice,
      payment_type: data.paymentType,
      notes: data.notes ?? null,
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
