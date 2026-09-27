"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPeriod } from "@/app/actions";
import { useAppData } from "@/components/data-provider";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";
import { landlordRoutes } from "@/lib/routes";
import type { Lease } from "@/lib/types";

function PeriodForm({ lease }: { lease: Lease }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await createPeriod(lease.id, { name, startDate, endDate });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.push(landlordRoutes.period(lease.apartmentId, lease.id, result.id!)); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-5"><Card><CardHeader><CardTitle>Period information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3">
    <Field label="Period name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
    <Field label="Period start"><Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
    <Field label="Period end and due date"><Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
  </CardContent></Card>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create period"}</Button></form>;
}

export default function Page() {
  const { apartment: apartmentId, lease: leaseId } = useParams<{ apartment: string; lease: string }>();
  const data = useAppData();
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment) return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const lease = data.leases.find((item) => item.id === leaseId && item.apartmentId === apartmentId);
  if (!lease) return <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />;
  if (lease.archivedAt || apartment.archivedAt) return <NotFoundState noun="Active lease" href={landlordRoutes.lease(apartmentId, leaseId)} />;
  return <div className="space-y-6"><BackLink href={landlordRoutes.lease(apartmentId, leaseId)} /><PageHeader title="Create period" description="Set the name and dates; rent is due at the end of the period." /><PeriodForm lease={lease} /></div>;
}
