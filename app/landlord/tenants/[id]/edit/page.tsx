"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { useParams } from "next/navigation";
import type { Tenant } from "@/lib/types";

type TenantFields = { name: string; phoneNumber: string };

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

function TenantForm({ tenant }: { tenant?: Tenant }) {
  const [form, setForm] = useState<TenantFields>({
    name: tenant ? `${tenant.firstName} ${tenant.lastName}`.trim() : "",
    phoneNumber: tenant?.phone ?? "",
  });
  const set = (key: keyof TenantFields, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Tenant information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <Input
              required
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link
          href={tenant ? `/landlord/tenants/${tenant.id}` : "/landlord/tenants"}
        >
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="button" disabled>
          {tenant ? "Save changes" : "Create tenant"}
        </Button>
      </div>
    </form>
  );
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const data = emptyData;
  const record = data.tenants.find((item) => item.id === id);
  if (!record) return <NotFoundState noun="Tenant" href="/landlord/tenants" />;
  return (
    <div className="space-y-6">
      <BackLink href={`/landlord/tenants/${record.id}`} />
      <PageHeader
        title="Edit tenant"
        description="Add the contact information used across leases and payments."
      />
      <TenantForm tenant={record} />
    </div>
  );
}
