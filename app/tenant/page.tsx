"use client";

import { useApiResource } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";
import type { TenantDashboard } from "@/lib/types";

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
import { formatCurrency, formatDate } from "@/lib/domain";

export default function Page() {
  const request = useApiResource<TenantDashboard>("/api/tenant/dashboard");
  if (!request.data) return <ApiStatus resources={[request]} />;
  const {
    tenant,
    currentLease,
    apartment,
    shareCents,
    outstandingCents,
    outstandingCount,
    nextPayment,
    upcomingPayments: upcoming,
  } = request.data;
  if (!tenant)
    return (
      <EmptyState
        title="Tenant profile unavailable"
        description="Your account does not have a tenant profile. Contact the site administrator."
      />
    );
  return (
    <div className="space-y-7">
      <PageHeader
        title={`Hello, ${tenant.firstName}`}
        description="Your lease and rent payments at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Monthly share"
          value={shareCents !== null ? formatCurrency(shareCents) : "—"}
          detail={
            currentLease?.status === "active"
              ? "Current lease"
              : "No active lease"
          }
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(outstandingCents)}
          detail={`${outstandingCount} unconfirmed payments`}
        />
        <StatCard
          label="Next due"
          value={nextPayment ? formatDate(nextPayment.dueDate) : "Nothing due"}
          detail={
            nextPayment
              ? formatCurrency(nextPayment.amountCents)
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
                <div className="grid size-14 place-items-center rounded-xl bg-brand-surface/40">
                  <Building2 className="size-6 text-brand" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {apartment.name}
                    </h2>
                    <Badge tone={currentLease.status}>
                      {currentLease.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {apartment.address}
                  </p>
                  <p className="mt-4 text-sm text-soft-foreground">
                    <DateRange
                      start={currentLease.startDate}
                      end={currentLease.endDate}
                    />
                  </p>
                  <Link href="/tenant/lease" className="mt-4 inline-block">
                    <Button variant="outline">View my leases</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No current or upcoming lease is available.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((payment) => {
              return (
                <Link
                  href="/tenant/payments"
                  key={payment.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent"
                >
                  <CalendarDays className="size-4 text-brand" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(payment.amountCents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(payment.dueDate)}
                    </p>
                  </div>
                </Link>
              );
            })}
            {!upcoming.length && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No upcoming payments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
