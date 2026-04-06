import { NextResponse } from "next/server";
import { setPrimaryBundleMedia } from "@/lib/api/bundleMedia";
import { normalizeError } from "@/lib/utils/error";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    await setPrimaryBundleMedia(params.id, params.mediaId);
    return NextResponse.json({ message: "primary set" });
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
