import { NextResponse } from "next/server";
import { getExpenseById, updateExpense, deleteExpense } from "@/lib/api/expenses";
import { normalizeError } from "@/lib/utils/error";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const expense = await getExpenseById(params.id);
    return NextResponse.json(expense);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const data = await request.json();
    const expense = await updateExpense(params.id, {
      expense_date: data.expenseDate,
      marketplace: data.marketplace,
      store_name: data.storeName ?? null,
      item_name: data.itemName,
      quantity: data.quantity,
      final_price: data.finalPrice,
      payment_type: data.paymentType,
      notes: data.notes ?? null,
    });
    return NextResponse.json(expense);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await deleteExpense(params.id);
    return NextResponse.json({ message: "deleted" });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
