"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  Menu,
  LogOut,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInSummary } from "@/components/sign-in-summary";
import { cn } from "@/lib/utils";
import useMobileLayout from "./hooks/mobile-layout";

const landlordNav = [
  { href: "/landlord", label: "Dashboard", icon: Home },
  { href: "/landlord/apartments", label: "Apartments", icon: Building2 },
  { href: "/landlord/tenants", label: "Tenants", icon: Users },
  { href: "/landlord/payments", label: "Payments", icon: CreditCard },
];
const tenantNav = [
  { href: "/tenant", label: "Dashboard", icon: Home },
  { href: "/tenant/lease", label: "My lease", icon: FileText },
  { href: "/tenant/payments", label: "My payments", icon: CreditCard },
];

function NavLinks({
  onNavigate,
  isTenant,
  current,
}: {
  onNavigate?: () => void;
  isTenant: boolean;
  current: string;
}) {
  return (
    <nav className="space-y-1">
      {(isTenant ? tenantNav : landlordNav).map(
        ({ href, label, icon: Icon }) => {
          const active =
            href === (isTenant ? "/tenant" : "/landlord")
              ? current === href
              : current.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-surface/40 text-brand-soft"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        },
      )}
    </nav>
  );
}

function DesktopNav({
  isTenant,
  current,
}: {
  isTenant: boolean;
  current: string;
}) {
  return (
    <div className="flex h-16 shrink-0 items-center">
      {(isTenant ? tenantNav : landlordNav).map(
        ({ href, label, icon: Icon }) => {
          const active =
            href === (isTenant ? "/tenant" : "/landlord")
              ? current === href
              : current.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-surface/40 text-brand-soft"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        },
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTenant = pathname.startsWith("/tenant");
  const router = useRouter();
  const isMobile = useMobileLayout();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [showSignInSummary, setShowSignInSummary] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("showSignInSummary") !== "true") return;
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem("showSignInSummary");
      setShowSignInSummary(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  async function logOut() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/login", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not log out.");
      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      setLogoutError("Could not log out. Please try again.");
    }
  }
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showSignInSummary && (
        <SignInSummary onClose={() => setShowSignInSummary(false)} />
      )}
      <header className="sticky top-0 z-20 border-b border-strong-border bg-card/95 backdrop-blur">
        <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          {isMobile ? (
            <Button
              variant="ghost"
              className="px-2"
              aria-label="Open navigation"
              onClick={() => setOpen((value) => !value)}
            >
              <Menu className="size-5" />
            </Button>
          ) : null}
          <div>
            <p className="font-semibold text-foreground">LLM</p>
          </div>
          {!isMobile && <DesktopNav isTenant={isTenant} current={pathname} />}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={logOut}
              disabled={loggingOut}
            >
              <LogOut className="size-4" />{" "}
              {loggingOut ? "Logging out…" : "Log out"}
            </Button>
            {logoutError && (
              <span role="alert" className="text-xs text-destructive">
                {logoutError}
              </span>
            )}
          </div>
        </div>
        {open && isMobile && (
          <div className="border-t border-border p-3">
            <NavLinks
              onNavigate={() => setOpen(false)}
              isTenant={isTenant}
              current={pathname}
            />
          </div>
        )}
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8"
      >
        {children}
      </main>
      <footer className="border-t border-brand-deep/40 bg-brand-surface/30 px-4 py-5 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-7xl text-sm font-semibold tracking-wide text-brand-pale">
          LandLordManagement{" "}
          <span className="text-muted-foreground">- LLM</span>
        </p>
      </footer>
    </div>
  );
}
