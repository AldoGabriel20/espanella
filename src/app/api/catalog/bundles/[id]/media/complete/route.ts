import { NextResponse } from "next/server";
import { completeBundleMedia } from "@/lib/api/bundleMedia";
import { normalizeError } from "@/lib/utils/error";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const media = await completeBundleMedia(params.id, {
      storage_bucket: body.storage_bucket,
      storage_path: body.storage_path,
      public_url: body.public_url,
      media_type: body.media_type,
      mime_type: body.mime_type,
      file_size_bytes: body.file_size_bytes,
      width: body.width ?? null,
      height: body.height ?? null,
      duration_seconds: body.duration_seconds ?? null,
      alt_text: body.alt_text ?? null,
      is_primary: body.is_primary ?? false,
    });
    return NextResponse.json(media);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
