"use client";

import { useApiItem, useApiCollection } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";

import { useState } from "react";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BackLink,
  DateRange,
  EmptyState,
  NotFoundState,
  PageHeader,
} from "@/components/shared";
import { formatCurrency } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";
import { useParams } from "next/navigation";

const tableClass = "w-full min-w-175 text-left text-sm";
const thClass =
  "border-b border-strong-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tdClass = "border-b border-border px-4 py-4 text-soft-foreground";

export default function Page() {
  const [archived, setArchived] = useState(false);
  const { apartment: apartmentId } = useParams<{ apartment: string }>();
  const apartmentRequest = useApiItem("landlord", "apartments", apartmentId);
  const recordsRequest = useApiCollection("landlord", "leases", apartmentId);
  const resources = [apartmentRequest, recordsRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const { data: records } = recordsRequest;
  const apartment = apartmentRequest.data;
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const leases = (records ?? []).filter(
    (lease) => Boolean(lease.archivedAt || apartment.archivedAt) === archived,
  );
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.apartment(apartmentId)}>
        {apartment.name}
      </BackLink>
      <PageHeader
        title={`${apartment.name} leases`}
        description="Track agreements, rents, and tenant assignments."
        actionHref={
          apartment.archivedAt
            ? undefined
            : landlordRoutes.newLease(apartmentId)
        }
        actionLabel={apartment.archivedAt ? undefined : "New lease"}
      />
      <Button
        variant="outline"
        type="button"
        onClick={() => setArchived((value) => !value)}
      >
        {archived ? "Show active" : "Show archived"}
      </Button>
      {leases.length === 0 ? (
        <EmptyState
          title={archived ? "No archived leases" : "No leases yet"}
          description={
            archived
              ? "Archived leases will appear here."
              : "Select a registered tenant when creating a lease."
          }
          actionHref={
            archived || apartment.archivedAt
              ? undefined
              : landlordRoutes.newLease(apartmentId)
          }
          actionLabel={
            archived || apartment.archivedAt ? undefined : "Create lease"
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Dates</th>
                  <th className={thClass}>Rent</th>
                  <th className={thClass}>Tenants</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id}>
                    <td className={tdClass}>
                      <DateRange start={lease.startDate} end={lease.endDate} />
                    </td>
                    <td className={tdClass}>
                      {formatCurrency(lease.totalRentCents)}
                    </td>
                    <td className={tdClass}>{lease.tenantIds.length}</td>
                    <td className={tdClass}>
                      <Badge tone={archived ? "neutral" : lease.status}>
                        {archived ? "Archived" : lease.status}
                      </Badge>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link href={landlordRoutes.lease(apartmentId, lease.id)}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {!lease.archivedAt && !apartment.archivedAt && (
                        <Link
                          href={landlordRoutes.leaseEdit(apartmentId, lease.id)}
                        >
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
