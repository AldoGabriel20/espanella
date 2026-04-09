import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyProfile } from "@/types";

const companyKeys = {
  profile: ["company", "profile"] as const,
};

async function fetchCompanyProfile(): Promise<CompanyProfile> {
  const res = await fetch("/api/company-profile");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to load company profile" }));
    throw new Error(err.message ?? "Failed to load company profile");
  }
  return res.json();
}

type UpdateBody = {
  companyName?: string;
  tagline?: string;
  about?: string;
  email?: string | null;
  phone?: string | null;
  whatsApp?: string | null;
  instagram?: string | null;
  tokopedia?: string | null;
  shopee?: string | null;
  address?: string | null;
  heroImages?: string[];
};

async function putCompanyProfile(body: UpdateBody): Promise<CompanyProfile> {
  const res = await fetch("/api/admin/company-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to update company profile" }));
    throw new Error(err.message ?? "Failed to update company profile");
  }
  return res.json();
}

export function useCompanyProfile() {
  return useQuery({
    queryKey: companyKeys.profile,
    queryFn: fetchCompanyProfile,
    staleTime: 60_000, // company profile rarely changes
    retry: false,
  });
}

export function useUpdateCompanyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: putCompanyProfile,
    onSuccess: (data) => {
      qc.setQueryData(companyKeys.profile, data);
    },
  });
}
