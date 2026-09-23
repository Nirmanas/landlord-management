"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { BackLink, PageHeader } from "@/components/shared";
import type { Tenant } from "@/lib/types";

type TenantFields = { name: string; phoneNumber: string };

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
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/tenants" />
      <PageHeader
        title="New tenant"
        description="Add the contact information used across leases and payments."
      />
      <TenantForm />
    </div>
  );
}
