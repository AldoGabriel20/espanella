import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  backHref,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        {backHref && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 mb-1 h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        )}
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}
