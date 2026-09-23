"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Field, Input } from "@/components/ui/form-controls";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { formatCurrency, splitRent } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import { useParams } from "next/navigation";
import type { Apartment, Lease } from "@/lib/types";
import { landlordRoutes } from "@/lib/routes";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

function LeaseForm({ lease, apartment }: { lease: Lease; apartment: Apartment }) {
  const data = emptyData;
  const [form, setForm] = useState<Lease>(lease);
  const set = <K extends keyof Lease>(key: K, value: Lease[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const shares = splitRent(form.totalRentCents, form.tenantIds);
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
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value as Lease["status"])}
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </Select>
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
              value={form.totalRentCents ? form.totalRentCents / 100 : ""}
              onChange={(e) =>
                set("totalRentCents", Math.round(Number(e.target.value) * 100))
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
                      {tenant.email}
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
        <Link href={landlordRoutes.lease(apartment.id, lease.id)}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="button" disabled>
          Save changes
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
  const record = data.leases.find(
    (item) => item.id === leaseId && item.apartmentId === apartmentId,
  );
  if (!record)
    return <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />;
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.lease(apartmentId, record.id)} />
      <PageHeader
        title="Edit lease"
        description={`Set the rent, term, and tenant assignments for ${apartment.name}.`}
      />
      <LeaseForm lease={record} apartment={apartment} />
    </div>
  );
}
