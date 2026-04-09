/**
 * Company profile API module.
 *
 * GET /api/company-profile  — public, no auth
 * PUT /api/admin/company-profile — admin only
 */

import { apiFetch } from "./client";
import { RawCompanyProfileSchema } from "./schemas";
import { adaptCompanyProfile } from "./adapters";
import type { CompanyProfile } from "@/types";

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const raw = await apiFetch<unknown>("/company-profile");
  return adaptCompanyProfile(RawCompanyProfileSchema.parse(raw));
}

export type UpdateCompanyProfileBody = {
  company_name?: string;
  tagline?: string;
  about?: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  tokopedia?: string | null;
  shopee?: string | null;
  address?: string | null;
  hero_images?: string[];
};

export async function updateCompanyProfile(
  body: UpdateCompanyProfileBody
): Promise<CompanyProfile> {
  const raw = await apiFetch<unknown>("/admin/company-profile", {
    method: "PUT",
    body,
  });
  return adaptCompanyProfile(RawCompanyProfileSchema.parse(raw));
}
