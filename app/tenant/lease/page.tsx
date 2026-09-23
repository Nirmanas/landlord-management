"use client";

import type { AppData } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DateRange,
  DetailItem,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { formatCurrency, splitRent } from "@/lib/domain";
import { tenantName } from "@/lib/domain";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const data = emptyData;
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
          description="There is no lease available for the selected tenant."
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
        <div className="border-b border-zinc-100 bg-linear-to-r from-emerald-800 to-emerald-600 p-6 text-white">
          <p className="text-sm text-emerald-100">Current residence</p>
          <h2 className="mt-1 text-2xl font-semibold">{apartment.name}</h2>
          <p className="mt-2 text-sm text-emerald-50">
            {apartment.address}, {apartment.city}, {apartment.postalCode}
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
            <span className="text-emerald-800">
              {formatCurrency(share?.amountCents ?? 0)}
            </span>
          </DetailItem>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Apartment details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-3">
            <DetailItem label="Bedrooms">{apartment.bedrooms}</DetailItem>
            <DetailItem label="Bathrooms">{apartment.bathrooms}</DetailItem>
            <DetailItem label="Notes">
              {apartment.notes || "No additional notes"}
            </DetailItem>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
