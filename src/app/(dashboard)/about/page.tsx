import type { Metadata } from "next";
import AboutClient from "@/components/layout/AboutClient";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return <AboutClient />;
}
