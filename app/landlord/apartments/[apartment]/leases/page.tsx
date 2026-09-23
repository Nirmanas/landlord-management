"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRange, EmptyState, PageHeader } from "@/components/shared";
import { formatCurrency } from "@/lib/domain";

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
  const data = emptyData;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description="Track agreements, rents, and tenant assignments."
        actionHref="/landlord/leases/new"
        actionLabel="New lease"
      />
      {data.leases.length === 0 ? (
        <EmptyState
          title="No leases yet"
          description="Create an apartment and tenant, then add your first lease."
          actionHref="/landlord/leases/new"
          actionLabel="Create lease"
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Apartment</th>
                  <th className={thClass}>Dates</th>
                  <th className={thClass}>Rent</th>
                  <th className={thClass}>Tenants</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {data.leases.map((lease) => {
                  const apartment = data.apartments.find(
                    (a) => a.id === lease.apartmentId,
                  );
                  return (
                    <tr key={lease.id}>
                      <td className={tdClass}>
                        <p className="font-medium text-zinc-900">
                          {apartment?.name}
                        </p>
                      </td>
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
                        <Link href={`/landlord/leases/${lease.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/landlord/leases/${lease.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
