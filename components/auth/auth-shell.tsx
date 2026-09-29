import Image from "next/image";
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
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <Link
            href="/login"
            className="flex items-center gap-2 text-brand-pale"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-brand-solid text-brand-foreground">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold">LLM</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand">
                Welcome to LandLord Management
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
          </div>
        </main>

        <footer className="border-t text-center border-border pt-5 text-sm font-medium text-soft-foreground">
          <p>
            LandLordManagement{" "}
            <span className="text-subtle-foreground">- LLM</span>
          </p>
        </footer>
      </div>

      <aside className="auth-showcase min-w-0 items-center justify-center overflow-hidden border-l border-brand-deep/40 bg-brand-surface/30 px-8 py-12 lg:px-14">
        <Image
          src="/rental-workspace.svg"
          alt="Illustration of a rental dashboard with property and payment cards"
          width={640}
          height={420}
          className="w-full max-w-xl rounded-2xl"
        />
      </aside>
    </div>
  );
}
