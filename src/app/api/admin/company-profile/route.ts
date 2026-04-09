import { NextResponse } from "next/server";
import { updateCompanyProfile } from "@/lib/api/company";
import { normalizeError } from "@/lib/utils/error";

/** PUT /api/admin/company-profile — admin only */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const profile = await updateCompanyProfile({
      company_name: data.companyName,
      tagline: data.tagline,
      about: data.about,
      email: data.email ?? null,
      phone: data.phone ?? null,
      whatsapp: data.whatsApp ?? null,
      instagram: data.instagram ?? null,
      tokopedia: data.tokopedia ?? null,
      shopee: data.shopee ?? null,
      address: data.address ?? null,
      hero_images: data.heroImages,
    });
    return NextResponse.json(profile);
  } catch (err) {
    const { status, message } = normalizeError(err);
    return NextResponse.json({ message }, { status });
  }
}
