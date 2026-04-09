"use client";

import Link from "next/link";
import { Instagram, MessageCircle, ShoppingBag, Mail, Phone, MapPin, Leaf } from "lucide-react";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";

export function Footer() {
  const { data: profile } = useCompanyProfile();

  const companyName = profile?.companyName ?? "Leuzien";
  const tagline = profile?.tagline ?? "Hampers & Gifts, Made with Love";

  return (
    <footer className="border-t bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[hsl(var(--sidebar-ring))]" />
              <span className="font-semibold text-lg">{companyName}</span>
            </div>
            <p className="text-sm text-[hsl(var(--sidebar-foreground)/0.7)] leading-relaxed">
              {tagline}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--sidebar-ring))]">
              Quick Links
            </h4>
            <nav className="space-y-2 text-sm">
              <Link href="/dashboard" className="block opacity-75 hover:opacity-100 transition-opacity">
                Dashboard
              </Link>
              <Link href="/catalog/items" className="block opacity-75 hover:opacity-100 transition-opacity">
                Catalog
              </Link>
              <Link href="/orders" className="block opacity-75 hover:opacity-100 transition-opacity">
                My Orders
              </Link>
              <Link href="/about" className="block opacity-75 hover:opacity-100 transition-opacity">
                About Us
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--sidebar-ring))]">
              Contact
            </h4>
            <div className="space-y-2 text-sm opacity-80">
              {profile?.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {profile.phone}
                </a>
              )}
              {profile?.whatsApp && (
                <a
                  href={`https://wa.me/${profile.whatsApp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  WhatsApp
                </a>
              )}
              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {profile.email}
                </a>
              )}
              {profile?.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity"
                >
                  <Instagram className="h-4 w-4 shrink-0" />
                  {profile.instagram}
                </a>
              )}
              {(profile?.tokopedia || profile?.shopee) && (
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>
                    {[profile?.tokopedia && "Tokopedia", profile?.shopee && "Shopee"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              )}
              {profile?.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{profile.address}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-[hsl(var(--sidebar-border))] pt-6 text-xs text-center opacity-50">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
