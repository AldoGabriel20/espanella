"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, AlertCircle, Check, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroBanner } from "@/components/ui/hero-banner";
import { useCompanyProfile, useUpdateCompanyProfile } from "@/hooks/useCompanyProfile";
import type { CompanyProfile } from "@/types";

type FormValues = {
  companyName: string;
  tagline: string;
  about: string;
  email: string;
  phone: string;
  whatsApp: string;
  instagram: string;
  tokopedia: string;
  shopee: string;
  address: string;
  heroImages: string[];
};

function profileToForm(p: CompanyProfile): FormValues {
  return {
    companyName: p.companyName,
    tagline: p.tagline,
    about: p.about,
    email: p.email ?? "",
    phone: p.phone ?? "",
    whatsApp: p.whatsApp ?? "",
    instagram: p.instagram ?? "",
    tokopedia: p.tokopedia ?? "",
    shopee: p.shopee ?? "",
    address: p.address ?? "",
    heroImages: p.heroImages,
  };
}

function emptyForm(): FormValues {
  return {
    companyName: "",
    tagline: "",
    about: "",
    email: "",
    phone: "",
    whatsApp: "",
    instagram: "",
    tokopedia: "",
    shopee: "",
    address: "",
    heroImages: [],
  };
}

export default function AdminCompanyClient() {
  const { data: profile, isLoading, isError, error } = useCompanyProfile();
  const updateMut = useUpdateCompanyProfile();
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) setForm(profileToForm(profile));
  }, [profile]);

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleImageFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/company-profile/hero-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({ message: "Upload failed" }));
      if (!res.ok) throw new Error(data.message ?? "Upload failed");
      set("heroImages", [...form.heroImages, data.url as string]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(i: number) {
    set("heroImages", form.heroImages.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    await updateMut.mutateAsync({
      companyName: form.companyName,
      tagline: form.tagline,
      about: form.about,
      email: form.email || null,
      phone: form.phone || null,
      whatsApp: form.whatsApp || null,
      instagram: form.instagram || null,
      tokopedia: form.tokopedia || null,
      shopee: form.shopee || null,
      address: form.address || null,
      heroImages: form.heroImages,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{(error as Error)?.message ?? "Failed to load profile"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="Manage your company's public-facing information and hero banner images."
        action={
          <Button onClick={handleSave} disabled={updateMut.isPending} size="sm">
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Saved
              </>
            ) : updateMut.isPending ? (
              "Saving…"
            ) : (
              "Save Changes"
            )}
          </Button>
        }
      />

      {/* Live preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hero Banner Preview</CardTitle>
          <CardDescription>This is how the banner looks to users.</CardDescription>
        </CardHeader>
        <CardContent>
          <HeroBanner
            images={form.heroImages}
            companyName={form.companyName || "Leuzien"}
            tagline={form.tagline || "Hampers & Gifts, Made with Love"}
            interval={0}
          />
        </CardContent>
      </Card>

      {/* Hero images */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Hero Images</CardTitle>
          <CardDescription>Upload images to display in the hero slider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.heroImages.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Hero ${i + 1}`} className="h-10 w-16 rounded object-cover shrink-0 border" />
              <span className="flex-1 text-xs text-muted-foreground truncate">{url}</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => removeImage(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {uploadError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {uploadError}
            </p>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Uploading…</>
              ) : (
                <><Upload className="h-4 w-4 mr-1.5" />Upload Image</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Company Name</label>
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tagline</label>
              <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">About</label>
            <Textarea
              rows={5}
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Describe your company…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contact & Social</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { key: "phone", label: "Phone" },
              { key: "whatsApp", label: "WhatsApp" },
              { key: "email", label: "Email" },
              { key: "instagram", label: "Instagram (handle)" },
              { key: "tokopedia", label: "Tokopedia (shop URL or name)" },
              { key: "shopee", label: "Shopee (shop URL or name)" },
            ] as { key: keyof FormValues; label: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium">{label}</label>
              <Input
                value={form[key] as string}
                onChange={(e) => set(key, e.target.value as FormValues[typeof key])}
              />
            </div>
          ))}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-sm font-medium">Address</label>
            <Textarea
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
