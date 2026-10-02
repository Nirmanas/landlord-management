"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useApiCollection } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, todayISO } from "@/lib/domain";

export function SignInSummary({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const isTenant = pathname.startsWith("/tenant");
  const role = isTenant ? "tenant" : "landlord";
  const periodsRequest = useApiCollection(role, "periods");
  const paymentsRequest = useApiCollection(role, "payments");
  const resources = [periodsRequest, paymentsRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent>
          <DialogTitle>Your sign in summary</DialogTitle>
          <DialogDescription>Checking your payments.</DialogDescription>
          <ApiStatus resources={resources} />
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Continue to dashboard
          </DialogClose>
        </DialogContent>
      </Dialog>
    );
  const paymentPeriods = periodsRequest.data ?? [];
  const tenantPayments = paymentsRequest.data ?? [];
  const today = todayISO();
  const periods = new Map(paymentPeriods.map((period) => [period.id, period]));
  const overdue = tenantPayments.filter((payment) => {
    const dueDate = periods.get(payment.paymentPeriodId)?.dueDate;
    return Boolean(
      dueDate &&
      dueDate < today &&
      (payment.status === "unpaid" || payment.status === "failed"),
    );
  }).length;
  const failed = tenantPayments.filter((payment) => {
    const dueDate = periods.get(payment.paymentPeriodId)?.dueDate;
    return payment.status === "failed" && (!dueDate || dueDate >= today);
  }).length;
  const pending = tenantPayments.filter(
    (payment) => payment.status === "pending",
  ).length;
  const upcomingDates = tenantPayments
    .filter((payment) => payment.status === "unpaid")
    .map((payment) => periods.get(payment.paymentPeriodId)?.dueDate)
    .filter((dueDate): dueDate is string =>
      Boolean(dueDate && dueDate >= today),
    )
    .sort();
  const upcoming = upcomingDates.length;
  const nextDue = upcomingDates[0];

  let title = "Everything is on track";
  let description =
    upcoming > 0
      ? "There are no overdue payments or reports waiting for review."
      : "There are no payments that need attention right now.";
  if (overdue > 0) {
    title = `${overdue} overdue payment${overdue === 1 ? "" : "s"}`;
    description = isTenant
      ? "Review your rent payments and report any transfers you have made."
      : "Check the overdue payments across your properties.";
  } else if (failed > 0) {
    title = `${failed} failed payment${failed === 1 ? "" : "s"}`;
    description = "Review the failed payments and take the next step.";
  } else if (pending > 0) {
    title = `${pending} payment${pending === 1 ? "" : "s"} ${isTenant ? "in review" : "to confirm"}`;
    description = isTenant
      ? "Your reported payments are waiting for confirmation."
      : "Tenants have reported payments that are ready for your review.";
  }

  const paymentsPath = isTenant ? "/tenant/payments" : "/landlord/payments";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg gap-0 bg-popover p-6 text-popover-foreground sm:max-w-lg sm:p-8">
        <div
          className={`grid size-12 place-items-center rounded-xl ${overdue || failed ? "bg-destructive-surface/40 text-destructive" : "bg-brand-surface/40 text-brand"}`}
        >
          {overdue || failed ? (
            <AlertCircle className="size-6" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-6" aria-hidden="true" />
          )}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand">
          Your sign in summary
        </p>
        <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-2 leading-6 text-muted-foreground">
          {description}
        </DialogDescription>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-strong-border bg-background p-3 sm:p-4">
            <AlertCircle
              className="size-4 text-destructive"
              aria-hidden="true"
            />
            <p className="mt-3 text-2xl font-semibold">{overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="rounded-xl border border-strong-border bg-background p-3 sm:p-4">
            <Clock3 className="size-4 text-warning" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">{pending}</p>
            <p className="text-xs text-muted-foreground">
              {isTenant ? "In review" : "To confirm"}
            </p>
          </div>
          <div className="rounded-xl border border-strong-border bg-background p-3 sm:p-4">
            <CalendarDays className="size-4 text-brand" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">{upcoming}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </div>
        </div>
        {failed > 0 && (
          <p className="mt-4 text-sm text-destructive">
            {failed} failed payment{failed === 1 ? "" : "s"}{" "}
            {failed === 1 ? "needs" : "need"} attention.
          </p>
        )}
        {nextDue && (
          <p className="mt-4 text-sm text-muted-foreground">
            Next payment due {formatDate(nextDue)}.
          </p>
        )}

        <DialogFooter className="mx-0 mb-0 mt-7 border-0 bg-transparent p-0">
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Continue to dashboard
          </DialogClose>
          {(overdue > 0 || failed > 0 || pending > 0) && (
            <Button render={<Link href={paymentsPath} onClick={onClose} />}>
              View payments <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
