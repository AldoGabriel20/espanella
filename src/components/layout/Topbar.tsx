import * as React from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NotificationBell } from "./NotificationBell";

type BreadcrumbItem = {
  title: string;
  href?: string;
};

type TopbarProps = {
  role?: "user" | "admin";
  userName?: string;
  breadcrumbs?: BreadcrumbItem[];
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({
  role = "user",
  userName = "User",
  breadcrumbs = [],
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-14 gap-3 px-4 bg-background border-b border-border">
      <MobileNav role={role} />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="hidden md:flex items-center gap-1.5 text-sm flex-1"
      >
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {crumb.href && index < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.title}
              </Link>
            ) : (
              <span
                className={cn(
                  index === breadcrumbs.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {crumb.title}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="flex-1 md:flex-none" />

      <div className="flex items-center gap-2">
        {role === "admin" && (
          <Badge variant="forest" className="hidden sm:inline-flex text-xs">
            Admin
          </Badge>
        )}

        {role === "admin" ? (
          <NotificationBell />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4.5 w-4.5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            {role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">Admin Panel</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
