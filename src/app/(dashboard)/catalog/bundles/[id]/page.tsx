import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { BundleDetailClient } from "@/components/catalog/BundleDetailClient";

export const metadata: Metadata = {
  title: "Bundle Detail",
};

export default async function BundleDetailPage({ params }: { params: { id: string } }) {
  const user = await requireSession();
  return <BundleDetailClient id={params.id} isAdmin={user.role === "admin"} />;
}
