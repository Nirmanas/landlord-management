"use client";

import { useAppData, useApiCollection } from "@/components/data-provider";
import { useState } from "react";


import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackLink, DateRange, EmptyState, NotFoundState, PageHeader } from "@/components/shared";
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
  const data = useAppData();
  const { data: records, loading, error } = useApiCollection("leases", apartmentId);
  if (loading) return <p role="status">Loading leases…</p>;
  if (error) return <p role="alert">{error}</p>;
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const leases = (records ?? []).filter((lease) => Boolean(lease.archivedAt || apartment.archivedAt) === archived);
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.apartment(apartmentId)}>{apartment.name}</BackLink>
      <PageHeader
        title={`${apartment.name} leases`}
        description="Track agreements, rents, and tenant assignments."
        actionHref={apartment.archivedAt ? undefined : landlordRoutes.newLease(apartmentId)}
        actionLabel={apartment.archivedAt ? undefined : "New lease"}
      />
      <Button variant="outline" type="button" onClick={() => setArchived((value) => !value)}>{archived ? "Show active" : "Show archived"}</Button>
      {leases.length === 0 ? (
        <EmptyState
          title={archived ? "No archived leases" : "No leases yet"}
          description={archived ? "Archived leases will appear here." : "Select a registered tenant when creating a lease."}
          actionHref={archived || apartment.archivedAt ? undefined : landlordRoutes.newLease(apartmentId)}
          actionLabel={archived || apartment.archivedAt ? undefined : "Create lease"}
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
                      <DateRange
                        start={lease.startDate}
                        end={lease.endDate}
                      />
                    </td>
                    <td className={tdClass}>
                      {formatCurrency(lease.totalRentCents)}
                    </td>
                    <td className={tdClass}>{lease.tenantIds.length}</td>
                    <td className={tdClass}>
                      <Badge tone={archived ? "neutral" : lease.status}>{archived ? "Archived" : lease.status}</Badge>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link href={landlordRoutes.lease(apartmentId, lease.id)}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      {!lease.archivedAt && !apartment.archivedAt && <Link href={landlordRoutes.leaseEdit(apartmentId, lease.id)}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>}
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
