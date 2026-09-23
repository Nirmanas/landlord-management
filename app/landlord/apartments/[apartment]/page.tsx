"use client";

import type { AppData } from "@/lib/types";

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

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const { apartment: id } = useParams<{ apartment: string }>();
  const data = emptyData;
  const apartment = data.apartments.find((a) => a.id === id);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const leases = data.leases.filter((l) => l.apartmentId === id);
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/apartments">All apartments</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={apartment.name}
          description={`${apartment.address}, ${apartment.city}, ${apartment.postalCode}`}
        />
        <div className="flex flex-wrap gap-2">
          <Link href={landlordRoutes.leases(id)}>
            <Button variant="outline">View leases</Button>
          </Link>
          <Link href={landlordRoutes.newLease(id)}>
            <Button>New lease</Button>
          </Link>
          <Link href={landlordRoutes.apartmentEdit(id)}>
            <Button variant="outline">Edit apartment</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Property details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-5">
              <DetailItem label="Bedrooms">{apartment.bedrooms}</DetailItem>
              <DetailItem label="Bathrooms">{apartment.bathrooms}</DetailItem>
              <DetailItem label="City">{apartment.city}</DetailItem>
              <DetailItem label="Postal code">
                {apartment.postalCode}
              </DetailItem>
              <div className="col-span-2">
                <DetailItem label="Notes">
                  {apartment.notes || "No notes"}
                </DetailItem>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Associated leases</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leases.length ? (
              <div className="divide-y divide-zinc-100">
                {leases.map((lease) => (
                  <Link
                    href={landlordRoutes.lease(id, lease.id)}
                    key={lease.id}
                    className="flex items-center justify-between p-4 hover:bg-zinc-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        <DateRange
                          start={lease.startDate}
                          end={lease.endDate}
                        />
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {lease.tenantIds.length} tenant
                        {lease.tenantIds.length === 1 ? "" : "s"} ·{" "}
                        {formatCurrency(lease.totalRentCents)}
                      </p>
                    </div>
                    <Badge tone={lease.status}>{lease.status}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-zinc-500">
                No leases are linked to this apartment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
