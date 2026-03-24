import type { Metadata } from "next";
import { BundlesListClient } from "@/components/catalog/BundlesListClient";

export const metadata: Metadata = {
  title: "Bundles",
};

export default function BundlesPage() {
  return <BundlesListClient />;
}
