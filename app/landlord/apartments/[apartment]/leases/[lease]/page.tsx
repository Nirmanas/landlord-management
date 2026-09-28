"use client";

import { useAppData, useApiItem } from "@/components/data-provider";
import {
  ArchiveButton,
  ConfirmPaymentButton,
} from "@/components/action-buttons";
import { useState } from "react";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate, splitRent } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import { useParams } from "next/navigation";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const [showArchived, setShowArchived] = useState(false);
  const { apartment: apartmentId, lease: leaseId } = useParams<{
    apartment: string;
    lease: string;
  }>();
  const data = useAppData();
  const { data: lease, loading, error } = useApiItem("leases", leaseId);
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (loading) return <p role="status">Loading lease…</p>;
  if (error && !lease) return <p role="alert">{error}</p>;
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  if (!lease || lease.apartmentId !== apartmentId)
    return (
      <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />
    );
  const archivedLease = Boolean(lease.archivedAt || apartment.archivedAt);
  const periods = data.paymentPeriods
    .filter(
      (p) =>
        p.leaseId === leaseId &&
        Boolean(p.archivedAt || archivedLease) === showArchived,
    )
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const shares = splitRent(lease.totalRentCents, lease.tenantIds);
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.leases(apartmentId)}>All leases</BackLink>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={apartment.name}
          description={
            <DateRange start={lease.startDate} end={lease.endDate} />
          }
        />
        <div className="flex gap-2">
          {!archivedLease && (
            <Link href={landlordRoutes.leaseEdit(apartmentId, leaseId)}>
              <Button variant="outline">Edit lease</Button>
            </Link>
          )}
          {!archivedLease && (
            <Link href={landlordRoutes.newPeriod(apartmentId, leaseId)}>
              <Button>Create payment period</Button>
            </Link>
          )}
          {!archivedLease && (
            <ArchiveButton
              kind="lease"
              id={leaseId}
              destination={landlordRoutes.leases(apartmentId)}
            />
          )}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lease summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-5">
              <DetailItem label="Status">
                <Badge tone={archivedLease ? "neutral" : lease.status}>
                  {archivedLease ? "Archived" : lease.status}
                </Badge>
              </DetailItem>
              <DetailItem label="Total rent">
                {formatCurrency(lease.totalRentCents)}
              </DetailItem>
              <DetailItem label="Start">
                {formatDate(lease.startDate)}
              </DetailItem>
              <DetailItem label="End">{formatDate(lease.endDate)}</DetailItem>
            </dl>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenants and current shares</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {lease.tenantIds.map((tenantId) => {
              const tenant = data.tenants.find((t) => t.id === tenantId);
              const share = shares.find((s) => s.tenantId === tenantId);
              return (
                <div
                  key={tenantId}
                  className="rounded-lg border border-zinc-200 p-3"
                >
                  <p className="font-medium text-zinc-900">
                    {tenant ? tenantName(tenant) : "Unknown tenant"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-800">
                    {formatCurrency(share?.amountCents ?? 0)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-950">
          Payment periods
        </h2>
        <Button
          type="button"
          className="mb-2"
          variant="outline"
          onClick={() => setShowArchived((value) => !value)}
        >
          {showArchived ? "Show active" : "Show archived"}
        </Button>
        {periods.length ? (
          <div className="space-y-4">
            {periods.map((period) => {
              const payments = data.tenantPayments.filter(
                (p) => p.paymentPeriodId === period.id,
              );
              return (
                <Card key={period.id}>
                  <CardHeader className="border-b">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <CardTitle>{period.name}</CardTitle>
                        <p className="text-sm text-zinc-500">
                          <DateRange
                            start={period.startDate}
                            end={period.endDate}
                          />
                        </p>
                        <p className="text-sm text-zinc-500">
                          Due {formatDate(period.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-zinc-900">
                          {formatCurrency(
                            payments.reduce((sum, p) => sum + p.amountCents, 0),
                          )}
                        </p>
                        <Link
                          href={landlordRoutes.period(
                            apartmentId,
                            leaseId,
                            period.id,
                          )}
                        >
                          <Button variant="outline" size="sm">
                            View period
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="divide-y divide-zinc-100 p-0">
                    {payments.map((payment) => {
                      const tenant = data.tenants.find(
                        (t) => t.id === payment.tenantId,
                      );
                      return (
                        <div
                          key={payment.id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-zinc-900">
                              {tenant ? tenantName(tenant) : "Unknown tenant"}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {formatCurrency(payment.amountCents)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <PaymentBadge payment={payment} period={period} />
                            {payment.status === "pending" && (
                              <ConfirmPaymentButton id={payment.id} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={showArchived ? "No archived periods" : "No payment periods"}
            description={
              showArchived
                ? "Archived periods will appear here."
                : "Create a payment period to generate tenant payment records."
            }
            actionHref={
              showArchived || archivedLease
                ? undefined
                : landlordRoutes.newPeriod(apartmentId, leaseId)
            }
            actionLabel={
              showArchived || archivedLease
                ? undefined
                : "Create payment period"
            }
          />
        )}
      </div>
    </div>
  );
}
