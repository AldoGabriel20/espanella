"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type MobileNavProps = {
  role?: "user" | "admin";
};

const allLinks = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Items", href: "/catalog/items" },
  { title: "Bundles", href: "/catalog/bundles" },
  { title: "Orders", href: "/orders" },
];

const adminLinks = [
  { title: "Admin Overview", href: "/admin" },
  { title: "Manage Items", href: "/admin/items" },
  { title: "Manage Bundles", href: "/admin/bundles" },
  { title: "Manage Orders", href: "/admin/orders" },
  { title: "Stock Audit", href: "/admin/stock" },
];

export function MobileNav({ role = "user" }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const links = role === "admin" ? [...allLinks, ...adminLinks] : allLinks;

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
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

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" &&
                link.href !== "/admin" &&
                pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "text-sidebar-foreground bg-sidebar-accent"
                )}
              >
                {link.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
