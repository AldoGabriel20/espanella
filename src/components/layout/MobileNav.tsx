"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Leaf,
  LayoutDashboard,
  Package,
  Boxes,
  PackageOpen,
  ShoppingBag,
  BarChart3,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type MobileNavProps = {
  role?: "user" | "admin";
};

type NavLink = {
  title: string;
  href: string;
  icon: React.ElementType;
  indent?: boolean;
};

type NavSection = {
  label: string;
  links: NavLink[];
};

const workspaceSection: NavSection = {
  label: "Workspace",
  links: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Catalog", href: "/catalog", icon: Package },
    { title: "Items", href: "/catalog/items", icon: Boxes, indent: true },
    { title: "Bundles", href: "/catalog/bundles", icon: PackageOpen, indent: true },
    { title: "Orders", href: "/orders", icon: ShoppingBag },
  ],
};

const adminSection: NavSection = {
  label: "Admin",
  links: [
    { title: "Overview", href: "/admin", icon: BarChart3 },
    { title: "Items", href: "/admin/items", icon: Boxes },
    { title: "Bundles", href: "/admin/bundles", icon: PackageOpen },
    { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { title: "Fulfillment", href: "/admin/fulfillment", icon: Truck },
    { title: "Stock Audit", href: "/admin/stock", icon: BarChart3 },
  ],
};

export function MobileNav({ role = "user" }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const sections =
    role === "admin" ? [workspaceSection, adminSection] : [workspaceSection];

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/admin") return pathname === href;
    if (href === "/catalog") return pathname.startsWith("/catalog");
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-[110] flex flex-col w-72 bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gold/20">
              <Leaf className="h-3.5 w-3.5 text-gold" />
            </div>
            <span className="font-display font-semibold text-sidebar-foreground">
              Leuzien
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.label} className="px-3">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                          "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          active && "text-sidebar-foreground bg-sidebar-accent",
                          link.indent && "pl-8 text-sidebar-foreground/65"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
