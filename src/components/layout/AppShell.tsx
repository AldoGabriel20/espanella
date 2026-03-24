import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type BreadcrumbItem = {
  title: string;
  href?: string;
};

type AppShellProps = {
  children: React.ReactNode;
  role?: "user" | "admin";
  userName?: string;
  breadcrumbs?: BreadcrumbItem[];
};

export function AppShell({
  children,
  role = "user",
  userName = "User",
  breadcrumbs = [],
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar role={role} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar role={role} userName={userName} breadcrumbs={breadcrumbs} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
