"use client";

import { useAppData } from "@/components/data-provider";
import { useState } from "react";


import Link from "next/link";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared";

export default function Page() {
  const data = useAppData();
  const [archived, setArchived] = useState(false);
  const apartments = data.apartments.filter((item) => Boolean(item.archivedAt) === archived);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Apartments"
        description="Manage the properties in your portfolio."
        actionHref="/landlord/apartments/new"
        actionLabel="New apartment"
      />
      <Button variant="outline" type="button" onClick={() => setArchived((value) => !value)}>{archived ? "Show active" : "Show archived"}</Button>
      {apartments.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apartments.map((apartment) => {
            const leases = data.leases.filter(
              (l) => l.apartmentId === apartment.id,
            );
            const active = leases.find((l) => l.status === "active" && !l.archivedAt);
            return (
              <Card key={apartment.id}>
                <CardHeader>
                  <div className="mb-3 grid size-10 place-items-center rounded-lg bg-emerald-50">
                    <Building2 className="size-5 text-emerald-700" />
                  </div>
                  <CardTitle>{apartment.name}</CardTitle>
                  <p className="text-sm text-zinc-500">
                    {apartment.address}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 flex justify-end text-sm">
                    {apartment.archivedAt ? (
                      <Badge>Archived</Badge>
                    ) : active ? (
                      <Badge tone="active">Active lease</Badge>
                    ) : (
                      <Badge>No active lease</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/landlord/apartments/${apartment.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        View
                      </Button>
                    </Link>
                    {!apartment.archivedAt && <Link
                      href={`/landlord/apartments/${apartment.id}/edit`}
                      className="flex-1"
                    >
                      <Button variant="secondary" className="w-full">
                        Edit
                      </Button>
                    </Link>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={archived ? "No archived apartments" : "No apartments yet"}
          description={archived ? "Archived apartments will appear here." : "Create your first property to start managing leases."}
          actionHref={archived ? undefined : "/landlord/apartments/new"}
          actionLabel={archived ? undefined : "Create apartment"}
        />
      )}
    </div>
  );
}
