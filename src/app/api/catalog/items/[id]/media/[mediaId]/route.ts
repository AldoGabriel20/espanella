import { NextResponse } from "next/server";
import { deleteMedia } from "@/lib/api/media";
import { normalizeError } from "@/lib/utils/error";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    await deleteMedia(params.id, params.mediaId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
