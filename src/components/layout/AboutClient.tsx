"use client";

import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  ShoppingBag,
  Leaf,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroBanner } from "@/components/ui/hero-banner";
import { PageHeader } from "@/components/ui/page-header";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";

function ContactRow({
  icon: Icon,
  label,
  href,
  children,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const inner = (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 rounded-md bg-forest/10 p-1.5">
        <Icon className="h-4 w-4 text-forest" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

export default function AboutClient() {
  const { data: profile, isLoading } = useCompanyProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <PageHeader title="About Us" description={profile.tagline} />

      {/* Hero */}
      <HeroBanner
        images={profile.heroImages}
        companyName={profile.companyName}
        tagline={profile.tagline}
      />

      {/* About text */}
      {profile.about && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Leaf className="h-4 w-4 text-forest" />
              {profile.companyName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {profile.about}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contact & Social</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {profile.phone && (
            <ContactRow icon={Phone} label="Phone" href={`tel:${profile.phone}`}>
              {profile.phone}
            </ContactRow>
          )}
          {profile.whatsApp && (
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              href={`https://wa.me/${profile.whatsApp.replace(/\D/g, "")}`}
            >
              {profile.whatsApp}
            </ContactRow>
          )}
          {profile.email && (
            <ContactRow icon={Mail} label="Email" href={`mailto:${profile.email}`}>
              {profile.email}
            </ContactRow>
          )}
          {profile.instagram && (
            <ContactRow
              icon={Instagram}
              label="Instagram"
              href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
            >
              {profile.instagram}
            </ContactRow>
          )}
          {profile.tokopedia && (
            <ContactRow icon={ShoppingBag} label="Tokopedia">
              {profile.tokopedia}
            </ContactRow>
          )}
          {profile.shopee && (
            <ContactRow icon={ShoppingBag} label="Shopee">
              {profile.shopee}
            </ContactRow>
          )}
          {profile.address && (
            <ContactRow icon={MapPin} label="Address">
              <span className="whitespace-pre-line">{profile.address}</span>
            </ContactRow>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
