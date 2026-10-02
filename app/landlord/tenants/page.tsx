"use client";

import { useApiCollection } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";

import { useState } from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared";
import { tenantName } from "@/lib/domain";

const tableClass = "w-full min-w-175 text-left text-sm";
const thClass =
  "border-b border-strong-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tdClass = "border-b border-border px-4 py-4 text-soft-foreground";

export default function Page() {
  const [archived, setArchived] = useState(false);
  const leasesRequest = useApiCollection("landlord", "leases");
  const tenantsRequest = useApiCollection("landlord", "tenants");
  const resources = [leasesRequest, tenantsRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const leaseRecords = leasesRequest.data ?? [];
  const tenantRecords = tenantsRequest.data ?? [];
  const tenants = tenantRecords.filter(
    (item) => Boolean(item.archivedAt) === archived,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Registered tenant accounts are available here and in the lease selector."
      />
      <Button
        variant="outline"
        type="button"
        onClick={() => setArchived((value) => !value)}
      >
        {archived ? "Show active" : "Show archived"}
      </Button>
      {tenants.length ? (
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
                {tenants.map((tenant) => {
                  const leases = leaseRecords.filter((l) =>
                    l.tenantIds.includes(tenant.id),
                  );
                  return (
                    <tr key={tenant.id}>
                      <td className={tdClass}>
                        <p className="font-medium text-foreground">
                          {tenantName(tenant)}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <p>{tenant.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.phone}
                        </p>
                      </td>
                      <td className={tdClass}>{leases.length}</td>
                      <td className={`${tdClass} text-right`}>
                        <Link href={`/landlord/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        {!tenant.archivedAt && (
                          <Link href={`/landlord/tenants/${tenant.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                        )}
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
          title={archived ? "No archived tenants" : "No tenants yet"}
          description={
            archived
              ? "Archived tenants will appear here."
              : "Tenants will appear after they create an account."
          }
        />
      )}
    </div>
  );
}
