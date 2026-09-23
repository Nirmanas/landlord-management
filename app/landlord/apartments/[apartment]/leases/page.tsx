"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackLink, DateRange, EmptyState, NotFoundState, PageHeader } from "@/components/shared";
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

const tableClass = "w-full min-w-175 text-left text-sm";
const thClass =
  "border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500";
const tdClass = "border-b border-zinc-100 px-4 py-4 text-zinc-700";

export default function Page() {
  const { apartment: apartmentId } = useParams<{ apartment: string }>();
  const data = emptyData;
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const leases = data.leases.filter((lease) => lease.apartmentId === apartmentId);
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.apartment(apartmentId)}>{apartment.name}</BackLink>
      <PageHeader
        title={`${apartment.name} leases`}
        description="Track agreements, rents, and tenant assignments."
        actionHref={landlordRoutes.newLease(apartmentId)}
        actionLabel="New lease"
      />
      {leases.length === 0 ? (
        <EmptyState
          title="No leases yet"
          description="Create a tenant, then add this apartment’s first lease."
          actionHref={landlordRoutes.newLease(apartmentId)}
          actionLabel="Create lease"
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
                      <Badge tone={lease.status}>{lease.status}</Badge>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link href={landlordRoutes.lease(apartmentId, lease.id)}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={landlordRoutes.leaseEdit(apartmentId, lease.id)}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
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
