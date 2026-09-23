"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { formatCurrency } from "@/lib/domain";
import { useParams } from "next/navigation";
import type { Lease } from "@/lib/types";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

function PaymentPeriodForm({ lease }: { lease: Lease }) {
  const [form, setForm] = useState({ startDate: "", endDate: "", dueDate: "" });
  return (
    <form className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Period dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
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
          <Field label="Due date">
            <Input
              required
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </Field>
        </CardContent>
      </Card>
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        This will create {lease.tenantIds.length} payment record
        {lease.tenantIds.length === 1 ? "" : "s"} totalling{" "}
        {formatCurrency(lease.totalRentCents)}. Amounts are saved as a snapshot.
      </div>

      <div className="flex justify-end gap-3">
        <Link href={`/landlord/leases/${lease.id}`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="button" disabled>
          Create payment period
        </Button>
      </div>
    </form>
  );
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const data = emptyData;
  const lease = data.leases.find((item) => item.id === id);
  if (!lease) return <NotFoundState noun="Lease" href="/landlord/leases" />;
  return (
    <div className="space-y-6">
      <BackLink href={`/landlord/leases/${id}`} />
      <PageHeader
        title="Create payment period"
        description="Generate a fixed payment record for every tenant on this lease."
      />
      <PaymentPeriodForm lease={lease} />
    </div>
  );
}
