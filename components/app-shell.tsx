"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  Menu,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
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
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isTenant = pathname.startsWith("/tenant");
  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-white">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-zinc-950">LandLord Management</p>
            <p className="text-xs text-zinc-500">Property management</p>
          </div>
        </div>
        <div className="flex-1 px-3">
          <NavLinks />
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
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
              <p className="font-semibold text-zinc-950">LLM</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isTenant && (
                <Select
                  aria-label="Selected tenant"
                  value=""
                  disabled
                  className="w-36 sm:w-56"
                >
                  <option value="">No tenants</option>
                </Select>
              )}
            </div>
          </div>
          {open && (
            <div className="border-t border-zinc-100 p-3 lg:hidden">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          )}
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
