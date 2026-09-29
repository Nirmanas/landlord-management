"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { archiveRecord, confirmPayment, reportPayment } from "@/app/actions";
import { apiPath, apiRequest } from "@/lib/api-client";
import { useAppData, useReloadAppData } from "@/components/data-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, tenantName } from "@/lib/domain";

export function ArchiveButton({ kind, id, destination }: { kind: "apartment" | "tenant" | "lease" | "period"; id: string; destination: string }) {
  const router = useRouter();
  const reload = useReloadAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function archive() {
    if (!window.confirm(`Archive this ${kind}? It will remain in history and cannot be restored here.`)) return;
    setBusy(true);
    try {
      if (kind === "tenant") {
        const result = await archiveRecord(kind, id);
        if (!result.ok) throw new Error(result.error);
      } else {
        await apiRequest(apiPath(kind === "apartment" ? "apartments" : kind === "lease" ? "leases" : "periods", id), "DELETE");
        try { await reload(); }
        catch { window.location.assign(destination); return; }
      }
      router.push(destination);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request failed.");
    } finally { setBusy(false); }
  }
  return <span className="inline-flex flex-col gap-1"><Button type="button" variant="destructive" onClick={archive} disabled={busy}>Archive {kind}</Button>{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</span>;
}

function PaymentActionButton({ id, mode }: { id: string; mode: "report" | "confirm" }) {
  const router = useRouter();
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const payment = data.tenantPayments.find((item) => item.id === id);
  const period = data.paymentPeriods.find((item) => item.id === payment?.paymentPeriodId);
  const lease = data.leases.find((item) => item.id === payment?.leaseId);
  const apartment = data.apartments.find((item) => item.id === lease?.apartmentId);
  const tenant = data.tenants.find((item) => item.id === payment?.tenantId);
  const reporting = mode === "report";
  const label = reporting ? "Confirm transfer" : "Confirm received";
  const title = reporting ? "Confirm transfer sent?" : "Confirm payment received?";
  const description = reporting
    ? "Confirm only after you have sent this transfer. This records your report for the landlord to review; it does not send money."
    : "Confirm only after the money has reached you. This will mark the payment as complete.";
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = reporting ? await reportPayment(id) : await confirmPayment(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (busy) return;
        setOpen(nextOpen);
        if (!nextOpen) setError("");
      }}
    >
      <AlertDialogTrigger render={<Button type="button" size="sm" disabled={busy} />}>
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent
        className="w-[calc(100%-2rem)] gap-0 bg-popover p-6 text-popover-foreground data-[size=default]:max-w-md data-[size=default]:sm:max-w-md sm:p-7"
      >
        <div className="grid size-12 place-items-center rounded-xl bg-brand-surface/40 text-brand">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <AlertDialogTitle className="mt-5 text-xl font-semibold tracking-tight">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-left leading-6 text-muted-foreground">
          {description}
        </AlertDialogDescription>
        <dl className="mt-5 divide-y divide-border rounded-xl border border-strong-border px-4 text-sm">
          <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Amount</dt><dd className="font-semibold">{payment ? formatCurrency(payment.amountCents) : "—"}</dd></div>
          {apartment && <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Apartment</dt><dd className="text-right font-medium">{apartment.name}</dd></div>}
          {!reporting && tenant && <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Tenant</dt><dd className="text-right font-medium">{tenantName(tenant)}</dd></div>}
          {period && <div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Due</dt><dd className="font-medium">{formatDate(period.dueDate)}</dd></div>}
        </dl>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <AlertDialogFooter className="mx-0 mb-0 mt-6 border-0 bg-transparent p-0">
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction type="button" onClick={submit} disabled={busy || !payment}>
            {busy ? "Saving…" : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReportPaymentButton({ id }: { id: string }) {
  return <PaymentActionButton id={id} mode="report" />;
}

export function ConfirmPaymentButton({ id }: { id: string }) {
  return <PaymentActionButton id={id} mode="confirm" />;
}
