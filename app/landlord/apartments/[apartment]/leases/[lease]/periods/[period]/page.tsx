"use client";

import { useAppData, useApiItem, useReloadAppData } from "@/components/data-provider";
import { landlordApi, apiRequest } from "@/lib/api-client";
import type { PaymentPeriod } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { ArchiveButton, ConfirmPaymentButton } from "@/components/action-buttons";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BackLink,
  DateRange,
  DetailItem,
  EmptyState,
  NotFoundState,
  PageHeader,
  PaymentBadge,
} from "@/components/shared";
import { formatCurrency, formatDate, tenantName } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const reloadData = useReloadAppData();
  const { apartment: apartmentId, lease: leaseId, period: periodId } =
    useParams<{ apartment: string; lease: string; period: string }>();
  const data = useAppData();
  const { data: period, loading, error, reload: reloadPeriod } = useApiItem("periods", periodId, apartmentId, leaseId);
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const lease = data.leases.find(
    (item) => item.id === leaseId && item.apartmentId === apartmentId,
  );
  if (!lease)
    return <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />;
  if (loading) return <p role="status">Loading payment period…</p>;
  if (error && !period) return <p role="alert">{error}</p>;
  if (!period || period.leaseId !== leaseId)
    return (
      <NotFoundState
        noun="Payment period"
        href={landlordRoutes.lease(apartmentId, leaseId)}
      />
    );
  const payments = data.tenantPayments.filter(
    (payment) =>
      payment.paymentPeriodId === periodId && payment.leaseId === leaseId,
  );
  const total = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  async function saveName(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setSaveError("");
    try {
      await apiRequest<PaymentPeriod>(landlordApi.periods(apartmentId, leaseId, periodId), "PUT", { name });
      await reloadData();
      reloadPeriod();
      setEditing(false);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "The request failed.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.lease(apartmentId, leaseId)}>
        {apartment.name} lease
      </BackLink>
      <PageHeader
        title={period.name}
        description={<><DateRange start={period.startDate} end={period.endDate} />{period.archivedAt ? " · Archived" : ""}</>}
      />
      {!period.archivedAt && !lease.archivedAt && !apartment.archivedAt && (editing ?
        <form onSubmit={saveName} className="flex max-w-md flex-wrap items-center gap-2">
          <Input aria-label="Period name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save name"}</Button>
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          {saveError && <p role="alert">{saveError}</p>}
        </form> : <Button type="button" variant="outline" onClick={() => { setName(period.name); setEditing(true); }}>Edit period name</Button>)}
      {!period.archivedAt && !lease.archivedAt && !apartment.archivedAt && <ArchiveButton kind="period" id={periodId} apartmentId={apartmentId} leaseId={leaseId} destination={landlordRoutes.lease(apartmentId, leaseId)} />}
      <Card>
        <CardHeader>
          <CardTitle>Period summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-3">
            <DetailItem label="Due date">{formatDate(period.dueDate)}</DetailItem>
            <DetailItem label="Tenant payments">{payments.length}</DetailItem>
            <DetailItem label="Total">{formatCurrency(total)}</DetailItem>
          </dl>
        </CardContent>
      </Card>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Tenant payments
        </h2>
        {payments.length ? (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {payments.map((payment) => {
                const tenant = data.tenants.find(
                  (item) => item.id === payment.tenantId,
                );
                return (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {tenant ? tenantName(tenant) : "Unknown tenant"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(payment.amountCents)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2"><PaymentBadge payment={payment} period={period} />{payment.status === "pending" && <ConfirmPaymentButton id={payment.id} />}</div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No tenant payments"
            description="No tenant payment records are linked to this period."
          />
        )}
      </div>
    </div>
  );
}
