"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveTenant } from "@/app/actions";
import { useAppData } from "@/components/data-provider";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/lib/types";

function TenantForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [name, setName] = useState(`${tenant.firstName} ${tenant.lastName}`.trim());
  const [phoneNumber, setPhoneNumber] = useState(tenant.phone);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await saveTenant(tenant.id, { name, phoneNumber });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.push(`/landlord/tenants/${tenant.id}`); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-5">
    <Card><CardHeader><CardTitle>Tenant information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <Field label="Name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Phone number"><Input required type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></Field>
    </CardContent></Card>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
  </form>;
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const data = useAppData();
  const tenant = data.tenants.find((item) => item.id === id);
  if (!tenant) return <NotFoundState noun="Tenant" href="/landlord/tenants" />;
  if (tenant.archivedAt) return <NotFoundState noun="Active tenant" href={`/landlord/tenants/${id}`} />;
  return <div className="space-y-6"><BackLink href={`/landlord/tenants/${id}`} /><PageHeader title="Edit tenant" description="Update the contact details used across leases and payments." /><TenantForm tenant={tenant} /></div>;
}
