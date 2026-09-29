import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-soft-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-strong-border bg-card px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-subtle-foreground focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/15",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-strong-border bg-card px-3 text-sm text-foreground shadow-sm outline-none focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/15",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-strong-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none placeholder:text-subtle-foreground focus:border-brand-focus focus:ring-2 focus:ring-brand-focus/15",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  children,
  error,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
