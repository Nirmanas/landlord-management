"use client";

import {
  useApiItem,
  useApiCollection,
  useApiResource,
} from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";
import type { TenantPayment } from "@/lib/types";

import { landlordApi, apiRequest } from "@/lib/api-client";
import type { PaymentPeriod } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import {
  ArchiveButton,
  ConfirmPaymentButton,
} from "@/components/action-buttons";

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
  const {
    apartment: apartmentId,
    lease: leaseId,
    period: periodId,
  } = useParams<{ apartment: string; lease: string; period: string }>();
  const tenantsRequest = useApiCollection("landlord", "tenants");
  const paymentsRequest = useApiResource<TenantPayment[]>(
    `/api/landlord/payments?lease=${encodeURIComponent(leaseId)}&period=${encodeURIComponent(periodId)}`,
  );
  const apartmentRequest = useApiItem("landlord", "apartments", apartmentId);
  const leaseRequest = useApiItem("landlord", "leases", leaseId, apartmentId);
  const periodRequest = useApiItem(
    "landlord",
    "periods",
    periodId,
    apartmentId,
    leaseId,
  );
  const resources = [
    tenantsRequest,
    paymentsRequest,
    apartmentRequest,
    leaseRequest,
    periodRequest,
  ];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const tenantRecords = tenantsRequest.data ?? [];
  const payments = paymentsRequest.data ?? [];
  const { data: period, reload: reloadPeriod } = periodRequest;
  const apartment = apartmentRequest.data;
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const lease = leaseRequest.data;
  if (!lease)
    return (
      <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />
    );
  if (!period)
    return (
      <NotFoundState
        noun="Payment period"
        href={landlordRoutes.lease(apartmentId, leaseId)}
      />
    );
  const total = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await apiRequest<PaymentPeriod>(
        landlordApi.periods(apartmentId, leaseId, periodId),
        "PUT",
        { name },
      );
      reloadPeriod();
      setEditing(false);
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? cause.message : "The request failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.lease(apartmentId, leaseId)}>
        {apartment.name} lease
      </BackLink>
      <PageHeader
        title={period.name}
        description={
          <>
            <DateRange start={period.startDate} end={period.endDate} />
            {period.archivedAt ? " · Archived" : ""}
          </>
        }
      />
      {!period.archivedAt &&
        !lease.archivedAt &&
        !apartment.archivedAt &&
        (editing ? (
          <form
            onSubmit={saveName}
            className="flex max-w-md flex-wrap items-center gap-2"
          >
            <Input
              aria-label="Period name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save name"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            {saveError && <p role="alert">{saveError}</p>}
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setName(period.name);
              setEditing(true);
            }}
          >
            Edit period name
          </Button>
        ))}
      {!period.archivedAt && !lease.archivedAt && !apartment.archivedAt && (
        <ArchiveButton
          kind="period"
          id={periodId}
          apartmentId={apartmentId}
          leaseId={leaseId}
          destination={landlordRoutes.lease(apartmentId, leaseId)}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Period summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-3">
            <DetailItem label="Due date">
              {formatDate(period.dueDate)}
            </DetailItem>
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
                const tenant = tenantRecords.find(
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
                    <div className="flex items-center gap-2">
                      <PaymentBadge payment={payment} period={period} />
                      {payment.status === "pending" && (
                        <ConfirmPaymentButton
                          id={payment.id}
                          payment={payment}
                          apartment={apartment}
                          period={period}
                          tenant={tenant}
                          onConfirmed={paymentsRequest.reload}
                        />
                      )}
                    </div>
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
