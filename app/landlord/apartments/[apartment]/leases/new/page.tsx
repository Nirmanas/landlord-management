"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { formatCurrency, splitRent } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import type { Apartment, Lease } from "@/lib/types";
import { landlordRoutes } from "@/lib/routes";
import { useParams } from "next/navigation";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

type LeaseFields = Pick<Lease, "startDate" | "endDate" | "tenantIds"> & {
  rentalPrice: number;
};

function LeaseForm({ apartment }: { apartment: Apartment }) {
  const data = emptyData;
  const [form, setForm] = useState<LeaseFields>({
    startDate: "",
    endDate: "",
    rentalPrice: 0,
    tenantIds: [],
  });
  const set = <K extends keyof LeaseFields>(key: K, value: LeaseFields[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const shares = splitRent(form.rentalPrice, form.tenantIds);
  function toggleTenant(id: string) {
    set(
      "tenantIds",
      form.tenantIds.includes(id)
        ? form.tenantIds.filter((item) => item !== id)
        : [...form.tenantIds, id],
    );
  }
  return (
    <form className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Lease information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Apartment">
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {apartment.name}
            </p>
          </Field>
          <Field label="Start date">
            <Input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="End date">
            <Input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
          <Field label="Total monthly rent">
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.rentalPrice ? form.rentalPrice / 100 : ""}
              onChange={(e) =>
                set("rentalPrice", Math.round(Number(e.target.value) * 100))
              }
            />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assigned tenants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.tenants.length === 0 && (
            <p className="text-sm text-zinc-500">
              No tenants yet.{" "}
              <Link
                href="/landlord/tenants/new"
                className="font-medium text-emerald-700 hover:underline"
              >
                Create a tenant
              </Link>{" "}
              before saving this lease.
            </p>
          )}
          {data.tenants.map((tenant) => {
            const share = shares.find((item) => item.tenantId === tenant.id);
            return (
              <label
                key={tenant.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.tenantIds.includes(tenant.id)}
                    onChange={() => toggleTenant(tenant.id)}
                    className="size-4 accent-emerald-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900">
                      {tenantName(tenant)}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {tenant.phone}
                    </span>
                  </span>
                </span>
                {share && (
                  <span className="text-sm font-semibold text-emerald-800">
                    {formatCurrency(share.amountCents)}
                  </span>
                )}
              </label>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href={landlordRoutes.leases(apartment.id)}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="button" disabled>
          Create lease
        </Button>
      </div>
    </form>
  );
}

export default function Page() {
  const { apartment: apartmentId } = useParams<{ apartment: string }>();
  const apartment = emptyData.apartments.find((item) => item.id === apartmentId);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.leases(apartmentId)} />
      <PageHeader
        title="New lease"
        description={`Set the rent, term, and tenant assignments for ${apartment.name}.`}
      />
      <LeaseForm apartment={apartment} />
    </div>
  );
}
