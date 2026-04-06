import { NextResponse } from "next/server";
import { deleteBundleMedia } from "@/lib/api/bundleMedia";
import { normalizeError } from "@/lib/utils/error";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    await deleteBundleMedia(params.id, params.mediaId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
