import { NextResponse } from "next/server";
import { listBundleMedia } from "@/lib/api/bundleMedia";
import { normalizeError } from "@/lib/utils/error";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const media = await listBundleMedia(params.id);
    return NextResponse.json(media);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
