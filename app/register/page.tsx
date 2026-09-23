"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthField, PasswordField } from "@/components/auth/auth-fields";
import { registerSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";

type RegisterValues = z.infer<typeof registerSchema>;

export default function Page() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: RegisterValues) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      if (response.ok) {
        router.push("/login");
      }
    } catch {
      // Keep the form available for another attempt if the request fails.
    }
  }

  return (
    <AuthShell
      title="Create your tenant account"
      description="Enter your details to get started with your rental workspace."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        <AuthField id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            {...register("name")}
            autoComplete="name"
            placeholder="Your name"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </AuthField>

        <AuthField id="email" label="Email address" error={errors.email?.message}>
          <Input
            id="email"
            {...register("email")}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </AuthField>

        <PasswordField
          id="password"
          label="Password"
          registration={register("password")}
          autoComplete="new-password"
          hint="Use at least 8 characters."
          error={errors.password?.message}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          registration={register("confirmPassword")}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
          {!isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
