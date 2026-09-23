"use client";

import type { AppData } from "@/lib/types";
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

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const { apartment: apartmentId, lease: leaseId, period: periodId } =
    useParams<{ apartment: string; lease: string; period: string }>();
  const data = emptyData;
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  const lease = data.leases.find(
    (item) => item.id === leaseId && item.apartmentId === apartmentId,
  );
  if (!lease)
    return <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />;
  const period = data.paymentPeriods.find(
    (item) => item.id === periodId && item.leaseId === leaseId,
  );
  if (!period)
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

  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.lease(apartmentId, leaseId)}>
        {apartment.name} lease
      </BackLink>
      <PageHeader
        title="Payment period"
        description={<DateRange start={period.startDate} end={period.endDate} />}
      />
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
        <h2 className="mb-4 text-lg font-semibold text-zinc-950">
          Tenant payments
        </h2>
        {payments.length ? (
          <Card>
            <CardContent className="divide-y divide-zinc-100 p-0">
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
                      <p className="font-medium text-zinc-900">
                        {tenant ? tenantName(tenant) : "Unknown tenant"}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatCurrency(payment.amountCents)}
                      </p>
                    </div>
                    <PaymentBadge payment={payment} period={period} />
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
