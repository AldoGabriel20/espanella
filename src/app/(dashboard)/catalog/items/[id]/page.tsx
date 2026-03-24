import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { ItemDetailClient } from "@/components/catalog/ItemDetailClient";

export const metadata: Metadata = {
  title: "Item Detail",
};

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const user = await requireSession();
  return <ItemDetailClient id={params.id} isAdmin={user.role === "admin"} />;
}
