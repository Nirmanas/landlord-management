"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { BackLink, PageHeader } from "@/components/shared";
import type { Apartment } from "@/lib/types";

function ApartmentForm({ apartment }: { apartment?: Apartment }) {
  const [form, setForm] = useState<Apartment>(
    apartment ?? {
      id: "",
      name: "",
      address: "",
      city: "",
      postalCode: "",
      bedrooms: 1,
      bathrooms: 1,
      notes: "",
    },
  );
  const set = (key: keyof Apartment, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Property information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Apartment name">
            <Input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Apartment name"
            />
          </Field>
          <Field label="Street address">
            <Input
              required
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street address"
            />
          </Field>
          <Field label="City">
            <Input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="Postal code">
            <Input
              required
              value={form.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
            />
          </Field>
          <Field label="Bedrooms">
            <Input
              required
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", Number(e.target.value))}
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              required
              type="number"
              min="0.5"
              step="0.5"
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", Number(e.target.value))}
            />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Access details, features, or other notes"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link
          href={
            apartment
              ? `/landlord/apartments/${apartment.id}`
              : "/landlord/apartments"
          }
        >
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="button" disabled>
          {apartment ? "Save changes" : "Create apartment"}
        </Button>
      </div>
    </form>
  );
}

export default function Page() {
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/apartments" />
      <PageHeader
        title="New apartment"
        description="Keep property information clear and easy to reference."
      />
      <ApartmentForm />
    </div>
  );
}
