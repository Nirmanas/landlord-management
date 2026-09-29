"use client";

import { useAppData } from "@/components/data-provider";


import { Card, CardContent } from "@/components/ui/card";
import {
  DateRange,
  DetailItem,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { formatCurrency, splitRent } from "@/lib/domain";
import { tenantName } from "@/lib/domain";

export default function Page() {
  const data = useAppData();
  const tenant = data.tenants[0];
  const leases = data.leases.filter((l) =>
    l.tenantIds.includes(tenant?.id ?? ""),
  );
  const currentLease =
    leases.find((l) => l.status === "active") ??
    leases.find((l) => l.status === "upcoming") ??
    leases[0];
  const apartment = data.apartments.find(
    (a) => a.id === currentLease?.apartmentId,
  );
  const share = currentLease
    ? splitRent(currentLease.totalRentCents, currentLease.tenantIds).find(
        (s) => s.tenantId === tenant?.id,
      )
    : undefined;
  if (!tenant || !currentLease || !apartment)
    return (
      <div className="space-y-6">
        <PageHeader title="My lease" description="Your current agreement." />
        <EmptyState
          title="No lease assigned"
          description="There is no lease assigned to your account."
        />
      </div>
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title="My lease"
        description="Your current agreement and individual rent share."
      />
      <Card>
        <div className="border-b border-border bg-linear-to-r from-brand-deep to-brand-solid p-6 text-brand-foreground">
          <p className="text-sm text-brand-tint">Current residence</p>
          <h2 className="mt-1 text-2xl font-semibold">{apartment.name}</h2>
          <p className="mt-2 text-sm text-brand-faint">
            {apartment.address}
          </p>
        </div>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Tenant">{tenantName(tenant)}</DetailItem>
          <DetailItem label="Lease term">
            <DateRange
              start={currentLease.startDate}
              end={currentLease.endDate}
            />
          </DetailItem>
          <DetailItem label="Total rent">
            {formatCurrency(currentLease.totalRentCents)}
          </DetailItem>
          <DetailItem label="Your share">
            <span className="text-brand-soft">
              {formatCurrency(share?.amountCents ?? 0)}
            </span>
          </DetailItem>
        </CardContent>
      </Card>
    </div>
  );
}
