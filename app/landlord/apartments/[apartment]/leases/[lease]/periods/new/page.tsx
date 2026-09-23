"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { useParams } from "next/navigation";
import type { Lease } from "@/lib/types";
import { landlordRoutes } from "@/lib/routes";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

function PeriodForm({ lease }: { lease: Lease }) {
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  return (
    <form className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Period information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Period name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Period start">
            <Input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="Period end">
            <Input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Link href={landlordRoutes.lease(lease.apartmentId, lease.id)}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="button" disabled>
          Create period
        </Button>
      </div>
    </form>
  );
}

export default function Page() {
  const { apartment: apartmentId, lease: leaseId } = useParams<{
    apartment: string;
    lease: string;
  }>();
  const data = emptyData;
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const lease = data.leases.find(
    (item) => item.id === leaseId && item.apartmentId === apartmentId,
  );
  if (!lease)
    return <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />;
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.lease(apartmentId, leaseId)} />
      <PageHeader
        title="Create period"
        description="Set the name and dates for this period."
      />
      <PeriodForm lease={lease} />
    </div>
  );
}
