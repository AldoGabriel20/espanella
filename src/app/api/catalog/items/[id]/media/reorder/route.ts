import { NextResponse } from "next/server";
import { reorderMedia } from "@/lib/api/media";
import { normalizeError } from "@/lib/utils/error";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await reorderMedia(params.id, body.ordered_ids);
    return NextResponse.json({ message: "reordered" });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
