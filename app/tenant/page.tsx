"use client";

import type { AppData } from "@/lib/types";

import Link from "next/link";
import { Building2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DateRange,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/shared";
import { formatCurrency, formatDate, splitRent, todayISO } from "@/lib/domain";

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
  const leases = data.leases.filter((l) =>
    l.tenantIds.includes(tenant?.id ?? ""),
  );
  const currentLease =
    leases.find((l) => l.status === "active") ??
    leases.find((l) => l.status === "upcoming") ??
    leases[0];
  const apartment = data.apartments.find(
    (a) => a.id === currentLease?.apartmentId,
  );
  const share = currentLease
    ? splitRent(currentLease.totalRentCents, currentLease.tenantIds).find(
        (s) => s.tenantId === tenant?.id,
      )
    : undefined;
  const payments = data.tenantPayments.filter((p) => p.tenantId === tenant?.id);
  if (!tenant)
    return (
      <EmptyState
        title="No tenant selected"
        description="Create a tenant in landlord mode, then return here to preview their experience."
      />
    );
  const outstanding = payments.filter((p) => p.status !== "confirmed");
  const upcoming = outstanding
    .filter(
      (p) =>
        (data.paymentPeriods.find((period) => period.id === p.paymentPeriodId)
          ?.dueDate ?? "") >= todayISO(),
    )
    .sort((a, b) => {
      const aDate =
        data.paymentPeriods.find((period) => period.id === a.paymentPeriodId)
          ?.dueDate ?? "";
      const bDate =
        data.paymentPeriods.find((period) => period.id === b.paymentPeriodId)
          ?.dueDate ?? "";
      return aDate.localeCompare(bDate);
    });
  return (
    <div className="space-y-7">
      <PageHeader
        title={`Hello, ${tenant.firstName}`}
        description="Your lease and rent payments at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Monthly share"
          value={share ? formatCurrency(share.amountCents) : "—"}
          detail={
            currentLease?.status === "active"
              ? "Current lease"
              : "No active lease"
          }
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(
            outstanding.reduce((sum, p) => sum + p.amountCents, 0),
          )}
          detail={`${outstanding.length} unconfirmed payments`}
        />
        <StatCard
          label="Next due"
          value={
            upcoming[0]
              ? formatDate(
                  data.paymentPeriods.find(
                    (p) => p.id === upcoming[0].paymentPeriodId,
                  )?.dueDate ?? "",
                )
              : "Nothing due"
          }
          detail={
            upcoming[0]
              ? formatCurrency(upcoming[0].amountCents)
              : "You’re all caught up"
          }
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current home</CardTitle>
          </CardHeader>
          <CardContent>
            {currentLease && apartment ? (
              <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
                <div className="grid size-14 place-items-center rounded-xl bg-emerald-50">
                  <Building2 className="size-6 text-emerald-700" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-zinc-950">
                      {apartment.name}
                    </h2>
                    <Badge tone={currentLease.status}>
                      {currentLease.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">
                    {apartment.address}, {apartment.city}
                  </p>
                  <p className="mt-4 text-sm text-zinc-700">
                    <DateRange
                      start={currentLease.startDate}
                      end={currentLease.endDate}
                    />
                  </p>
                  <Link href="/tenant/lease" className="mt-4 inline-block">
                    <Button variant="outline">View my lease</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                No lease is assigned to this tenant.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.slice(0, 3).map((payment) => {
              const period = data.paymentPeriods.find(
                (p) => p.id === payment.paymentPeriodId,
              );
              return (
                <Link
                  href="/tenant/payments"
                  key={payment.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50"
                >
                  <CalendarDays className="size-4 text-emerald-700" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {formatCurrency(payment.amountCents)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Due {period ? formatDate(period.dueDate) : "—"}
                    </p>
                  </div>
                </Link>
              );
            })}
            {!upcoming.length && (
              <p className="py-6 text-center text-sm text-zinc-500">
                No upcoming payments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
