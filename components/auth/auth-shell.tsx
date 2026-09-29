import Link from "next/link";
import { Building2 } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className="w-full bg-background grid mx-auto"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <Link
          href="/login"
          className="mb-12 flex w-fit items-center gap-2 text-brand-pale lg:hidden"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-brand-solid text-brand-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold">LLM</span>
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md py-8">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                Welcome to LandLord Management
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
          </div>
        </div>
        <p className="py-5 text-center text-xs text-muted-foreground">
          LandLord Management · Property management made simpler
        </p>
      </div>
    </main>
  );
}
