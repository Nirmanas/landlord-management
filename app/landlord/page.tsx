"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/shared";
import { formatCurrency, landlordMetrics } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const data = emptyData;
  const metrics = landlordMetrics(data);
  const pending = data.tenantPayments.filter((p) => p.status === "pending");
  return (
    <div className="space-y-7">
      <PageHeader
        title="Good morning"
        description="Here’s what is happening across your properties."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Apartments" value={metrics.apartments} />
        <StatCard label="Active leases" value={metrics.activeLeases} />
        <StatCard label="Tenants" value={metrics.tenants} />
        <StatCard
          label="Outstanding"
          value={formatCurrency(metrics.outstandingCents)}
          detail={`${metrics.outstandingCount} payments`}
        />
        <StatCard
          label="Awaiting confirmation"
          value={metrics.pendingCount}
          detail="Reported by tenants"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Awaiting confirmation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pending.length ? (
              <div className="divide-y divide-zinc-100">
                {pending.map((payment) => {
                  const tenant = data.tenants.find(
                    (t) => t.id === payment.tenantId,
                  );
                  const lease = data.leases.find(
                    (l) => l.id === payment.leaseId,
                  );
                  const apartment = data.apartments.find(
                    (a) => a.id === lease?.apartmentId,
                  );
                  return (
                    <Link
                      href="/landlord/payments"
                      key={payment.id}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">
                          {tenant ? tenantName(tenant) : "Unknown tenant"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {apartment?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-900">
                          {formatCurrency(payment.amountCents)}
                        </p>
                        <Badge tone="pending">Pending confirmation</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-zinc-500">
                No payments are waiting for confirmation.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portfolio snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.apartments.length === 0 && (
              <div className="py-6 text-center text-sm text-zinc-500">
                No apartments yet. Add your first apartment to start your
                portfolio.
              </div>
            )}
            {data.apartments.map((apartment) => {
              const active = data.leases.find(
                (l) => l.apartmentId === apartment.id && l.status === "active",
              );
              return (
                <Link
                  href={landlordRoutes.apartment(apartment.id)}
                  key={apartment.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-emerald-50">
                    <Building2 className="size-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {apartment.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {active ? "Active lease" : "No active lease"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-zinc-400" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
