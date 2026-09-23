"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/shared";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const data = emptyData;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Apartments"
        description="Manage the properties in your portfolio."
        actionHref="/landlord/apartments/new"
        actionLabel="New apartment"
      />
      {data.apartments.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.apartments.map((apartment) => {
            const leases = data.leases.filter(
              (l) => l.apartmentId === apartment.id,
            );
            const active = leases.find((l) => l.status === "active");
            return (
              <Card key={apartment.id}>
                <CardHeader>
                  <div className="mb-3 grid size-10 place-items-center rounded-lg bg-emerald-50">
                    <Building2 className="size-5 text-emerald-700" />
                  </div>
                  <CardTitle>{apartment.name}</CardTitle>
                  <p className="text-sm text-zinc-500">
                    {apartment.address}, {apartment.city}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-5 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">
                      {apartment.bedrooms} bed · {apartment.bathrooms} bath
                    </span>
                    {active ? (
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
                    <Link
                      href={`/landlord/apartments/${apartment.id}/edit`}
                      className="flex-1"
                    >
                      <Button variant="secondary" className="w-full">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No apartments yet"
          description="Create your first property to start managing leases."
          actionHref="/landlord/apartments/new"
          actionLabel="Create apartment"
        />
      )}
    </div>
  );
}
