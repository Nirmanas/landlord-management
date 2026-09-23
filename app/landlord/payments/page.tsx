"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form-controls";
import {
  DateRange,
  EmptyState,
  PageHeader,
  PaymentBadge,
} from "@/components/shared";
import { formatCurrency, formatDate, isOverdue } from "@/lib/domain";
import { tenantName } from "@/lib/domain";
import { landlordRoutes } from "@/lib/routes";

const emptyData: AppData = {
  apartments: [],
  tenants: [],
  leases: [],
  paymentPeriods: [],
  tenantPayments: [],
};

const tableClass = "w-full min-w-175 text-left text-sm";
const thClass =
  "border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500";
const tdClass = "border-b border-zinc-100 px-4 py-4 text-zinc-700";

export default function Page() {
  const data = emptyData;
  const [filters, setFilters] = useState({
    apartment: "",
    lease: "",
    tenant: "",
    period: "",
    status: "",
  });
  const rows = useMemo(
    () =>
      data.tenantPayments.filter((payment) => {
        const lease = data.leases.find((l) => l.id === payment.leaseId);
        const period = data.paymentPeriods.find(
          (p) => p.id === payment.paymentPeriodId,
        );
        const displayStatus = isOverdue(payment, period)
          ? "overdue"
          : payment.status;
        return (
          (!filters.apartment || lease?.apartmentId === filters.apartment) &&
          (!filters.lease || payment.leaseId === filters.lease) &&
          (!filters.tenant || payment.tenantId === filters.tenant) &&
          (!filters.period || payment.paymentPeriodId === filters.period) &&
          (!filters.status || displayStatus === filters.status)
        );
      }),
    [data, filters],
  );
  const set = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
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
          </Select>
        </CardContent>
      </Card>
      {rows.length ? (
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
                        <p className="font-medium text-zinc-900">
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
                            <p className="text-xs text-zinc-500">
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
                        {lease && period && (
                          <Link
                            href={landlordRoutes.period(
                              lease.apartmentId,
                              lease.id,
                              period.id,
                            )}
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            View period
                          </Link>
                        )}
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
            data.tenantPayments.length
              ? "No matching payments"
              : "No payments yet"
          }
          description={
            data.tenantPayments.length
              ? "Try clearing one or more filters."
              : "Create a lease and payment period to generate tenant payments."
          }
        />
      )}
    </div>
  );
}
