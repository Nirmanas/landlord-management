"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared";
import { tenantName } from "@/lib/domain";

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
        title="Tenants"
        description="Create and manage the people assigned to your leases."
        actionHref="/landlord/tenants/new"
        actionLabel="New tenant"
      />
      {data.tenants.length ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Tenant</th>
                  <th className={thClass}>Contact</th>
                  <th className={thClass}>Assigned leases</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((tenant) => {
                  const leases = data.leases.filter((l) =>
                    l.tenantIds.includes(tenant.id),
                  );
                  return (
                    <tr key={tenant.id}>
                      <td className={tdClass}>
                        <p className="font-medium text-zinc-900">
                          {tenantName(tenant)}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <p>{tenant.email}</p>
                        <p className="text-xs text-zinc-500">{tenant.phone}</p>
                      </td>
                      <td className={tdClass}>{leases.length}</td>
                      <td className={`${tdClass} text-right`}>
                        <Link href={`/landlord/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/landlord/tenants/${tenant.id}/edit`}>
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
      ) : (
        <EmptyState
          title="No tenants yet"
          description="Add a tenant before creating a lease."
          actionHref="/landlord/tenants/new"
          actionLabel="Create tenant"
        />
      )}
    </div>
  );
}
