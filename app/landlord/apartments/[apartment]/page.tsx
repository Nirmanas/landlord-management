"use client";

import { useApiItem, useApiCollection } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";

import { ArchiveButton } from "@/components/action-buttons";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BackLink,
  DateRange,
  DetailItem,
  NotFoundState,
  PageHeader,
} from "@/components/shared";
import { formatCurrency } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";
import { useParams } from "next/navigation";

export default function Page() {
  const { apartment: id } = useParams<{ apartment: string }>();
  const leasesRequest = useApiCollection("landlord", "leases", id);
  const apartmentRequest = useApiItem("landlord", "apartments", id);
  const resources = [leasesRequest, apartmentRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const leaseRecords = leasesRequest.data ?? [];
  const { data: apartment } = apartmentRequest;
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const leases = leaseRecords.filter((l) => l.apartmentId === id);
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/apartments">All apartments</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={apartment.name}
          description={`${apartment.address}${apartment.archivedAt ? " · Archived" : ""}`}
        />
        <div className="flex flex-wrap gap-2">
          <Link href={landlordRoutes.leases(id)}>
            <Button variant="outline">View leases</Button>
          </Link>
          {!apartment.archivedAt && (
            <Link href={landlordRoutes.newLease(id)}>
              <Button>New lease</Button>
            </Link>
          )}
          {!apartment.archivedAt && (
            <Link href={landlordRoutes.apartmentEdit(id)}>
              <Button variant="outline">Edit apartment</Button>
            </Link>
          )}
          {!apartment.archivedAt && (
            <ArchiveButton
              kind="apartment"
              id={id}
              destination="/landlord/apartments"
            />
          )}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Property details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailItem label="Address">{apartment.address}</DetailItem>
            </dl>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Associated leases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leases.length ? (
              <div className="divide-y divide-border">
                {leases.map((lease) => (
                  <Link
                    href={landlordRoutes.lease(id, lease.id)}
                    key={lease.id}
                    className="flex items-center justify-between p-4 hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        <DateRange
                          start={lease.startDate}
                          end={lease.endDate}
                        />
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lease.tenantIds.length} tenant
                        {lease.tenantIds.length === 1 ? "" : "s"} ·{" "}
                        {formatCurrency(lease.totalRentCents)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        lease.archivedAt || apartment.archivedAt
                          ? "neutral"
                          : lease.status
                      }
                    >
                      {lease.archivedAt || apartment.archivedAt
                        ? "Archived"
                        : lease.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No leases are linked to this apartment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
