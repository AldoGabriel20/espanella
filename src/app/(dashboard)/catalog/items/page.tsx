import type { Metadata } from "next";
import { ItemsListClient } from "@/components/catalog/ItemsListClient";

export const metadata: Metadata = {
  title: "Items",
};

export default function ItemsPage() {
  return <ItemsListClient />;
}
