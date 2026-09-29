"use client";

import { useAppData } from "@/components/data-provider";
import { ArchiveButton } from "@/components/action-buttons";


import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BackLink,
  DateRange,
  NotFoundState,
  PageHeader,
} from "@/components/shared";
import { formatCurrency, splitRent } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import { useParams } from "next/navigation";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const data = useAppData();
  const tenant = data.tenants.find((t) => t.id === id);
  if (!tenant) return <NotFoundState noun="Tenant" href="/landlord/tenants" />;
  const leases = data.leases.filter((l) => l.tenantIds.includes(id));
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/tenants">All tenants</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={tenantName(tenant)}
          description={tenant.archivedAt ? "Archived tenant profile and lease history" : "Tenant profile and lease history"}
        />
        <div className="flex gap-2">{!tenant.archivedAt && <Link href={`/landlord/tenants/${id}/edit`}>
          <Button variant="outline">Edit tenant</Button>
        </Link>}{!tenant.archivedAt && <ArchiveButton kind="tenant" id={id} destination="/landlord/tenants" />}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-soft-foreground">
              <Mail className="size-4 text-subtle-foreground" />
              {tenant.email}
            </p>
            <p className="flex items-center gap-2 text-sm text-soft-foreground">
              <Phone className="size-4 text-subtle-foreground" />
              {tenant.phone}
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Assigned leases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leases.map((lease) => {
              const apartment = data.apartments.find(
                (a) => a.id === lease.apartmentId,
              );
              const share = splitRent(
                lease.totalRentCents,
                lease.tenantIds,
              ).find((s) => s.tenantId === id);
              return (
                <Link
                  href={landlordRoutes.lease(lease.apartmentId, lease.id)}
                  key={lease.id}
                  className="flex items-center justify-between p-4 hover:bg-accent"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {apartment?.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <DateRange start={lease.startDate} end={lease.endDate} />{" "}
                      · Share {formatCurrency(share?.amountCents ?? 0)}
                    </p>
                  </div>
                  <Badge tone={lease.status}>{lease.status}</Badge>
                </Link>
              );
            })}
            {!leases.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No leases assigned.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
