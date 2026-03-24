import { NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/api/notifications";
import { normalizeError } from "@/lib/utils/error";

/** POST /api/admin/notifications/test — trigger a test notification */
export async function POST() {
  try {
    const result = await sendTestNotification();
    return NextResponse.json(result);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
