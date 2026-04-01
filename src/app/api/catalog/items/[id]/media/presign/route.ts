import { NextResponse } from "next/server";
import { presignMedia } from "@/lib/api/media";
import { normalizeError } from "@/lib/utils/error";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await presignMedia(params.id, {
      filename: body.filename,
      content_type: body.content_type,
      size_bytes: body.size_bytes,
      media_type: body.media_type,
    });
    return NextResponse.json(result);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
