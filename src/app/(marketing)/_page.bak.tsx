import Link from "next/link";
import { ArrowRight, Leaf, PackageOpen, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-forest text-forest-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-foreground text-lg tracking-wide">
              Leuzien
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <Badge variant="forest" className="text-xs px-3 py-1">
            Premium Hampers Operations
          </Badge>

          <h1 className="font-display text-5xl sm:text-6xl font-semibold text-foreground leading-tight tracking-tight text-balance">
            Curated hampers,
            <br />
            <span className="text-forest">beautifully managed.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance leading-relaxed">
            Leuzien is an operations platform for managing your premium hampers
            catalog, orders, and inventory — from creation to delivery.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/login">
                Sign in to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-border px-6 py-16 bg-secondary/30">
        <div className="mx-auto max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-md bg-forest-light flex items-center justify-center">
                <PackageOpen className="h-5 w-5 text-forest" />
              </div>
              <h3 className="font-semibold text-foreground">
                Catalog management
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Manage individual items and bundle compositions with real-time
                stock visibility.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-md bg-gold-light flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-semibold text-foreground">
                Order operations
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create and track orders through their full lifecycle, with
                invoice generation built in.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-md bg-brick-light flex items-center justify-center">
                <Leaf className="h-5 w-5 text-brick" />
              </div>
              <h3 className="font-semibold text-foreground">
                Stock auditing
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track every stock movement with full audit history and
                low-stock alerting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Leuzien. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-forest" />
            <span>Premium hampers operations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
