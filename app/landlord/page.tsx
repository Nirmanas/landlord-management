"use client";

import { useApiResource } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/shared";
import { formatCurrency } from "@/lib/domain";
import type { LandlordDashboard } from "@/lib/types";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const request = useApiResource<LandlordDashboard>("/api/landlord/dashboard");
  if (!request.data) return <ApiStatus resources={[request]} />;
  const { metrics, pendingPayments: pending, apartments } = request.data;
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
              <div className="divide-y divide-border">
                {pending.map((payment) => {
                  return (
                    <Link
                      href="/landlord/payments"
                      key={payment.id}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {payment.tenantName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.apartmentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(payment.amountCents)}
                        </p>
                        <Badge tone="pending">Pending confirmation</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
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
            {apartments.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No apartments yet. Add your first apartment to start your
                portfolio.
              </div>
            )}
            {apartments.map((apartment) => {
              return (
                <Link
                  href={landlordRoutes.apartment(apartment.id)}
                  key={apartment.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-brand-surface/40">
                    <Building2 className="size-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {apartment.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {apartment.hasActiveLease
                        ? "Active lease"
                        : "No active lease"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-subtle-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
