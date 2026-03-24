"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        handleLogout();
      }}
      disabled={loading}
      className="text-destructive focus:text-destructive cursor-pointer"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );
}
