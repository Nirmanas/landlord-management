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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isTenant = pathname.startsWith("/tenant");
  return (
    <nav className="space-y-1">
      {(isTenant ? tenantNav : landlordNav).map(
        ({ href, label, icon: Icon }) => {
          const active =
            href === (isTenant ? "/tenant" : "/landlord")
              ? pathname === href
              : pathname.startsWith(href);
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    <div className="min-h-screen bg-background">
      {showSignInSummary && (
        <SignInSummary onClose={() => setShowSignInSummary(false)} />
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-strong-border bg-card lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-brand-solid text-brand-foreground">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">LandLord Management</p>
            <p className="text-xs text-muted-foreground">Property management</p>
          </div>
        </div>
        <div className="flex-1 px-3">
          <NavLinks />
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-strong-border bg-card/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              className="px-2 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen((value) => !value)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="mr-auto lg:hidden">
              <p className="font-semibold text-foreground">LLM</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={logOut} disabled={loggingOut}>
                <LogOut className="size-4" /> {loggingOut ? "Logging out…" : "Log out"}
              </Button>
              {logoutError && <span role="alert" className="text-xs text-destructive">{logoutError}</span>}
            </div>
          </div>
          {open && (
            <div className="border-t border-border p-3 lg:hidden">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          )}
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
