"use client";

import type { AppData } from "@/lib/types";

import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DateRange,
  EmptyState,
  PageHeader,
  PaymentBadge,
} from "@/components/shared";
import { formatCurrency, formatDate } from "@/lib/domain";
import { tenantName } from "@/lib/domain";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

export default function Page() {
  const data = emptyData;
  const tenant = data.tenants[0];
  const payments = data.tenantPayments.filter((p) => p.tenantId === tenant?.id);
  if (!tenant)
    return (
      <EmptyState
        title="No tenant selected"
        description="Select a tenant to view their payments."
      />
    );
  const sorted = [...payments].sort((a, b) => {
    const aDate =
      data.paymentPeriods.find((p) => p.id === a.paymentPeriodId)?.dueDate ??
      "";
    const bDate =
      data.paymentPeriods.find((p) => p.id === b.paymentPeriodId)?.dueDate ??
      "";
    return bDate.localeCompare(aDate);
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="My payments"
        description={`Payment history and upcoming rent for ${tenantName(tenant)}.`}
      />
      {sorted.length ? (
        <div className="space-y-4">
          {sorted.map((payment) => {
            const period = data.paymentPeriods.find(
              (p) => p.id === payment.paymentPeriodId,
            );
            const lease = data.leases.find((l) => l.id === payment.leaseId);
            const apartment = data.apartments.find(
              (a) => a.id === lease?.apartmentId,
            );
            return (
              <Card key={payment.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid size-11 place-items-center rounded-xl bg-zinc-100">
                    <CreditCard className="size-5 text-zinc-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">
                      {apartment?.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {period && (
                        <DateRange
                          start={period.startDate}
                          end={period.endDate}
                        />
                      )}{" "}
                      · Due {period ? formatDate(period.dueDate) : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <p className="text-lg font-semibold text-zinc-950">
                      {formatCurrency(payment.amountCents)}
                    </p>
                    <PaymentBadge payment={payment} period={period} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No payments yet"
          description="Payment records will appear after the landlord creates a period for your lease."
        />
      )}
    </div>
  );
}
