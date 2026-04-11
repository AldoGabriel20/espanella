"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PackageOpen,
  ShoppingBag,
  Settings,
  BarChart3,
  Boxes,
  ChevronDown,
  Truck,
  Wallet,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/utils/app-config";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
};

const userNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Catalog",
    href: "/catalog",
    icon: Package,
    children: [
      { title: "Items", href: "/catalog/items", icon: Boxes },
      { title: "Bundles", href: "/catalog/bundles", icon: PackageOpen },
    ],
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "About Us",
    href: "/about",
    icon: Building2,
  },
];

const adminNavItems: NavItem[] = [
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
    children: [
      { title: "Overview", href: "/admin", icon: BarChart3 },
      { title: "Items", href: "/admin/items", icon: Boxes },
      { title: "Bundles", href: "/admin/bundles", icon: PackageOpen },
      { title: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { title: "Fulfillment", href: "/admin/fulfillment", icon: Truck },
      { title: "Stock Audit", href: "/admin/stock", icon: BarChart3 },
      { title: "Financial", href: "/admin/financial", icon: Wallet },
      { title: "Company Profile", href: "/admin/company", icon: Building2 },
    ],
  },
];

type SidebarProps = {
  role?: "user" | "admin";
  className?: string;
};

function NavSection({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() =>
    items.reduce((acc, item) => {
      if (
        item.children?.some(
          (child) =>
            pathname === child.href || pathname.startsWith(child.href + "/")
        )
      ) {
        acc[item.href] = true;
      }
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggle = (href: string) =>
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }));

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            item.href !== "/admin" &&
            pathname.startsWith(item.href));
        const isExpanded = expanded[item.href];

        if (item.children && item.children.length > 0) {
          return (
            <li key={item.href}>
              <button
                onClick={() => toggle(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  isActive && "text-sidebar-foreground bg-sidebar-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge variant="gold" className="text-xs px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>
              {isExpanded && (
                <ul className="mt-0.5 space-y-0.5 ml-4 border-l border-sidebar-border pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive =
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/");
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                            isChildActive &&
                              "text-sidebar-foreground bg-sidebar-accent font-medium"
                          )}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          {child.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        }

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                isActive && "text-sidebar-foreground bg-sidebar-accent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="gold" className="text-xs px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({ role = "user", className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border shrink-0">
        <Image src="/hachiandlota.png" alt="Hachi & Lota" width={32} height={32} className="rounded-md object-contain" />
        <div>
          <span className="font-display font-semibold text-sidebar-foreground tracking-wide text-lg leading-none">
            {APP_NAME}
          </span>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">
            Operations
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          <div>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Workspace
            </p>
            <NavSection items={userNavItems} pathname={pathname} />
          </div>

          {role === "admin" && (
            <div>
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Admin
              </p>
              <NavSection items={adminNavItems[0].children!} pathname={pathname} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border shrink-0">
        <p className="px-3 text-xs text-sidebar-foreground/30 text-center">
          v0.1.0
        </p>
      </div>
    </aside>
  );
}
