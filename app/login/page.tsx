"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthField, PasswordField } from "@/components/auth/auth-fields";
import { loginSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";

type LoginValues = z.infer<typeof loginSchema>;

export default function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <AuthShell
      title="Welcome back"
      description="Enter your details to access your rental workspace."
    >
      <form
        onSubmit={handleSubmit(() => {})}
        noValidate
        className="space-y-5"
      >
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
          autoComplete="current-password"
          error={errors.password?.message}
        />
        <Button type="submit" className="w-full">
          Sign in <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
