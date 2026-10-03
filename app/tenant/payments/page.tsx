"use client";

import {
  useApiCollection,
  useApiResource,
} from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";
import type { Tenant } from "@/lib/types";

import { ReportPaymentButton } from "@/components/action-buttons";

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

export default function Page() {
  const apartmentsRequest = useApiCollection("tenant", "apartments");
  const leasesRequest = useApiCollection("tenant", "leases");
  const profileRequest = useApiResource<Tenant | null>("/api/tenant/profile");
  const periodsRequest = useApiCollection("tenant", "periods");
  const paymentsRequest = useApiCollection("tenant", "payments");
  const resources = [
    apartmentsRequest,
    leasesRequest,
    profileRequest,
    periodsRequest,
    paymentsRequest,
  ];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const apartmentRecords = apartmentsRequest.data ?? [];
  const leaseRecords = leasesRequest.data ?? [];
  const periodRecords = periodsRequest.data ?? [];
  const payments = paymentsRequest.data ?? [];
  const tenant = profileRequest.data;
  if (!tenant)
    return (
      <EmptyState
        title="Tenant profile unavailable"
        description="Your account does not have a tenant profile."
      />
    );
  const sorted = [...payments].sort((a, b) => {
    const aDate =
      periodRecords.find((p) => p.id === a.paymentPeriodId)?.dueDate ?? "";
    const bDate =
      periodRecords.find((p) => p.id === b.paymentPeriodId)?.dueDate ?? "";
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
            const period = periodRecords.find(
              (p) => p.id === payment.paymentPeriodId,
            );
            const lease = leaseRecords.find((l) => l.id === payment.leaseId);
            const apartment = apartmentRecords.find(
              (a) => a.id === lease?.apartmentId,
            );
            return (
              <Card key={payment.id}>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid size-11 place-items-center rounded-xl bg-muted">
                    <CreditCard className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {apartment?.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(payment.amountCents)}
                    </p>
                    <PaymentBadge payment={payment} period={period} />
                    {(payment.status === "unpaid" ||
                      payment.status === "failed") && (
                      <ReportPaymentButton
                        id={payment.id}
                        payment={payment}
                        apartment={apartment}
                        period={period}
                        onReported={paymentsRequest.reload}
                      />
                    )}
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
