"use client";

import { useAppData, useApiResource } from "@/components/data-provider";
import { ConfirmPaymentButton } from "@/components/action-buttons";


import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { TenantPayment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form-controls";
import {
  DateRange,
  EmptyState,
  PageHeader,
  PaymentBadge,
} from "@/components/shared";
import { formatCurrency, formatDate } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";

const tableClass = "w-full min-w-175 text-left text-sm";
const thClass =
  "border-b border-strong-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tdClass = "border-b border-border px-4 py-4 text-soft-foreground";

export default function Page() {
  const data = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = {
    apartment: searchParams.get("apartment") ?? "",
    lease: searchParams.get("lease") ?? "",
    tenant: searchParams.get("tenant") ?? "",
    period: searchParams.get("period") ?? "",
    status: searchParams.get("status") ?? "",
  };
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ""));
  const { data: payments, loading, error, reload } = useApiResource<TenantPayment[]>(`/api/landlord/payments${query.size ? `?${query}` : ""}`);
  const rows = payments ?? [];
  const set = (key: keyof typeof filters, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/landlord/payments${params.size ? `?${params}` : ""}`, { scroll: false });
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Review every tenant payment and confirm reported transfers."
      />
      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            aria-label="Filter by apartment"
            value={filters.apartment}
            onChange={(e) => set("apartment", e.target.value)}
          >
            <option value="">All apartments</option>
            {data.apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by lease"
            value={filters.lease}
            onChange={(e) => set("lease", e.target.value)}
          >
            <option value="">All leases</option>
            {data.leases.map((l) => (
              <option key={l.id} value={l.id}>
                {data.apartments.find((a) => a.id === l.apartmentId)?.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by tenant"
            value={filters.tenant}
            onChange={(e) => set("tenant", e.target.value)}
          >
            <option value="">All tenants</option>
            {data.tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {tenantName(t)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by period"
            value={filters.period}
            onChange={(e) => set("period", e.target.value)}
          >
            <option value="">All periods</option>
            {data.paymentPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {formatDate(p.startDate)}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </Select>
        </CardContent>
      </Card>
      {loading ? <p role="status">Loading payments…</p> : error ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" onClick={reload}>Retry</Button>
        </div>
      ) : rows.length ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Tenant</th>
                  <th className={thClass}>Apartment</th>
                  <th className={thClass}>Period / due</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((payment) => {
                  const tenant = data.tenants.find(
                    (t) => t.id === payment.tenantId,
                  );
                  const lease = data.leases.find(
                    (l) => l.id === payment.leaseId,
                  );
                  const apartment = data.apartments.find(
                    (a) => a.id === lease?.apartmentId,
                  );
                  const period = data.paymentPeriods.find(
                    (p) => p.id === payment.paymentPeriodId,
                  );
                  return (
                    <tr key={payment.id}>
                      <td className={tdClass}>
                        <p className="font-medium text-foreground">
                          {tenant && tenantName(tenant)}
                        </p>
                      </td>
                      <td className={tdClass}>{apartment?.name}</td>
                      <td className={tdClass}>
                        {period && (
                          <>
                            <DateRange
                              start={period.startDate}
                              end={period.endDate}
                            />
                            <p className="text-xs text-muted-foreground">
                              Due {formatDate(period.dueDate)}
                            </p>
                          </>
                        )}
                      </td>
                      <td className={tdClass}>
                        {formatCurrency(payment.amountCents)}
                      </td>
                      <td className={tdClass}>
                        <PaymentBadge payment={payment} period={period} />
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">{lease && period && (
                          <Link
                            href={landlordRoutes.period(
                              lease.apartmentId,
                              lease.id,
                              period.id,
                            )}
                            className="font-medium text-brand hover:underline"
                          >
                            View period
                          </Link>
                        )}{payment.status === "pending" && <ConfirmPaymentButton id={payment.id} payment={payment} onConfirmed={reload} />}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title={
            query.size
              ? "No matching payments"
              : "No payments yet"
          }
          description={
            query.size
              ? "Try clearing one or more filters."
              : "Create a lease and payment period to generate tenant payments."
          }
        />
      )}
    </div>
  );
}
