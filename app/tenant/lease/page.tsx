"use client";

import {
  useApiCollection,
  useApiResource,
} from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";
import type { Tenant } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DateRange,
  DetailItem,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { formatCurrency, splitRent, tenantName } from "@/lib/domain";

export default function Page() {
  const apartmentsRequest = useApiCollection("tenant", "apartments");
  const leasesRequest = useApiCollection("tenant", "leases");
  const profileRequest = useApiResource<Tenant | null>("/api/tenant/profile");
  const resources = [apartmentsRequest, leasesRequest, profileRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const apartmentRecords = apartmentsRequest.data ?? [];
  const leaseRecords = leasesRequest.data ?? [];
  const tenant = profileRequest.data;
  const statusOrder = { active: 0, upcoming: 1, ended: 2 };
  const leases = [...leaseRecords].sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      b.startDate.localeCompare(a.startDate),
  );
  if (!tenant)
    return (
      <EmptyState
        title="Tenant profile unavailable"
        description="Your account does not have a tenant profile."
      />
    );
  if (!leases.length)
    return (
      <div className="space-y-6">
        <PageHeader title="My leases" description="Your rental agreements." />
        <EmptyState
          title="No lease assigned"
          description="There is no lease assigned to your account."
        />
      </div>
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title="My leases"
        description="Your current, upcoming, and past agreements with individual rent shares."
      />
      {leases.map((lease) => {
        const apartment = apartmentRecords.find(
          (apartment) => apartment.id === lease.apartmentId,
        );
        const unavailable = Boolean(
          lease.status === "ended" ||
            lease.archivedAt ||
            apartment?.archivedAt ||
            !lease.tenantIds.includes(tenant.id),
        );
        const share = unavailable
          ? undefined
          : splitRent(lease.totalRentCents, lease.tenantIds).find(
              (share) => share.tenantId === tenant.id,
            );
        return (
          <Card key={lease.id}>
            <div className="border-b border-border bg-linear-to-r from-brand-deep to-brand-solid p-6 text-brand-foreground">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">
                  {apartment?.name ?? "Apartment unavailable"}
                </h2>
                <Badge tone={unavailable ? "neutral" : lease.status}>
                  {unavailable ? "Unavailable" : lease.status}
                </Badge>
              </div>
              {apartment && (
                <p className="mt-2 text-sm text-brand-faint">{apartment.address}</p>
              )}
            </div>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Tenant">{tenantName(tenant)}</DetailItem>
              <DetailItem label="Lease term">
                <DateRange start={lease.startDate} end={lease.endDate} />
              </DetailItem>
              <DetailItem label="Total rent">
                {formatCurrency(lease.totalRentCents)}
              </DetailItem>
              <DetailItem label="Your share">
                <span className="text-brand-soft">
                  {share ? formatCurrency(share.amountCents) : "Unavailable"}
                </span>
              </DetailItem>
            </CardContent>
            {lease.links.downloadDocument && (
              <div className="border-t border-border px-6 py-4 text-sm">
                <a
                  href={lease.links.downloadDocument.href}
                  className="font-medium text-brand-soft underline"
                >
                  Download lease PDF
                </a>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
