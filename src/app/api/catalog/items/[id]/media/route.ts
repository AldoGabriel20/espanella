import { NextResponse } from "next/server";
import { listMedia } from "@/lib/api/media";
import { normalizeError } from "@/lib/utils/error";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const media = await listMedia(params.id);
    return NextResponse.json(media);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
