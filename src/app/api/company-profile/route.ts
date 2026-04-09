import { NextResponse } from "next/server";
import { getCompanyProfile } from "@/lib/api/company";
import { normalizeError } from "@/lib/utils/error";

/** GET /api/company-profile — public, no auth required */
export async function GET() {
  try {
    const profile = await getCompanyProfile();
    return NextResponse.json(profile);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
