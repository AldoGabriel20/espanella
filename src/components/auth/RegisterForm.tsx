"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

type FormState = {
  name: string;
  email: string;
  password: string;
};

type FieldError = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldError {
  const errors: FieldError = {};
  if (!form.name.trim()) errors.name = "Full name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address";
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 8)
    errors.password = "Password must be at least 8 characters";
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<FieldError>({});
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name as keyof FormState]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setFieldErrors({ email: "An account with this email already exists" });
        } else {
          setError(data.error ?? "Registration failed. Please try again.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Full name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          required
          value={form.name}
          onChange={handleChange}
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.name)}
        />
        {fieldErrors.name && (
          <p className="text-xs text-destructive">{fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={handleChange}
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          required
          value={form.password}
          onChange={handleChange}
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-forest hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
