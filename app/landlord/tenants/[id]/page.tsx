"use client";

import type { AppData } from "@/lib/types";

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

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const data = emptyData;
  const tenant = data.tenants.find((t) => t.id === id);
  if (!tenant) return <NotFoundState noun="Tenant" href="/landlord/tenants" />;
  const leases = data.leases.filter((l) => l.tenantIds.includes(id));
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/tenants">All tenants</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={tenantName(tenant)}
          description="Tenant profile and lease history"
        />
        <Link href={`/landlord/tenants/${id}/edit`}>
          <Button variant="outline">Edit tenant</Button>
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <Mail className="size-4 text-zinc-400" />
              {tenant.email}
            </p>
            <p className="flex items-center gap-2 text-sm text-zinc-700">
              <Phone className="size-4 text-zinc-400" />
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
                  className="flex items-center justify-between p-4 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {apartment?.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <DateRange start={lease.startDate} end={lease.endDate} />{" "}
                      · Share {formatCurrency(share?.amountCents ?? 0)}
                    </p>
                  </div>
                  <Badge tone={lease.status}>{lease.status}</Badge>
                </Link>
              );
            })}
            {!leases.length && (
              <div className="p-8 text-center text-sm text-zinc-500">
                No leases assigned.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
