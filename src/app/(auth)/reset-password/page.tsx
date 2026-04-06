import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Set a New Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your Leuzien account.
        </p>
      </div>

      <Suspense>
        <ResetPasswordForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Back to{" "}
        <Link href="/login" className="text-forest hover:underline font-medium">
          sign in
        </Link>
      </p>
    </div>
  );
}
