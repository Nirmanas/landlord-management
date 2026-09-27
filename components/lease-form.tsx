"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveLease } from "@/app/actions";
import { useAppData } from "@/components/data-provider";
import { formatCurrency, splitRent, tenantName } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";
import type { Apartment, Lease } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form-controls";

export function LeaseForm({ apartment, lease }: { apartment: Apartment; lease?: Lease }) {
  const data = useAppData();
  const router = useRouter();
  const [startDate, setStartDate] = useState(lease?.startDate ?? "");
  const [endDate, setEndDate] = useState(lease?.endDate ?? "");
  const [rentalPrice, setRentalPrice] = useState(lease ? String(lease.totalRentCents / 100) : "");
  const [tenantIds, setTenantIds] = useState(lease?.tenantIds ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cents = Math.round(Number(rentalPrice) * 100);
  const shares = splitRent(cents, tenantIds);
  const availableTenants = data.tenants.filter((tenant) => !tenant.archivedAt && !tenantIds.includes(tenant.id));
  function addTenant(id: string) {
    if (id) setTenantIds((current) => current.includes(id) ? current : [...current, id]);
  }
  function removeTenant(id: string) {
    setTenantIds((current) => current.filter((value) => value !== id));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await saveLease(apartment.id, { startDate, endDate, rentalPrice: cents, tenantIds }, lease?.id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.push(landlordRoutes.lease(apartment.id, result.id!)); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-5">
    <Card><CardHeader><CardTitle>Lease information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <Field label="Apartment"><p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">{apartment.name}</p></Field>
      <Field label="Start date"><Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
      <Field label="End date"><Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
      <Field label="Total rent"><Input type="number" min="0.01" step="0.01" required value={rentalPrice} onChange={(e) => setRentalPrice(e.target.value)} /></Field>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Assigned tenants</CardTitle></CardHeader><CardContent className="space-y-3">
      {!data.tenants.some((tenant) => !tenant.archivedAt) && <p className="text-sm text-zinc-500">No registered tenants are available yet. Tenants appear here after they create an account.</p>}
      {data.tenants.some((tenant) => !tenant.archivedAt) && <Field label="Add a registered tenant">
        <Select aria-label="Add a registered tenant" value="" onChange={(event) => addTenant(event.target.value)} disabled={!availableTenants.length}>
          <option value="">{availableTenants.length ? "Select a tenant" : "All available tenants added"}</option>
          {availableTenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenantName(tenant)} ({tenant.email})</option>)}
        </Select>
      </Field>}
      {tenantIds.map((id) => {
        const tenant = data.tenants.find((item) => item.id === id);
        const share = shares.find((item) => item.tenantId === id);
        return tenant && <div key={id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span><span className="font-medium">{tenantName(tenant)}</span>{tenant.archivedAt && <span className="ml-2 text-zinc-500">Archived</span>}{share && <span className="ml-3 text-emerald-800">{formatCurrency(share.amountCents)}</span>}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => removeTenant(id)}>Remove</Button>
        </div>;
      })}
    </CardContent></Card>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex justify-end gap-3"><Link href={lease ? landlordRoutes.lease(apartment.id, lease.id) : landlordRoutes.leases(apartment.id)}><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" disabled={busy}>{busy ? "Saving…" : lease ? "Save changes" : "Create lease"}</Button></div>
  </form>;
}
