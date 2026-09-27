"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveRecord, confirmPayment, reportPayment } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function ArchiveButton({ kind, id, destination }: { kind: "apartment" | "tenant" | "lease" | "period"; id: string; destination: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function archive() {
    if (!window.confirm(`Archive this ${kind}? It will remain in history and cannot be restored here.`)) return;
    setBusy(true);
    const result = await archiveRecord(kind, id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.push(destination);
    router.refresh();
  }
  return <span className="inline-flex flex-col gap-1"><Button type="button" variant="danger" onClick={archive} disabled={busy}>Archive {kind}</Button>{error && <span role="alert" className="text-xs text-rose-700">{error}</span>}</span>;
}

export function ReportPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function report() {
    if (!window.confirm("Have you sent this transfer? Reporting it does not send money.")) return;
    setBusy(true);
    const result = await reportPayment(id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  }
  return <span className="inline-flex flex-col gap-1"><Button type="button" size="sm" onClick={report} disabled={busy}>Report transfer</Button>{error && <span role="alert" className="text-xs text-rose-700">{error}</span>}</span>;
}

export function ConfirmPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (!window.confirm("Confirm that this transfer was received?")) return;
    setBusy(true);
    const result = await confirmPayment(id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  }
  return <span className="inline-flex flex-col gap-1"><Button type="button" size="sm" onClick={confirm} disabled={busy}>Confirm received</Button>{error && <span role="alert" className="text-xs text-rose-700">{error}</span>}</span>;
}
