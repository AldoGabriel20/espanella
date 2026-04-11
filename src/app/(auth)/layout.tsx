import * as React from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/utils/app-config";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already authenticated — skip the auth flow
  const user = await getSession();
  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col bg-forest text-forest-foreground p-12 relative overflow-hidden">
        {/* Background texture elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full border-2 border-current" />
          <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full border border-current" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-current" />
        </div>

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gold/20">
            <Leaf className="h-4.5 w-4.5 text-gold" />
          </div>
          <span className="font-display font-semibold text-xl tracking-wide">
            {APP_NAME}
          </span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <blockquote className="space-y-4">
            <p className="font-display text-3xl font-light leading-snug text-balance opacity-90">
              Every detail considered.
              <br />
              Every hamper perfected.
            </p>
            <footer className="text-forest-foreground/60 text-sm">
              Premium operations for premium gifts.
            </footer>
          </blockquote>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-forest-foreground/40">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-forest text-forest-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-lg tracking-wide">
              {APP_NAME}
            </span>
          </Link>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
