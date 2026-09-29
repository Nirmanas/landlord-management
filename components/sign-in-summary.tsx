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
import { useAppData } from "@/components/data-provider";
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
  const data = useAppData();
  const today = todayISO();
  const periods = new Map(data.paymentPeriods.map((period) => [period.id, period]));
  const overdue = data.tenantPayments.filter((payment) => {
    const dueDate = periods.get(payment.paymentPeriodId)?.dueDate;
    return Boolean(
      dueDate &&
      dueDate < today &&
      (payment.status === "unpaid" || payment.status === "failed"),
    );
  }).length;
  const failed = data.tenantPayments.filter((payment) => {
    const dueDate = periods.get(payment.paymentPeriodId)?.dueDate;
    return payment.status === "failed" && (!dueDate || dueDate >= today);
  }).length;
  const pending = data.tenantPayments.filter(
    (payment) => payment.status === "pending",
  ).length;
  const upcomingDates = data.tenantPayments
    .filter((payment) => payment.status === "unpaid")
    .map((payment) => periods.get(payment.paymentPeriodId)?.dueDate)
    .filter((dueDate): dueDate is string => Boolean(dueDate && dueDate >= today))
    .sort();
  const upcoming = upcomingDates.length;
  const nextDue = upcomingDates[0];

  let title = "Everything is on track";
  let description = upcoming > 0
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg gap-0 bg-white p-6 text-zinc-950 sm:max-w-lg sm:p-8">
        <div className={`grid size-12 place-items-center rounded-xl ${overdue || failed ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {overdue || failed ? <AlertCircle className="size-6" aria-hidden="true" /> : <CheckCircle2 className="size-6" aria-hidden="true" />}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-emerald-700">Your sign in summary</p>
        <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight">{title}</DialogTitle>
        <DialogDescription className="mt-2 leading-6 text-zinc-600">{description}</DialogDescription>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
            <AlertCircle className="size-4 text-rose-600" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">{overdue}</p>
            <p className="text-xs text-zinc-600">Overdue</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
            <Clock3 className="size-4 text-amber-600" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">{pending}</p>
            <p className="text-xs text-zinc-600">{isTenant ? "In review" : "To confirm"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
            <CalendarDays className="size-4 text-emerald-700" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold">{upcoming}</p>
            <p className="text-xs text-zinc-600">Upcoming</p>
          </div>
        </div>
        {failed > 0 && <p className="mt-4 text-sm text-rose-700">{failed} failed payment{failed === 1 ? "" : "s"} {failed === 1 ? "needs" : "need"} attention.</p>}
        {nextDue && <p className="mt-4 text-sm text-zinc-600">Next payment due {formatDate(nextDue)}.</p>}

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
